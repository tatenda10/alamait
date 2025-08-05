const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { authenticatePettyCashUser } = require('../middleware/pettyCashAuth');

// Get current user balance
router.get('/balance', authenticatePettyCashUser, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('=== BALANCE FETCH DEBUG ===');
    console.log('User ID:', req.user.id);
    console.log('User Info:', req.user);
    
    let [balance] = await connection.query(
      'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
      [req.user.id]
    );

    console.log('Balance query result:', balance);

    // If no balance record exists, create one with 0 balance
    if (balance.length === 0) {
      console.log('No balance record found, creating one...');
      await connection.query(
        `INSERT INTO petty_cash_balances 
         (petty_cash_user_id, current_balance, created_at) 
         VALUES (?, 0, CURRENT_TIMESTAMP)`,
        [req.user.id]
      );
      
      // Fetch the newly created balance
      [balance] = await connection.query(
        'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
        [req.user.id]
      );
      console.log('Created new balance record:', balance);
    }

    await connection.commit();
    
    const currentBalance = balance.length > 0 ? balance[0].current_balance : 0;
    console.log('Final balance to return:', currentBalance);
    console.log('=== END BALANCE FETCH DEBUG ===');

    res.json({
      success: true,
      balance: currentBalance
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error fetching balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance'
    });
  } finally {
    connection.release();
  }
});

// Get transactions with pagination and filters
router.get('/transactions', authenticatePettyCashUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      boarding_house_id,
      transaction_type,
      status,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['pct.petty_cash_user_id = ?'];
    let queryParams = [req.user.id];

    // Add filters
    if (boarding_house_id) {
      whereConditions.push('pct.boarding_house_id = ?');
      queryParams.push(boarding_house_id);
    }

    if (transaction_type) {
      whereConditions.push('pct.transaction_type = ?');
      queryParams.push(transaction_type);
    }

    if (status) {
      whereConditions.push('pct.status = ?');
      queryParams.push(status);
    }

    if (start_date) {
      whereConditions.push('pct.transaction_date >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('pct.transaction_date <= ?');
      queryParams.push(end_date);
    }

    if (search) {
      whereConditions.push('(pct.description LIKE ? OR pct.vendor_name LIKE ? OR pct.reference_number LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get transactions with status
    const [transactions] = await db.query(
      `SELECT pct.*, bh.name as boarding_house_name,
              CASE 
                WHEN pct.status = 'pending' THEN 'Pending Approval'
                WHEN pct.status = 'approved' THEN 'Approved'
                WHEN pct.status = 'rejected' THEN 'Rejected'
              END as status_text
       FROM petty_cash_transactions pct
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY pct.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM petty_cash_transactions pct
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Create new transaction (starts as pending)
router.post('/transactions', authenticatePettyCashUser, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      boarding_house_id,
      transaction_type,
      amount,
      description,
      category,
      vendor_name,
      receipt_number,
      expense_account_id,
      reference_number,
      transaction_date,
      notes
    } = req.body;

    // Validation
    if (!boarding_house_id || !transaction_type || !amount || !description || !transaction_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // For expenses, check if user would have sufficient balance after approval
    if (transaction_type === 'expense') {
      const [balanceResult] = await connection.query(
        'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
        [req.user.id]
      );

      if (balanceResult.length === 0 || balanceResult[0].current_balance < amount) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for this transaction'
        });
      }
    }

    // Insert transaction with pending status (default)
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (petty_cash_user_id, boarding_house_id, transaction_type, amount, description, 
        category, vendor_name, receipt_number, expense_account_id, reference_number, 
        transaction_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        boarding_house_id,
        transaction_type,
        amount,
        description,
        category,
        vendor_name,
        receipt_number,
        expense_account_id,
        reference_number,
        transaction_date,
        notes
      ]
    );

    // NEW: For expenses, deduct balance immediately when transaction is created (pending status)
    if (transaction_type === 'expense') {
      console.log('=== BALANCE UPDATE DEBUG ===');
      console.log('User ID:', req.user.id);
      console.log('Deducting amount:', amount);
      
      // Get balance before update
      const [balanceBefore] = await connection.query(
        'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
        [req.user.id]
      );
      console.log('Balance before update:', balanceBefore[0]?.current_balance);
      
      const [updateResult] = await connection.query(
        `UPDATE petty_cash_balances 
         SET current_balance = current_balance - ?, 
             total_expenses_month = total_expenses_month + ?,
             total_expenses_year = total_expenses_year + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE petty_cash_user_id = ?`,
        [amount, amount, amount, req.user.id]
      );
      
      console.log('Update result affected rows:', updateResult.affectedRows);
      
      // Get balance after update
      const [balanceAfter] = await connection.query(
        'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
        [req.user.id]
      );
      console.log('Balance after update:', balanceAfter[0]?.current_balance);
      console.log('=== END BALANCE UPDATE DEBUG ===');
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Transaction submitted for approval',
      transaction_id: transactionResult.insertId,
      status: 'pending'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction'
    });
  } finally {
    connection.release();
  }
});

// Get recent transactions
router.get('/recent-transactions', authenticatePettyCashUser, async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT pct.*, bh.name as boarding_house_name,
              CASE 
                WHEN pct.status = 'pending' THEN 'Pending Approval'
                WHEN pct.status = 'approved' THEN 'Approved'
                WHEN pct.status = 'rejected' THEN 'Rejected'
              END as status_text
       FROM petty_cash_transactions pct
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       WHERE pct.petty_cash_user_id = ?
       ORDER BY pct.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent transactions'
    });
  }
});

// Get boarding houses
router.get('/boarding-houses', authenticatePettyCashUser, async (req, res) => {
  try {
    const [boardingHouses] = await db.query(
      'SELECT id, name FROM boarding_houses WHERE deleted_at IS NULL ORDER BY name'
    );

    res.json({
      success: true,
      boarding_houses: boardingHouses
    });
  } catch (error) {
    console.error('Error fetching boarding houses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boarding houses'
    });
  }
});

// Get reports
router.get('/reports', authenticatePettyCashUser, async (req, res) => {
  try {
    const {
      boarding_house_id,
      start_date,
      end_date
    } = req.query;

    let whereConditions = ['pct.petty_cash_user_id = ?', 'pct.status = "approved"'];
    let queryParams = [req.user.id];

    if (boarding_house_id) {
      whereConditions.push('pct.boarding_house_id = ?');
      queryParams.push(boarding_house_id);
    }

    if (start_date) {
      whereConditions.push('pct.transaction_date >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('pct.transaction_date <= ?');
      queryParams.push(end_date);
    }

    // Get current balance
    const [balanceResult] = await db.query(
      'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
      [req.user.id]
    );

    // Get summary data (only approved transactions)
    const [summaryResult] = await db.query(
      `SELECT 
         SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
         SUM(CASE WHEN transaction_type = 'replenishment' THEN amount ELSE 0 END) as total_replenishments,
         COUNT(*) as total_transactions
       FROM petty_cash_transactions pct
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    // Get expenses by boarding house (only approved transactions)
    const [expensesByBoardingHouse] = await db.query(
      `SELECT bh.name as boarding_house_name, 
              SUM(pct.amount) as total_amount,
              COUNT(*) as transaction_count
       FROM petty_cash_transactions pct
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       WHERE ${whereConditions.join(' AND ')} AND pct.transaction_type = 'expense'
       GROUP BY pct.boarding_house_id, bh.name
       ORDER BY total_amount DESC`,
      queryParams
    );

    // Get recent transactions with status
    const [recentTransactions] = await db.query(
      `SELECT pct.*, bh.name as boarding_house_name,
              CASE 
                WHEN pct.status = 'pending' THEN 'Pending Approval'
                WHEN pct.status = 'approved' THEN 'Approved'
                WHEN pct.status = 'rejected' THEN 'Rejected'
              END as status_text
       FROM petty_cash_transactions pct
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY pct.transaction_date DESC
       LIMIT 10`,
      queryParams
    );

    res.json({
      success: true,
      summary: {
        current_balance: balanceResult.length > 0 ? balanceResult[0].current_balance : 0,
        total_expenses: summaryResult[0].total_expenses || 0,
        total_replenishments: summaryResult[0].total_replenishments || 0,
        total_transactions: summaryResult[0].total_transactions || 0
      },
      expenses_by_boarding_house: expensesByBoardingHouse,
      recent_transactions: recentTransactions
    });

  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reports'
    });
  }
});

module.exports = router;