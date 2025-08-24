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
    const { amount, description, reference_number, notes } = req.body;
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

    const cashAmount = parseFloat(amount);
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, 'cash_inflow', ?, ?, ?, ?, CURDATE(), ?, NOW())`,
      [boardingHouseId, cashAmount, description, reference_number, notes, created_by]
    );
    
    // Update account balance
    await connection.query(
      `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_inflows, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       total_inflows = total_inflows + ?,
       updated_at = NOW()`,
      [boardingHouseId, cashAmount, cashAmount, cashAmount, cashAmount]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Cash added successfully',
      transaction_id: transactionResult.insertId
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
    const { amount, purpose, reference_number, notes } = req.body;
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
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, 'withdrawal', ?, ?, ?, ?, CURDATE(), ?, NOW())`,
      [boardingHouseId, withdrawAmount, purpose, reference_number, notes, created_by]
    );
    
    // Update account balance
    await connection.query(
      `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_outflows, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_outflows = total_outflows + ?,
       updated_at = NOW()`,
      [boardingHouseId, currentBalance - withdrawAmount, withdrawAmount, withdrawAmount, withdrawAmount]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Cash withdrawn successfully',
      transaction_id: transactionResult.insertId
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
       VALUES (?, 'expense', ?, ?, ?, ?, CURDATE(), ?, NOW())`,
      [boardingHouseId, expenseAmount, description, receipt_number, notes, created_by]
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