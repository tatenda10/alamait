const db = require('../services/db');
const multer = require('multer');
const path = require('path');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/petty-cash-receipts/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'petty-cash-receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('receipt');

// Create a new petty cash account
exports.createPettyCashAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      account_name,
      assigned_user_id,
      initial_balance = 0
    } = req.body;
    
    const boarding_house_id = req.headers['boarding-house-id'];
    const created_by = req.user?.id || 1;
    
    if (!boarding_house_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }
    
    if (!account_name || !assigned_user_id) {
      return res.status(400).json({ message: 'Account name and assigned user are required' });
    }
    
    // Generate account code
    const [existingAccounts] = await connection.query(
      `SELECT account_code FROM petty_cash_accounts 
       WHERE boarding_house_id = ? AND deleted_at IS NULL 
       ORDER BY account_code DESC LIMIT 1`,
      [boarding_house_id]
    );
    
    let account_code;
    if (existingAccounts.length === 0) {
      account_code = 'PC001';
    } else {
      const lastCode = existingAccounts[0].account_code;
      const lastNumber = parseInt(lastCode.substring(2));
      account_code = `PC${String(lastNumber + 1).padStart(3, '0')}`;
    }
    
    // Verify assigned user exists and belongs to the boarding house
    const [users] = await connection.query(
      `SELECT u.id FROM users u 
       JOIN boarding_house_admins bha ON u.id = bha.user_id 
       WHERE u.id = ? AND bha.boarding_house_id = ? AND u.deleted_at IS NULL`,
      [assigned_user_id, boarding_house_id]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid assigned user or user not associated with boarding house' });
    }
    
    // Create petty cash account
    const [result] = await connection.query(
      `INSERT INTO petty_cash_accounts 
       (account_name, account_code, assigned_user_id, boarding_house_id, initial_balance, current_balance, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [account_name, account_code, assigned_user_id, boarding_house_id, initial_balance, initial_balance, created_by]
    );
    
    // If initial balance > 0, create an issuance record
    if (parseFloat(initial_balance) > 0) {
      await connection.query(
        `INSERT INTO petty_cash_issuances 
         (petty_cash_account_id, amount, issuance_date, issued_by, purpose, status, approved_by, approved_at)
         VALUES (?, ?, CURDATE(), ?, 'Initial balance setup', 'issued', ?, NOW())`,
        [result.insertId, initial_balance, created_by, created_by]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Petty cash account created successfully',
      data: {
        id: result.insertId,
        account_name,
        account_code,
        assigned_user_id,
        initial_balance,
        current_balance: initial_balance
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating petty cash account:', error);
    res.status(500).json({ message: 'Error creating petty cash account' });
  } finally {
    connection.release();
  }
};

// Get all petty cash accounts for a boarding house
exports.getPettyCashAccounts = async (req, res) => {
  try {
    const boarding_house_id = req.headers['boarding-house-id'];
    
    if (!boarding_house_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }
    
    const [accounts] = await db.query(
      `SELECT 
        pca.*,
        u.username as assigned_user_name,
        u.email as assigned_user_email,
        creator.username as created_by_name
       FROM petty_cash_accounts pca
       JOIN users u ON pca.assigned_user_id = u.id
       JOIN users creator ON pca.created_by = creator.id
       WHERE pca.boarding_house_id = ? AND pca.deleted_at IS NULL
       ORDER BY pca.created_at DESC`,
      [boarding_house_id]
    );
    
    res.json({ data: accounts });
    
  } catch (error) {
    console.error('Error fetching petty cash accounts:', error);
    res.status(500).json({ message: 'Error fetching petty cash accounts' });
  }
};

// Get a specific petty cash account by ID
exports.getPettyCashAccountById = async (req, res) => {
  try {
    const { accountId } = req.params;
    const boarding_house_id = req.headers['boarding-house-id'];
    
    if (!boarding_house_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }
    
    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }
    
    const [accounts] = await db.query(
      `SELECT 
        pca.*,
        u.username as assigned_user_name,
        u.email as assigned_user_email,
        creator.username as created_by_name
       FROM petty_cash_accounts pca
       JOIN users u ON pca.assigned_user_id = u.id
       JOIN users creator ON pca.created_by = creator.id
       WHERE pca.id = ? AND pca.boarding_house_id = ? AND pca.deleted_at IS NULL`,
      [accountId, boarding_house_id]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Petty cash account not found' });
    }
    
    res.json({ data: accounts[0] });
    
  } catch (error) {
    console.error('Error fetching petty cash account:', error);
    res.status(500).json({ message: 'Error fetching petty cash account' });
  }
};

// Get transactions for a specific petty cash account
exports.getPettyCashAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const boarding_house_id = req.headers['boarding-house-id'];
    const { start_date, end_date, limit = 50 } = req.query;
    
    if (!boarding_house_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }
    
    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }
    
    // Verify account exists and belongs to the boarding house
    const [accountCheck] = await db.query(
      `SELECT id FROM petty_cash_accounts 
       WHERE id = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
      [accountId, boarding_house_id]
    );
    
    if (accountCheck.length === 0) {
      return res.status(404).json({ message: 'Petty cash account not found' });
    }
    
    let dateFilter = '';
    let queryParams = [accountId, accountId];
    
    if (start_date && end_date) {
      dateFilter = 'AND (i.issuance_date BETWEEN ? AND ? OR e.expense_date BETWEEN ? AND ?)';
      queryParams.push(start_date, end_date, start_date, end_date);
    }
    
    const [transactions] = await db.query(
      `SELECT 
        'issuance' as transaction_type,
        i.id,
        i.issuance_date as created_at,
        i.amount,
        0 as expense_amount,
        i.amount as balance_change,
        i.purpose as description,
        i.reference_number,
        i.notes,
        i.status,
        issuer.username as created_by_name,
        NULL as balance_after
       FROM petty_cash_issuances i
       JOIN users issuer ON i.issued_by = issuer.id
       WHERE i.petty_cash_account_id = ? AND i.deleted_at IS NULL ${dateFilter}
       
       UNION ALL
       
       SELECT 
        'expense' as transaction_type,
        e.id,
        e.expense_date as created_at,
        0 as amount,
        e.amount as expense_amount,
        -e.amount as balance_change,
        e.description,
        e.receipt_number as reference_number,
        e.notes,
        e.status,
        submitter.username as created_by_name,
        NULL as balance_after
       FROM petty_cash_expenses e
       JOIN users submitter ON e.submitted_by = submitter.id
       WHERE e.petty_cash_account_id = ? AND e.deleted_at IS NULL ${dateFilter}
       
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [...queryParams, parseInt(limit)]
    );
    
    res.json({ transactions });
    
  } catch (error) {
    console.error('Error fetching petty cash transactions:', error);
    res.status(500).json({ message: 'Error fetching petty cash transactions' });
  }
};

// Issue cash to petty cash account
exports.issueCash = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      petty_cash_account_id,
      amount,
      purpose,
      reference_number,
      notes
    } = req.body;
    
    const issued_by = req.user?.id || 1;
    
    if (!petty_cash_account_id || !amount || !purpose) {
      return res.status(400).json({ message: 'Petty cash account, amount, and purpose are required' });
    }
    
    const issuanceAmount = parseFloat(amount);
    if (isNaN(issuanceAmount) || issuanceAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    // Verify petty cash account exists
    const [accounts] = await connection.query(
      `SELECT * FROM petty_cash_accounts WHERE id = ? AND deleted_at IS NULL`,
      [petty_cash_account_id]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Petty cash account not found' });
    }
    
    const account = accounts[0];
    
    // Create issuance record
    const [issuanceResult] = await connection.query(
      `INSERT INTO petty_cash_issuances 
       (petty_cash_account_id, amount, issuance_date, issued_by, reference_number, purpose, notes, status, approved_by, approved_at)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, 'issued', ?, NOW())`,
      [petty_cash_account_id, issuanceAmount, issued_by, reference_number, purpose, notes, issued_by]
    );
    
    // Update petty cash account balance
    await connection.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = current_balance + ?, updated_at = NOW()
       WHERE id = ?`,
      [issuanceAmount, petty_cash_account_id]
    );
    
    // Create transaction record for journal entries
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions 
       (transaction_type, reference, amount, currency, description, transaction_date, boarding_house_id, created_by, status)
       VALUES ('petty_cash_issuance', ?, ?, 'USD', ?, CURDATE(), ?, ?, 'posted')`,
      [reference_number || `PCI-${issuanceResult.insertId}`, issuanceAmount, purpose, account.boarding_house_id, issued_by]
    );
    
    // Get petty cash account from COA
    const [pettyCashAccount] = await connection.query(
      `SELECT id FROM chart_of_accounts_branch 
       WHERE code = '10001' AND branch_id = ? AND deleted_at IS NULL`,
      [account.boarding_house_id]
    );
    
    // Get main cash account from COA
    const [mainCashAccount] = await connection.query(
      `SELECT id FROM chart_of_accounts_branch 
       WHERE code = '10002' AND branch_id = ? AND deleted_at IS NULL`,
      [account.boarding_house_id]
    );
    
    if (pettyCashAccount.length > 0 && mainCashAccount.length > 0) {
      // Debit Petty Cash
      await connection.query(
        `INSERT INTO journal_entries 
         (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by)
         VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
        [transactionResult.insertId, pettyCashAccount[0].id, issuanceAmount, purpose, account.boarding_house_id, issued_by]
      );
      
      // Credit Main Cash
      await connection.query(
        `INSERT INTO journal_entries 
         (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by)
         VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
        [transactionResult.insertId, mainCashAccount[0].id, issuanceAmount, purpose, account.boarding_house_id, issued_by]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Cash issued successfully',
      data: {
        issuance_id: issuanceResult.insertId,
        amount: issuanceAmount,
        new_balance: account.current_balance + issuanceAmount
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error issuing cash:', error);
    res.status(500).json({ message: 'Error issuing cash' });
  } finally {
    connection.release();
  }
};

// Record petty cash expense
exports.recordExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      petty_cash_account_id,
      amount,
      description,
      expense_category,
      expense_account_id,
      vendor_name,
      receipt_number,
      notes
    } = req.body;
    
    const submitted_by = req.user?.id || 1;
    
    if (!petty_cash_account_id || !amount || !description) {
      return res.status(400).json({ message: 'Petty cash account, amount, and description are required' });
    }
    
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    // Verify petty cash account exists and has sufficient balance
    const [accounts] = await connection.query(
      `SELECT * FROM petty_cash_accounts WHERE id = ? AND deleted_at IS NULL`,
      [petty_cash_account_id]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Petty cash account not found' });
    }
    
    const account = accounts[0];
    
    if (account.current_balance < expenseAmount) {
      return res.status(400).json({ message: 'Insufficient petty cash balance' });
    }
    
    // Handle receipt file if uploaded
    let receiptPath = null;
    let receiptName = null;
    if (req.file) {
      receiptPath = path.relative(path.join(__dirname, '../../../uploads'), req.file.path);
      receiptName = req.file.originalname;
    }
    
    // Create expense record
    const [expenseResult] = await connection.query(
      `INSERT INTO petty_cash_expenses 
       (petty_cash_account_id, expense_date, amount, description, expense_category, expense_account_id, 
        vendor_name, receipt_number, receipt_path, receipt_original_name, notes, submitted_by, status)
       VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [petty_cash_account_id, expenseAmount, description, expense_category, expense_account_id, 
       vendor_name, receipt_number, receiptPath, receiptName, notes, submitted_by]
    );
    
    // Update petty cash account balance
    await connection.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = current_balance - ?, updated_at = NOW()
       WHERE id = ?`,
      [expenseAmount, petty_cash_account_id]
    );
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions 
       (transaction_type, reference, amount, currency, description, transaction_date, boarding_house_id, created_by, status)
       VALUES ('petty_cash_expense', ?, ?, 'USD', ?, CURDATE(), ?, ?, 'posted')`,
      [`PCE-${expenseResult.insertId}`, expenseAmount, description, account.boarding_house_id, submitted_by]
    );
    
    // Update expense record with transaction ID
    await connection.query(
      `UPDATE petty_cash_expenses SET transaction_id = ? WHERE id = ?`,
      [transactionResult.insertId, expenseResult.insertId]
    );
    
    // Create journal entries if expense account is provided
    if (expense_account_id) {
      // Get petty cash account from COA
      const [pettyCashAccount] = await connection.query(
        `SELECT id FROM chart_of_accounts_branch 
         WHERE code = '10001' AND branch_id = ? AND deleted_at IS NULL`,
        [account.boarding_house_id]
      );
      
      if (pettyCashAccount.length > 0) {
        // Debit Expense Account
        await connection.query(
          `INSERT INTO journal_entries 
           (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by)
           VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
          [transactionResult.insertId, expense_account_id, expenseAmount, description, account.boarding_house_id, submitted_by]
        );
        
        // Credit Petty Cash
        await connection.query(
          `INSERT INTO journal_entries 
           (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by)
           VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
          [transactionResult.insertId, pettyCashAccount[0].id, expenseAmount, description, account.boarding_house_id, submitted_by]
        );
      }
    }
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Expense recorded successfully',
      data: {
        expense_id: expenseResult.insertId,
        amount: expenseAmount,
        new_balance: account.current_balance - expenseAmount
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error recording expense:', error);
    res.status(500).json({ message: 'Error recording expense' });
  } finally {
    connection.release();
  }
};

// Get petty cash ledger for an account
exports.getPettyCashLedger = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }
    
    let dateFilter = '';
    let queryParams = [accountId, accountId];
    
    if (start_date && end_date) {
      dateFilter = 'AND (i.issuance_date BETWEEN ? AND ? OR e.expense_date BETWEEN ? AND ?)';
      queryParams.push(start_date, end_date, start_date, end_date);
    }
    
    const [ledgerEntries] = await db.query(
      `SELECT 
        'issuance' as type,
        i.id,
        i.issuance_date as transaction_date,
        i.amount,
        0 as expense_amount,
        i.amount as balance_change,
        i.purpose as description,
        i.reference_number,
        i.notes,
        i.status,
        issuer.username as created_by_name
       FROM petty_cash_issuances i
       JOIN users issuer ON i.issued_by = issuer.id
       WHERE i.petty_cash_account_id = ? AND i.deleted_at IS NULL ${dateFilter}
       
       UNION ALL
       
       SELECT 
        'expense' as type,
        e.id,
        e.expense_date as transaction_date,
        0 as amount,
        e.amount as expense_amount,
        -e.amount as balance_change,
        e.description,
        e.receipt_number as reference_number,
        e.notes,
        e.status,
        submitter.username as created_by_name
       FROM petty_cash_expenses e
       JOIN users submitter ON e.submitted_by = submitter.id
       WHERE e.petty_cash_account_id = ? AND e.deleted_at IS NULL ${dateFilter}
       
       ORDER BY transaction_date DESC, id DESC`,
      queryParams
    );
    
    // Get account details
    const [accountDetails] = await db.query(
      `SELECT 
        pca.*,
        u.username as assigned_user_name
       FROM petty_cash_accounts pca
       JOIN users u ON pca.assigned_user_id = u.id
       WHERE pca.id = ? AND pca.deleted_at IS NULL`,
      [accountId]
    );
    
    if (accountDetails.length === 0) {
      return res.status(404).json({ message: 'Petty cash account not found' });
    }
    
    res.json({
      account: accountDetails[0],
      ledger: ledgerEntries
    });
    
  } catch (error) {
    console.error('Error fetching petty cash ledger:', error);
    res.status(500).json({ message: 'Error fetching petty cash ledger' });
  }
};

// Create reconciliation
exports.createReconciliation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      petty_cash_account_id,
      physical_count,
      variance_explanation,
      notes
    } = req.body;
    
    const reconciled_by = req.user?.id || 1;
    
    if (!petty_cash_account_id || physical_count === undefined) {
      return res.status(400).json({ message: 'Petty cash account and physical count are required' });
    }
    
    const physicalCount = parseFloat(physical_count);
    if (isNaN(physicalCount) || physicalCount < 0) {
      return res.status(400).json({ message: 'Invalid physical count' });
    }
    
    // Get current book balance
    const [accounts] = await connection.query(
      `SELECT current_balance FROM petty_cash_accounts WHERE id = ? AND deleted_at IS NULL`,
      [petty_cash_account_id]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Petty cash account not found' });
    }
    
    const bookBalance = parseFloat(accounts[0].current_balance);
    
    // Create reconciliation record
    const [result] = await connection.query(
      `INSERT INTO petty_cash_reconciliations 
       (petty_cash_account_id, reconciliation_date, book_balance, physical_count, 
        variance_explanation, reconciled_by, notes)
       VALUES (?, CURDATE(), ?, ?, ?, ?, ?)`,
      [petty_cash_account_id, bookBalance, physicalCount, variance_explanation, reconciled_by, notes]
    );
    
    await connection.commit();
    
    const variance = physicalCount - bookBalance;
    
    res.status(201).json({
      message: 'Reconciliation created successfully',
      data: {
        reconciliation_id: result.insertId,
        book_balance: bookBalance,
        physical_count: physicalCount,
        variance: variance
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating reconciliation:', error);
    res.status(500).json({ message: 'Error creating reconciliation' });
  } finally {
    connection.release();
  }
};

// Get reconciliation reports
exports.getReconciliationReports = async (req, res) => {
  try {
    const boarding_house_id = req.headers['boarding-house-id'];
    const { start_date, end_date, account_id } = req.query;
    
    if (!boarding_house_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }
    
    let whereClause = 'WHERE pca.boarding_house_id = ? AND pcr.deleted_at IS NULL';
    let queryParams = [boarding_house_id];
    
    if (account_id) {
      whereClause += ' AND pcr.petty_cash_account_id = ?';
      queryParams.push(account_id);
    }
    
    if (start_date && end_date) {
      whereClause += ' AND pcr.reconciliation_date BETWEEN ? AND ?';
      queryParams.push(start_date, end_date);
    }
    
    const [reconciliations] = await db.query(
      `SELECT 
        pcr.*,
        pca.account_name,
        pca.account_code,
        u.username as assigned_user_name,
        reconciler.username as reconciled_by_name,
        reviewer.username as reviewed_by_name
       FROM petty_cash_reconciliations pcr
       JOIN petty_cash_accounts pca ON pcr.petty_cash_account_id = pca.id
       JOIN users u ON pca.assigned_user_id = u.id
       JOIN users reconciler ON pcr.reconciled_by = reconciler.id
       LEFT JOIN users reviewer ON pcr.reviewed_by = reviewer.id
       ${whereClause}
       ORDER BY pcr.reconciliation_date DESC`,
      queryParams
    );
    
    res.json({ data: reconciliations });
    
  } catch (error) {
    console.error('Error fetching reconciliation reports:', error);
    res.status(500).json({ message: 'Error fetching reconciliation reports' });
  }
};

// Middleware for file upload
exports.uploadReceipt = upload;

module.exports = exports;