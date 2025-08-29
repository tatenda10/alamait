const db = require('../services/db');

// Get all balance periods
exports.getBalancePeriods = async (req, res) => {
  try {
    const [periods] = await db.query(
      `SELECT * FROM balance_periods ORDER BY period_start_date DESC`
    );
    res.json(periods);
  } catch (error) {
    console.error('Error fetching balance periods:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a single balance period by ID
exports.getBalancePeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const [periods] = await db.query(
      `SELECT * FROM balance_periods WHERE id = ?`,
      [periodId]
    );
    
    if (periods.length === 0) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    res.json(periods[0]);
  } catch (error) {
    console.error('Error fetching balance period:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get account period balances for a specific period
exports.getAccountPeriodBalances = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const [balances] = await db.query(
      `SELECT 
        apb.*,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        bp.period_name,
        bp.period_start_date,
        bp.period_end_date,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') THEN 
            apb.balance_brought_down + apb.total_debits - apb.total_credits
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            apb.balance_brought_down + apb.total_credits - apb.total_debits
          ELSE 0
        END AS calculated_balance
      FROM account_period_balances apb
      JOIN chart_of_accounts coa ON apb.account_id = coa.id
      JOIN balance_periods bp ON apb.period_id = bp.id
      WHERE apb.period_id = ? AND coa.deleted_at IS NULL
      ORDER BY coa.code`,
      [periodId]
    );
    
    res.json(balances);
  } catch (error) {
    console.error('Error fetching account period balances:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get account ledger with BD/CD for a specific account and period
exports.getAccountLedgerWithBDCD = async (req, res) => {
  try {
    const { accountId, periodId } = req.params;
    
    // Get period information
    const [periods] = await db.query(
      `SELECT * FROM balance_periods WHERE id = ?`,
      [periodId]
    );
    
    if (periods.length === 0) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    const period = periods[0];
    
    // Get account period balance for BD
    const [balances] = await db.query(
      `SELECT balance_brought_down FROM account_period_balances 
       WHERE account_id = ? AND period_id = ?`,
      [accountId, periodId]
    );
    
    const balanceBroughtDown = balances.length > 0 ? balances[0].balance_brought_down : 0;
    
    // Get transactions for the period
    const [transactions] = await db.query(
      `SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.reference,
        t.description,
        je.id as journal_entry_id,
        je.entry_type,
        je.amount,
        CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END AS debit_amount,
        CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END AS credit_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE je.account_id = ? 
        AND je.deleted_at IS NULL 
        AND t.deleted_at IS NULL 
        AND t.status = 'posted'
        AND t.transaction_date BETWEEN ? AND ?
      ORDER BY t.transaction_date, t.id, je.id`,
      [accountId, period.period_start_date, period.period_end_date]
    );
    
    // Get account information for balance calculation
    const [accounts] = await db.query(
      `SELECT type FROM chart_of_accounts WHERE id = ?`,
      [accountId]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const accountType = accounts[0].type;
    
    // Build ledger with running balance
    let runningBalance = balanceBroughtDown;
    const ledger = [];
    
    // Add BD entry if there's a brought down balance
    if (balanceBroughtDown > 0) {
      ledger.push({
        transaction_id: null,
        journal_entry_id: null,
        transaction_date: period.period_start_date,
        reference: 'BD',
        description: 'Balance Brought Down',
        entry_type: null,
        amount: balanceBroughtDown,
        debit_amount: accountType === 'Asset' || accountType === 'Expense' ? balanceBroughtDown : 0,
        credit_amount: accountType === 'Liability' || accountType === 'Equity' || accountType === 'Revenue' ? balanceBroughtDown : 0,
        balance_brought_down: balanceBroughtDown,
        balance_carried_down: 0,
        running_balance: runningBalance
      });
    }
    
    // Add transactions
    transactions.forEach((transaction, index) => {
      const debitAmount = parseFloat(transaction.debit_amount) || 0;
      const creditAmount = parseFloat(transaction.credit_amount) || 0;
      
      if (accountType === 'Asset' || accountType === 'Expense') {
        runningBalance += debitAmount - creditAmount;
      } else {
        runningBalance += creditAmount - debitAmount;
      }
      
      ledger.push({
        ...transaction,
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        balance_brought_down: 0,
        balance_carried_down: 0,
        running_balance: runningBalance
      });
    });
    
    // Add CD entry at the end if there are transactions
    if (transactions.length > 0) {
      ledger.push({
        transaction_id: null,
        journal_entry_id: null,
        transaction_date: period.period_end_date,
        reference: 'CD',
        description: 'Balance Carried Down',
        entry_type: null,
        amount: runningBalance,
        debit_amount: 0,
        credit_amount: 0,
        balance_brought_down: 0,
        balance_carried_down: runningBalance,
        running_balance: runningBalance
      });
    }
    
    res.json(ledger);
  } catch (error) {
    console.error('Error fetching account ledger with BD/CD:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Set balance brought down for an account in a period
exports.setBalanceBroughtDown = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { accountId, periodId } = req.params;
    const { balance_brought_down, notes } = req.body;
    const userId = req.user?.id || 1;
    
    if (balance_brought_down === undefined || balance_brought_down === null) {
      return res.status(400).json({ message: 'Balance brought down is required' });
    }
    
    // Check if account period balance exists
    const [existing] = await connection.query(
      `SELECT * FROM account_period_balances WHERE account_id = ? AND period_id = ?`,
      [accountId, periodId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Account period balance not found' });
    }
    
    const previousBalance = existing[0].balance_brought_down;
    
    // Update the balance brought down
    await connection.query(
      `UPDATE account_period_balances 
       SET balance_brought_down = ?, 
           notes = ?,
           updated_at = NOW()
       WHERE account_id = ? AND period_id = ?`,
      [balance_brought_down, notes, accountId, periodId]
    );
    
    // Recalculate balance carried down
    await connection.query(
      `UPDATE account_period_balances apb
       JOIN chart_of_accounts coa ON apb.account_id = coa.id
       SET apb.balance_carried_down = 
           CASE 
               WHEN coa.type IN ('Asset', 'Expense') THEN 
                   apb.balance_brought_down + apb.total_debits - apb.total_credits
               WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
                   apb.balance_brought_down + apb.total_credits - apb.total_debits
               ELSE 0
           END,
           apb.updated_at = NOW()
       WHERE apb.account_id = ? AND apb.period_id = ?`,
      [accountId, periodId]
    );
    
    // Record verification
    await connection.query(
      `INSERT INTO balance_verifications 
       (account_period_balance_id, verified_by, verification_date, previous_balance, new_balance, adjustment_amount, adjustment_reason, verification_notes)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
      [
        existing[0].id,
        userId,
        previousBalance,
        balance_brought_down,
        balance_brought_down - previousBalance,
        'Manual adjustment',
        notes || 'Balance brought down updated'
      ]
    );
    
    await connection.commit();
    
    res.json({ 
      message: 'Balance brought down updated successfully',
      previous_balance: previousBalance,
      new_balance: balance_brought_down
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error setting balance brought down:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Close a period (set carried down balances as brought down for next period)
exports.closePeriod = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { periodId } = req.params;
    const userId = req.user?.id || 1;
    
    // Check if period exists and is not already closed
    const [period] = await connection.query(
      `SELECT * FROM balance_periods WHERE id = ?`,
      [periodId]
    );
    
    if (period.length === 0) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    if (period[0].is_closed) {
      return res.status(400).json({ message: 'Period is already closed' });
    }
    
    // Get next period
    const [nextPeriod] = await connection.query(
      `SELECT * FROM balance_periods 
       WHERE period_start_date > ? 
       ORDER BY period_start_date ASC 
       LIMIT 1`,
      [period[0].period_end_date]
    );
    
    if (nextPeriod.length === 0) {
      return res.status(400).json({ message: 'No next period found to carry forward balances' });
    }
    
    // Update carried down balances for current period
    await connection.query(
      `UPDATE account_period_balances apb
       JOIN chart_of_accounts coa ON apb.account_id = coa.id
       SET apb.balance_carried_down = 
           CASE 
               WHEN coa.type IN ('Asset', 'Expense') THEN 
                   apb.balance_brought_down + apb.total_debits - apb.total_credits
               WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
                   apb.balance_brought_down + apb.total_credits - apb.total_debits
               ELSE 0
           END,
           apb.updated_at = NOW()
       WHERE apb.period_id = ?`,
      [periodId]
    );
    
    // Set brought down balances for next period
    await connection.query(
      `INSERT INTO account_period_balances 
       (account_id, period_id, balance_brought_down, balance_carried_down, total_debits, total_credits, transaction_count)
       SELECT 
           apb.account_id,
           ? as period_id,
           apb.balance_carried_down as balance_brought_down,
           0.00 as balance_carried_down,
           0.00 as total_debits,
           0.00 as total_credits,
           0 as transaction_count
       FROM account_period_balances apb
       WHERE apb.period_id = ?
       ON DUPLICATE KEY UPDATE
           balance_brought_down = VALUES(balance_brought_down),
           updated_at = NOW()`,
      [nextPeriod[0].id, periodId]
    );
    
    // Mark period as closed
    await connection.query(
      `UPDATE balance_periods 
       SET is_closed = TRUE, 
           closed_at = NOW(), 
           closed_by = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [userId, periodId]
    );
    
    await connection.commit();
    
    res.json({ 
      message: 'Period closed successfully',
      closed_period: period[0].period_name,
      next_period: nextPeriod[0].period_name
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error closing period:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get balance verification history for an account
exports.getBalanceVerifications = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const [verifications] = await db.query(
      `SELECT 
        bv.*,
        u.full_name as verified_by_name,
        bp.period_name,
        coa.code as account_code,
        coa.name as account_name
      FROM balance_verifications bv
      JOIN account_period_balances apb ON bv.account_period_balance_id = apb.id
      JOIN balance_periods bp ON apb.period_id = bp.id
      JOIN chart_of_accounts coa ON apb.account_id = coa.id
      LEFT JOIN users u ON bv.verified_by = u.id
      WHERE apb.account_id = ?
      ORDER BY bv.created_at DESC`,
      [accountId]
    );
    
    res.json(verifications);
  } catch (error) {
    console.error('Error fetching balance verifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get trial balance for a period
exports.getTrialBalance = async (req, res) => {
  try {
    const { periodId } = req.params;
    
    const [trialBalance] = await db.query(
      `SELECT 
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        apb.balance_brought_down,
        apb.total_debits,
        apb.total_credits,
        apb.balance_carried_down,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') THEN 
            apb.balance_brought_down + apb.total_debits - apb.total_credits
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            apb.balance_brought_down + apb.total_credits - apb.total_debits
          ELSE 0
        END AS calculated_balance
      FROM account_period_balances apb
      JOIN chart_of_accounts coa ON apb.account_id = coa.id
      JOIN balance_periods bp ON apb.period_id = bp.id
      WHERE apb.period_id = ? AND coa.deleted_at IS NULL
      ORDER BY coa.code`,
      [periodId]
    );
    
    // Calculate totals
    const totals = trialBalance.reduce((acc, row) => {
      if (row.account_type === 'Asset' || row.account_type === 'Expense') {
        acc.debits += parseFloat(row.calculated_balance) || 0;
      } else {
        acc.credits += parseFloat(row.calculated_balance) || 0;
      }
      return acc;
    }, { debits: 0, credits: 0 });
    
    res.json({
      trial_balance: trialBalance,
      totals: totals,
      difference: Math.abs(totals.debits - totals.credits),
      is_balanced: Math.abs(totals.debits - totals.credits) < 0.01
    });
    
  } catch (error) {
    console.error('Error fetching trial balance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 