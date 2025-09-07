const db = require('../services/db');

// Get petty cash account data for a boarding house
exports.getPettyCashAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }

    // Get current petty cash balance
    const [balanceResult] = await connection.query(
      `SELECT 
        COALESCE(current_balance, 0) as current_balance,
        COALESCE(beginning_balance, 0) as beginning_balance,
        COALESCE(total_inflows, 0) as total_inflows,
        COALESCE(total_outflows, 0) as total_outflows
       FROM petty_cash_accounts 
       WHERE boarding_house_id = ?`,
      [boardingHouseId]
    );

    let accountData = {
      current_balance: 0,
      beginning_balance: 0,
      total_inflows: 0,
      total_outflows: 0
    };

    if (balanceResult.length > 0) {
      accountData = balanceResult[0];
    } else {
      // Create account if it doesn't exist
      await connection.query(
        `INSERT INTO petty_cash_accounts 
         (boarding_house_id, current_balance, beginning_balance, total_inflows, total_outflows, created_at) 
         VALUES (?, 0, 0, 0, 0, NOW())`,
        [boardingHouseId]
      );
    }

    // Get recent transactions
    const [transactionsResult] = await connection.query(
      `SELECT 
        id,
        transaction_type,
        amount,
        description,
        reference_number,
        transaction_date,
        notes,
        created_at
       FROM petty_cash_transactions 
       WHERE boarding_house_id = ? 
       ORDER BY transaction_date DESC, id DESC 
       LIMIT 50`,
      [boardingHouseId]
    );

    // Calculate running balance for transactions
    let runningBalance = parseFloat(accountData.current_balance);
    const transactionsWithBalance = transactionsResult.map(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment') {
        runningBalance -= amount; // Subtract because we're going backwards
      } else {
        runningBalance += amount; // Add because we're going backwards
      }
      return {
        ...transaction,
        running_balance: runningBalance + amount // Add back the current transaction amount
      };
    }).reverse(); // Reverse to show in chronological order

    res.json({
      success: true,
      current_balance: parseFloat(accountData.current_balance),
      beginning_balance: parseFloat(accountData.beginning_balance),
      total_inflows: parseFloat(accountData.total_inflows),
      total_outflows: parseFloat(accountData.total_outflows),
      transactions: transactionsWithBalance
    });

  } catch (error) {
    console.error('Error fetching petty cash account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch petty cash account data'
    });
  } finally {
    connection.release();
  }
};

// Add cash to petty cash account
exports.addCash = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { amount, description, transaction_date, reference_number, notes, source_account } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description is required' 
      });
    }

    if (!source_account) {
      return res.status(400).json({ 
        success: false, 
        message: 'Source account is required. Where is the money coming from?' 
      });
    }

    const cashAmount = parseFloat(amount);
    
    // Get source account details
    const [sourceAccountResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [source_account]
    );

    if (sourceAccountResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid source account code: ${source_account}`
      });
    }

    const sourceAccount = sourceAccountResult[0];

    // Validate that source account is an asset account (cash, bank, etc.)
    if (sourceAccount.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: `Source account must be an Asset account. ${sourceAccount.name} is a ${sourceAccount.type} account.`
      });
    }

    // Create main transaction record
    const [mainTransactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        created_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'posted')`,
      [
        'petty_cash_addition',
        reference_number || `PCA-${Date.now()}`,
        cashAmount,
        'USD',
        `Petty Cash Addition: ${description}`,
        transaction_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );
    
    // Create petty cash transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, 'cash_inflow', ?, ?, ?, ?, ?, ?, NOW())`,
      [boardingHouseId, cashAmount, description, reference_number, notes, transaction_date || new Date().toISOString().split('T')[0], created_by]
    );
    
    // Update petty cash account balance
    await connection.query(
      `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_inflows, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       total_inflows = total_inflows + ?,
       updated_at = NOW()`,
      [boardingHouseId, cashAmount, cashAmount, cashAmount, cashAmount]
    );

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit petty cash account
    const [pettyCashAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashAccountResult.length > 0) {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
        [
          mainTransactionResult.insertId,
          pettyCashAccountResult[0].id,
          cashAmount,
          `Petty Cash Addition: ${description}`,
          boardingHouseId,
          created_by
        ]
      );
    }

    // 2. Credit the source account (Cash, Bank, etc.)
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
      [
        mainTransactionResult.insertId,
        sourceAccount.id,
        cashAmount,
        `Petty Cash Addition from ${sourceAccount.name}`,
        boardingHouseId,
        created_by
      ]
    );

    // Update current account balances
    // Update petty cash balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, '10001', 'Petty Cash', 'Asset', ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       total_debits = total_debits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        pettyCashAccountResult[0].id,
        cashAmount,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        cashAmount,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );

    // Update source account balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, ?, ?, ?, 0, 0, ?, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_credits = total_credits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        sourceAccount.id,
        sourceAccount.code,
        sourceAccount.name,
        sourceAccount.type,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        cashAmount,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Cash added successfully from ${sourceAccount.name}`,
      transaction_id: mainTransactionResult.insertId,
      petty_cash_transaction_id: transactionResult.insertId,
      source_account: {
        code: sourceAccount.code,
        name: sourceAccount.name,
        type: sourceAccount.type
      },
      amount: cashAmount
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding cash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cash to petty cash account'
    });
  } finally {
    connection.release();
  }
};

// Withdraw cash from petty cash account
exports.withdrawCash = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { amount, purpose, transaction_date, reference_number, notes, destination_account } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }
    
    if (!purpose) {
      return res.status(400).json({ 
        success: false, 
        message: 'Purpose is required' 
      });
    }

    if (!destination_account) {
      return res.status(400).json({ 
        success: false, 
        message: 'Destination account is required. Where is the withdrawn money going?' 
      });
    }

    const withdrawAmount = parseFloat(amount);
    
    // Check current balance
    const [balanceResult] = await connection.query(
      `SELECT current_balance FROM petty_cash_accounts WHERE boarding_house_id = ?`,
      [boardingHouseId]
    );
    
    const currentBalance = balanceResult.length > 0 ? parseFloat(balanceResult[0].current_balance) : 0;
    
    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
      });
    }

    // Get destination account details
    const [destinationAccountResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [destination_account]
    );

    if (destinationAccountResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid destination account code: ${destination_account}`
      });
    }

    const destinationAccount = destinationAccountResult[0];

    // Validate that destination account is an asset account (cash, bank, etc.)
    if (destinationAccount.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: `Destination account must be an Asset account. ${destinationAccount.name} is a ${destinationAccount.type} account.`
      });
    }

    // Create main transaction record
    const [mainTransactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        created_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'posted')`,
      [
        'petty_cash_withdrawal',
        reference_number || `PCW-${Date.now()}`,
        withdrawAmount,
        'USD',
        `Petty Cash Withdrawal: ${purpose}`,
        transaction_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );

    // Create petty cash transaction record
    const [pettyCashTransactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, 'withdrawal', ?, ?, ?, ?, ?, ?, NOW())`,
      [boardingHouseId, withdrawAmount, purpose, reference_number, notes, transaction_date || new Date().toISOString().split('T')[0], created_by]
    );
    
    // Update petty cash account balance
    await connection.query(
      `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_outflows, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_outflows = total_outflows + ?,
       updated_at = NOW()`,
      [boardingHouseId, currentBalance - withdrawAmount, withdrawAmount, withdrawAmount, withdrawAmount]
    );

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit the destination account (Cash, Bank, etc.)
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
      [
        mainTransactionResult.insertId,
        destinationAccount.id,
        withdrawAmount,
        `Petty Cash Withdrawal to ${destinationAccount.name}`,
        boardingHouseId,
        created_by
      ]
    );

    // 2. Credit petty cash account
    const [pettyCashAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashAccountResult.length > 0) {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
        [
          mainTransactionResult.insertId,
          pettyCashAccountResult[0].id,
          withdrawAmount,
          `Petty Cash Withdrawal: ${purpose}`,
          boardingHouseId,
          created_by
        ]
      );
    }

    // Update current account balances
    // Update petty cash balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, '10001', 'Petty Cash', 'Asset', ?, 0, ?, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_credits = total_credits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        pettyCashAccountResult[0].id,
        currentBalance - withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );

    // Update destination account balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       total_debits = total_debits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        destinationAccount.id,
        destinationAccount.code,
        destinationAccount.name,
        destinationAccount.type,
        withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Cash withdrawn successfully from petty cash to ${destinationAccount.name}`,
      transaction_id: mainTransactionResult.insertId,
      petty_cash_transaction_id: pettyCashTransactionResult.insertId,
      destination_account: {
        code: destinationAccount.code,
        name: destinationAccount.name,
        type: destinationAccount.type
      },
      amount: withdrawAmount,
      new_petty_cash_balance: currentBalance - withdrawAmount
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error withdrawing cash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw cash from petty cash account'
    });
  } finally {
    connection.release();
  }
};

// Add expense from petty cash account
exports.addExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { 
      amount, 
      description, 
      transaction_date,
      expense_category, 
      vendor_name, 
      receipt_number, 
      notes 
    } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description is required' 
      });
    }

    const expenseAmount = parseFloat(amount);
    
    // Check current balance
    const [balanceResult] = await connection.query(
      `SELECT current_balance FROM petty_cash_accounts WHERE boarding_house_id = ?`,
      [boardingHouseId]
    );
    
    const currentBalance = balanceResult.length > 0 ? parseFloat(balanceResult[0].current_balance) : 0;
    
    if (currentBalance < expenseAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
      });
    }
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, 'expense', ?, ?, ?, ?, ?, ?, NOW())`,
      [boardingHouseId, expenseAmount, description, receipt_number, notes, transaction_date || new Date().toISOString().split('T')[0], created_by]
    );
    
    // Update account balance
    await connection.query(
      `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_outflows, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_outflows = total_outflows + ?,
       updated_at = NOW()`,
      [boardingHouseId, currentBalance - expenseAmount, expenseAmount, expenseAmount, expenseAmount]
    );
    
    // Also create an expense record for reporting
    await connection.query(
      `INSERT INTO expenses 
       (boarding_house_id, amount, description, expense_category, vendor_name, receipt_number, notes, payment_method, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'petty_cash', 'paid', ?, NOW())`,
      [boardingHouseId, expenseAmount, description, expense_category, vendor_name, receipt_number, notes, created_by]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Expense added successfully',
      transaction_id: transactionResult.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense from petty cash account'
    });
  } finally {
    connection.release();
  }
};

// Set beginning balance for petty cash account
exports.setBeginningBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { beginning_balance } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!beginning_balance || beginning_balance < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid beginning balance is required' 
      });
    }

    const balance = parseFloat(beginning_balance);
    
    // Update or create account with beginning balance
    await connection.query(
      `INSERT INTO petty_cash_accounts 
       (boarding_house_id, beginning_balance, current_balance, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       beginning_balance = ?,
       updated_at = NOW()`,
      [boardingHouseId, balance, balance, balance]
    );
    
    // Create transaction record for beginning balance
    await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, transaction_date, created_by, created_at)
       VALUES (?, 'beginning_balance', ?, 'Beginning balance set', CURDATE(), ?, NOW())`,
      [boardingHouseId, balance, created_by]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Beginning balance set successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error setting beginning balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set beginning balance'
    });
  } finally {
    connection.release();
  }
};