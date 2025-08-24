const db = require('../services/db');

// Get account ledger (like your CBZ Bank Account ledger)
exports.getAccountLedger = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { start_date, end_date } = req.query;

    // Verify account exists
    const [accountCheck] = await db.query(
      'SELECT * FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [accountId]
    );

    if (accountCheck.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accountCheck[0];

    // Build query conditions
    let whereConditions = ['atl.account_id = ?'];
    let queryParams = [accountId];

    if (start_date && end_date) {
      whereConditions.push('DATE(atl.transaction_date) BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }

    // Get ledger entries
    const [ledgerEntries] = await db.query(
      `SELECT 
        atl.transaction_date,
        atl.reference,
        atl.description,
        atl.credit_amount,
        atl.debit_amount,
        atl.running_balance,
        atl.transaction_id,
        atl.journal_entry_id
       FROM account_transaction_ledger atl
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY atl.transaction_date, atl.transaction_id, atl.journal_entry_id`,
      queryParams
    );

    // Get account summary
    const [summary] = await db.query(
      `SELECT 
        SUM(credit_amount) as total_credits,
        SUM(debit_amount) as total_debits,
        MAX(running_balance) as final_balance
       FROM account_transaction_ledger atl
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.json({
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type
      },
      ledger: ledgerEntries,
      summary: summary[0] || { total_credits: 0, total_debits: 0, final_balance: 0 }
    });

  } catch (error) {
    console.error('Error in getAccountLedger:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current account balances
exports.getCurrentBalances = async (req, res) => {
  try {
    const [balances] = await db.query(
      `SELECT * FROM current_account_balances 
       ORDER BY account_type, account_code`
    );

    res.json({
      data: balances
    });

  } catch (error) {
    console.error('Error in getCurrentBalances:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new reconciliation
exports.createReconciliation = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { account_id, reconciliation_date, book_balance, bank_balance, notes } = req.body;

    // Validate required fields
    if (!account_id || !reconciliation_date || book_balance === undefined || bank_balance === undefined) {
      return res.status(400).json({ message: 'Account ID, reconciliation date, book balance, and bank balance are required' });
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
      'SELECT id FROM account_reconciliations WHERE account_id = ? AND reconciliation_date = ?',
      [account_id, reconciliation_date]
    );

    if (existingReconciliation.length > 0) {
      return res.status(400).json({ message: 'Reconciliation already exists for this date' });
    }

    const difference = parseFloat(book_balance) - parseFloat(bank_balance);

    // Create reconciliation record
    const [result] = await connection.query(
      `INSERT INTO account_reconciliations (
        account_id, reconciliation_date, book_balance, bank_balance, 
        difference, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [account_id, reconciliation_date, book_balance, bank_balance, difference, notes || null]
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
           SELECT 1 FROM reconciliation_items ri 
           WHERE ri.journal_entry_id = je.id
         )
       ORDER BY t.transaction_date, t.id`,
      [account_id, reconciliation_date]
    );

    // Create reconciliation items for unreconciled transactions
    for (const transaction of unreconciledTransactions) {
      await connection.query(
        `INSERT INTO reconciliation_items (
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

    await connection.commit();

    res.status(201).json({
      message: 'Reconciliation created successfully',
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
    console.error('Error in createReconciliation:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get reconciliation details
exports.getReconciliation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reconciliation details
    const [reconciliations] = await db.query(
      `SELECT 
        ar.*,
        coa.code as account_code,
        coa.name as account_name,
        u.username as reconciled_by_name
       FROM account_reconciliations ar
       JOIN chart_of_accounts coa ON ar.account_id = coa.id
       LEFT JOIN users u ON ar.reconciled_by = u.id
       WHERE ar.id = ?`,
      [id]
    );

    if (reconciliations.length === 0) {
      return res.status(404).json({ message: 'Reconciliation not found' });
    }

    const reconciliation = reconciliations[0];

    // Get reconciliation items
    const [items] = await db.query(
      `SELECT 
        ri.*,
        t.reference as transaction_reference,
        t.description as transaction_description
       FROM reconciliation_items ri
       LEFT JOIN transactions t ON ri.transaction_id = t.id
       WHERE ri.reconciliation_id = ?
       ORDER BY ri.transaction_date, ri.id`,
      [id]
    );

    res.json({
      reconciliation,
      items
    });

  } catch (error) {
    console.error('Error in getReconciliation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update reconciliation items
exports.updateReconciliationItems = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { reconciliation_id, items } = req.body;

    if (!reconciliation_id || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Reconciliation ID and items array are required' });
    }

    // Verify reconciliation exists
    const [reconciliationCheck] = await connection.query(
      'SELECT * FROM account_reconciliations WHERE id = ?',
      [reconciliation_id]
    );

    if (reconciliationCheck.length === 0) {
      return res.status(404).json({ message: 'Reconciliation not found' });
    }

    // Update each reconciliation item
    for (const item of items) {
      if (item.id) {
        await connection.query(
          `UPDATE reconciliation_items 
           SET is_reconciled = ?, bank_reference = ?, notes = ?
           WHERE id = ? AND reconciliation_id = ?`,
          [item.is_reconciled || false, item.bank_reference || null, item.notes || null, item.id, reconciliation_id]
        );
      }
    }

    // Update reconciliation status
    const [unreconciledCount] = await connection.query(
      'SELECT COUNT(*) as count FROM reconciliation_items WHERE reconciliation_id = ? AND is_reconciled = false',
      [reconciliation_id]
    );

    const status = unreconciledCount[0].count === 0 ? 'reconciled' : 'pending';

    await connection.query(
      `UPDATE account_reconciliations 
       SET status = ?, reconciled_by = ?, reconciled_at = ?
       WHERE id = ?`,
      [status, req.user.id, status === 'reconciled' ? new Date() : null, reconciliation_id]
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

// Get reconciliation list
exports.getReconciliations = async (req, res) => {
  try {
    const { account_id, status, start_date, end_date } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];

    if (account_id) {
      whereConditions.push('ar.account_id = ?');
      queryParams.push(account_id);
    }

    if (status) {
      whereConditions.push('ar.status = ?');
      queryParams.push(status);
    }

    if (start_date && end_date) {
      whereConditions.push('ar.reconciliation_date BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }

    const [reconciliations] = await db.query(
      `SELECT 
        ar.*,
        coa.code as account_code,
        coa.name as account_name,
        u.username as reconciled_by_name,
        COUNT(ri.id) as total_items,
        SUM(CASE WHEN ri.is_reconciled = true THEN 1 ELSE 0 END) as reconciled_items
       FROM account_reconciliations ar
       JOIN chart_of_accounts coa ON ar.account_id = coa.id
       LEFT JOIN users u ON ar.reconciled_by = u.id
       LEFT JOIN reconciliation_items ri ON ar.id = ri.reconciliation_id
       WHERE ${whereConditions.join(' AND ')}
       GROUP BY ar.id
       ORDER BY ar.reconciliation_date DESC`,
      queryParams
    );

    res.json({
      data: reconciliations
    });

  } catch (error) {
    console.error('Error in getReconciliations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
