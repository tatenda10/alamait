const db = require('../services/db');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/bank_statements'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bank-statement-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
}).single('bank_statement');

// Get bank accounts for reconciliation
exports.getBankAccounts = async (req, res) => {
  try {
    const [accounts] = await db.query(
      `SELECT 
        coa.id,
        coa.code,
        coa.name,
        coa.type,
        cab.current_balance,
        cab.total_debits,
        cab.total_credits,
        cab.transaction_count,
        cab.last_transaction_date
       FROM chart_of_accounts coa
       LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
       WHERE coa.type = 'Asset' 
         AND coa.code IN ('10003', '10004') -- CBZ Bank Account and CBZ Vault
         AND coa.deleted_at IS NULL
       ORDER BY coa.code`
    );

    res.json({
      data: accounts
    });
  } catch (error) {
    console.error('Error in getBankAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get unreconciled transactions for a bank account
exports.getUnreconciledTransactions = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { start_date, end_date } = req.query;

    // Verify account exists
    const [accountCheck] = await db.query(
      'SELECT * FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [account_id]
    );

    if (accountCheck.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Build query conditions
    let whereConditions = ['je.account_id = ?', 't.deleted_at IS NULL', 'je.deleted_at IS NULL', 't.status = "posted"'];
    let queryParams = [account_id];

    if (start_date && end_date) {
      whereConditions.push('DATE(t.transaction_date) BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }

    // Get unreconciled transactions
    const [transactions] = await db.query(
      `SELECT 
        je.id as journal_entry_id,
        t.id as transaction_id,
        t.transaction_date,
        t.reference,
        t.description,
        je.amount,
        je.entry_type,
        t.amount as transaction_amount,
        CASE 
          WHEN je.entry_type = 'debit' THEN je.amount
          ELSE 0
        END as debit_amount,
        CASE 
          WHEN je.entry_type = 'credit' THEN je.amount
          ELSE 0
        END as credit_amount,
        'unreconciled' as status,
        NULL as bank_reference,
        NULL as bank_date,
        NULL as bank_amount
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE ${whereConditions.join(' AND ')}
         AND NOT EXISTS (
           SELECT 1 FROM bank_reconciliation_items bri 
           WHERE bri.journal_entry_id = je.id AND bri.is_reconciled = true
         )
       ORDER BY t.transaction_date DESC, t.id DESC`,
      queryParams
    );

    // Get account current balance
    const [balanceResult] = await db.query(
      `SELECT current_balance FROM current_account_balances WHERE account_id = ?`,
      [account_id]
    );

    const currentBalance = balanceResult.length > 0 ? balanceResult[0].current_balance : 0;

    res.json({
      account: accountCheck[0],
      current_balance: currentBalance,
      transactions: transactions,
      summary: {
        total_debits: transactions.reduce((sum, t) => sum + parseFloat(t.debit_amount), 0),
        total_credits: transactions.reduce((sum, t) => sum + parseFloat(t.credit_amount), 0),
        transaction_count: transactions.length
      }
    });

  } catch (error) {
    console.error('Error in getUnreconciledTransactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Import bank statement
exports.importBankStatement = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const { account_id, statement_date, opening_balance, closing_balance } = req.body;

      if (!account_id || !statement_date || !opening_balance || !closing_balance) {
        return res.status(400).json({ 
          message: 'Account ID, statement date, opening balance, and closing balance are required' 
        });
      }

      // Verify account exists
      const [accountCheck] = await connection.query(
        'SELECT * FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
        [account_id]
      );

      if (accountCheck.length === 0) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Read the uploaded file
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: 'No data found in the uploaded file' });
      }

      // Create bank statement record
      const [statementResult] = await connection.query(
        `INSERT INTO bank_statements (
          account_id, statement_date, opening_balance, closing_balance,
          file_path, file_name, uploaded_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          account_id,
          statement_date,
          opening_balance,
          closing_balance,
          req.file.path,
          req.file.originalname,
          req.user?.id || 1
        ]
      );

      const statementId = statementResult.insertId;

      // Process bank statement items
      const processedItems = [];
      for (const row of data) {
        // Expected columns: Date, Description, Reference, Debit, Credit, Balance
        const bankDate = row.Date || row['Transaction Date'] || row.date;
        const description = row.Description || row['Transaction Description'] || row.description;
        const reference = row.Reference || row['Transaction Reference'] || row.reference;
        const debit = parseFloat(row.Debit || row.debit || 0);
        const credit = parseFloat(row.Credit || row.credit || 0);
        const balance = parseFloat(row.Balance || row.balance || 0);

        if (bankDate && (debit > 0 || credit > 0)) {
          const [itemResult] = await connection.query(
            `INSERT INTO bank_statement_items (
              statement_id, bank_date, description, reference,
              debit_amount, credit_amount, balance, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [statementId, bankDate, description, reference, debit, credit, balance]
          );

          processedItems.push({
            id: itemResult.insertId,
            bank_date: bankDate,
            description,
            reference,
            debit_amount: debit,
            credit_amount: credit,
            balance
          });
        }
      }

      await connection.commit();

      res.status(201).json({
        message: 'Bank statement imported successfully',
        data: {
          statement_id: statementId,
          account_id,
          statement_date,
          opening_balance,
          closing_balance,
          items_processed: processedItems.length,
          items: processedItems
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error in importBankStatement:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      connection.release();
    }
  });
};

// Create bank reconciliation
exports.createBankReconciliation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      account_id, 
      reconciliation_date, 
      book_balance, 
      bank_balance, 
      statement_id,
      notes 
    } = req.body;

    if (!account_id || !reconciliation_date || book_balance === undefined || bank_balance === undefined) {
      return res.status(400).json({ 
        message: 'Account ID, reconciliation date, book balance, and bank balance are required' 
      });
    }

    // Verify account exists
    const [accountCheck] = await connection.query(
      'SELECT * FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [account_id]
    );

    if (accountCheck.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if reconciliation already exists for this date
    const [existingReconciliation] = await connection.query(
      'SELECT id FROM bank_reconciliations WHERE account_id = ? AND reconciliation_date = ?',
      [account_id, reconciliation_date]
    );

    if (existingReconciliation.length > 0) {
      return res.status(400).json({ message: 'Reconciliation already exists for this date' });
    }

    const difference = parseFloat(book_balance) - parseFloat(bank_balance);

    // Create reconciliation record
    const [result] = await connection.query(
      `INSERT INTO bank_reconciliations (
        account_id, reconciliation_date, book_balance, bank_balance, 
        difference, statement_id, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        account_id, 
        reconciliation_date, 
        book_balance, 
        bank_balance, 
        difference, 
        statement_id || null,
        notes || null,
        req.user?.id || 1
      ]
    );

    const reconciliationId = result.insertId;

    // Get unreconciled transactions for this account up to the reconciliation date
    const [unreconciledTransactions] = await connection.query(
      `SELECT 
        je.id as journal_entry_id,
        t.id as transaction_id,
        t.transaction_date,
        t.reference,
        t.description,
        je.amount,
        je.entry_type
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE je.account_id = ?
         AND t.transaction_date <= ?
         AND t.deleted_at IS NULL
         AND je.deleted_at IS NULL
         AND t.status = 'posted'
         AND NOT EXISTS (
           SELECT 1 FROM bank_reconciliation_items bri 
           WHERE bri.journal_entry_id = je.id AND bri.is_reconciled = true
         )
       ORDER BY t.transaction_date, t.id`,
      [account_id, reconciliation_date]
    );

    // Create reconciliation items for unreconciled transactions
    for (const transaction of unreconciledTransactions) {
      await connection.query(
        `INSERT INTO bank_reconciliation_items (
          reconciliation_id, transaction_id, journal_entry_id, description,
          amount, entry_type, transaction_date, is_reconciled, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, false, NOW())`,
        [
          reconciliationId,
          transaction.transaction_id,
          transaction.journal_entry_id,
          transaction.description || transaction.reference,
          transaction.amount,
          transaction.entry_type,
          transaction.transaction_date
        ]
      );
    }

    // If statement_id is provided, get bank statement items
    if (statement_id) {
      const [bankItems] = await connection.query(
        `SELECT 
          id as statement_item_id,
          bank_date,
          description,
          reference,
          debit_amount,
          credit_amount,
          balance
         FROM bank_statement_items
         WHERE statement_id = ?
         ORDER BY bank_date, id`,
        [statement_id]
      );

      // Create reconciliation items for bank statement items
      for (const bankItem of bankItems) {
        await connection.query(
          `INSERT INTO bank_reconciliation_items (
            reconciliation_id, statement_item_id, description,
            amount, entry_type, transaction_date, is_reconciled, 
            bank_reference, bank_date, bank_amount, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, false, ?, ?, ?, NOW())`,
          [
            reconciliationId,
            bankItem.statement_item_id,
            bankItem.description,
            bankItem.debit_amount > 0 ? bankItem.debit_amount : bankItem.credit_amount,
            bankItem.debit_amount > 0 ? 'debit' : 'credit',
            bankItem.bank_date,
            bankItem.reference,
            bankItem.bank_date,
            bankItem.debit_amount > 0 ? bankItem.debit_amount : bankItem.credit_amount
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Bank reconciliation created successfully',
      data: {
        id: reconciliationId,
        account_id,
        reconciliation_date,
        book_balance,
        bank_balance,
        difference,
        unreconciled_items_count: unreconciledTransactions.length
      }
    });

  } catch (error) {
    console.error('Error in createBankReconciliation:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get bank reconciliation details
exports.getBankReconciliation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reconciliation details
    const [reconciliations] = await db.query(
      `SELECT 
        br.*,
        coa.code as account_code,
        coa.name as account_name,
        bs.statement_date,
        bs.opening_balance,
        bs.closing_balance,
        u.username as created_by_name
       FROM bank_reconciliations br
       JOIN chart_of_accounts coa ON br.account_id = coa.id
       LEFT JOIN bank_statements bs ON br.statement_id = bs.id
       LEFT JOIN users u ON br.created_by = u.id
       WHERE br.id = ?`,
      [id]
    );

    if (reconciliations.length === 0) {
      return res.status(404).json({ message: 'Reconciliation not found' });
    }

    const reconciliation = reconciliations[0];

    // Get reconciliation items
    const [items] = await db.query(
      `SELECT 
        bri.*,
        t.reference as transaction_reference,
        t.description as transaction_description,
        bsi.bank_date as statement_bank_date,
        bsi.reference as statement_reference
       FROM bank_reconciliation_items bri
       LEFT JOIN transactions t ON bri.transaction_id = t.id
       LEFT JOIN bank_statement_items bsi ON bri.statement_item_id = bsi.id
       WHERE bri.reconciliation_id = ?
       ORDER BY bri.transaction_date, bri.id`,
      [id]
    );

    // Separate book items and bank items
    const bookItems = items.filter(item => item.transaction_id);
    const bankItems = items.filter(item => item.statement_item_id);

    res.json({
      reconciliation,
      items: {
        book: bookItems,
        bank: bankItems,
        all: items
      },
      summary: {
        total_book_items: bookItems.length,
        total_bank_items: bankItems.length,
        reconciled_book_items: bookItems.filter(item => item.is_reconciled).length,
        reconciled_bank_items: bankItems.filter(item => item.is_reconciled).length
      }
    });

  } catch (error) {
    console.error('Error in getBankReconciliation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update reconciliation items (match transactions)
exports.updateReconciliationItems = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { reconciliation_id, matches } = req.body;

    if (!reconciliation_id || !matches || !Array.isArray(matches)) {
      return res.status(400).json({ message: 'Reconciliation ID and matches array are required' });
    }

    // Verify reconciliation exists
    const [reconciliationCheck] = await connection.query(
      'SELECT * FROM bank_reconciliations WHERE id = ?',
      [reconciliation_id]
    );

    if (reconciliationCheck.length === 0) {
      return res.status(404).json({ message: 'Reconciliation not found' });
    }

    // Process matches
    for (const match of matches) {
      if (match.book_item_id && match.bank_item_id) {
        // Mark both items as reconciled
        await connection.query(
          `UPDATE bank_reconciliation_items 
           SET is_reconciled = true, 
               matched_with = ?,
               matched_at = NOW(),
               notes = ?
           WHERE id = ? AND reconciliation_id = ?`,
          [match.bank_item_id, match.notes || null, match.book_item_id, reconciliation_id]
        );

        await connection.query(
          `UPDATE bank_reconciliation_items 
           SET is_reconciled = true, 
               matched_with = ?,
               matched_at = NOW(),
               notes = ?
           WHERE id = ? AND reconciliation_id = ?`,
          [match.book_item_id, match.notes || null, match.bank_item_id, reconciliation_id]
        );
      }
    }

    // Update reconciliation status
    const [unreconciledCount] = await connection.query(
      'SELECT COUNT(*) as count FROM bank_reconciliation_items WHERE reconciliation_id = ? AND is_reconciled = false',
      [reconciliation_id]
    );

    const status = unreconciledCount[0].count === 0 ? 'reconciled' : 'pending';

    await connection.query(
      `UPDATE bank_reconciliations 
       SET status = ?, reconciled_by = ?, reconciled_at = ?
       WHERE id = ?`,
      [status, req.user?.id || 1, status === 'reconciled' ? new Date() : null, reconciliation_id]
    );

    await connection.commit();

    res.json({
      message: 'Reconciliation items updated successfully',
      status
    });

  } catch (error) {
    console.error('Error in updateReconciliationItems:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get bank reconciliation list
exports.getBankReconciliations = async (req, res) => {
  try {
    const { account_id, status, start_date, end_date } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];

    if (account_id) {
      whereConditions.push('br.account_id = ?');
      queryParams.push(account_id);
    }

    if (status) {
      whereConditions.push('br.status = ?');
      queryParams.push(status);
    }

    if (start_date && end_date) {
      whereConditions.push('br.reconciliation_date BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }

    const [reconciliations] = await db.query(
      `SELECT 
        br.*,
        coa.code as account_code,
        coa.name as account_name,
        u.username as created_by_name,
        COUNT(bri.id) as total_items,
        SUM(CASE WHEN bri.is_reconciled = true THEN 1 ELSE 0 END) as reconciled_items
       FROM bank_reconciliations br
       JOIN chart_of_accounts coa ON br.account_id = coa.id
       LEFT JOIN users u ON br.created_by = u.id
       LEFT JOIN bank_reconciliation_items bri ON br.id = bri.reconciliation_id
       WHERE ${whereConditions.join(' AND ')}
       GROUP BY br.id
       ORDER BY br.reconciliation_date DESC`,
      queryParams
    );

    res.json({
      data: reconciliations
    });

  } catch (error) {
    console.error('Error in getBankReconciliations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Auto-match transactions based on amount and date
exports.autoMatchTransactions = async (req, res) => {
  try {
    const { reconciliation_id } = req.params;

    // Get reconciliation items
    const [items] = await db.query(
      `SELECT 
        bri.*,
        t.reference as transaction_reference,
        t.description as transaction_description
       FROM bank_reconciliation_items bri
       LEFT JOIN transactions t ON bri.transaction_id = t.id
       WHERE bri.reconciliation_id = ?
       ORDER BY bri.transaction_date, bri.id`,
      [reconciliation_id]
    );

    const bookItems = items.filter(item => item.transaction_id && !item.is_reconciled);
    const bankItems = items.filter(item => item.statement_item_id && !item.is_reconciled);

    const matches = [];

    // Match by amount and date (within 3 days)
    for (const bookItem of bookItems) {
      for (const bankItem of bankItems) {
        const bookAmount = parseFloat(bookItem.amount);
        const bankAmount = parseFloat(bankItem.amount);
        const bookDate = new Date(bookItem.transaction_date);
        const bankDate = new Date(bankItem.bank_date);
        const dateDiff = Math.abs(bookDate - bankDate) / (1000 * 60 * 60 * 24);

        if (bookAmount === bankAmount && dateDiff <= 3) {
          matches.push({
            book_item_id: bookItem.id,
            bank_item_id: bankItem.id,
            confidence: 'high',
            reason: 'Amount and date match'
          });
          break; // Match found, move to next book item
        }
      }
    }

    res.json({
      matches,
      summary: {
        total_matches: matches.length,
        total_book_items: bookItems.length,
        total_bank_items: bankItems.length
      }
    });

  } catch (error) {
    console.error('Error in autoMatchTransactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  upload,
  getBankAccounts: exports.getBankAccounts,
  getUnreconciledTransactions: exports.getUnreconciledTransactions,
  importBankStatement: exports.importBankStatement,
  createBankReconciliation: exports.createBankReconciliation,
  getBankReconciliation: exports.getBankReconciliation,
  updateReconciliationItems: exports.updateReconciliationItems,
  getBankReconciliations: exports.getBankReconciliations,
  autoMatchTransactions: exports.autoMatchTransactions
};
