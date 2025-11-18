const express = require('express');
const router = express.Router();
const db = require('../services/db');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');

// Get all pending petty cash transactions for approval
router.get('/pending-transactions', authenticate, async (req, res) => {
  try {
    // Check if user is sysadmin
    if (req.user.role !== 'sysadmin') {
      console.log('=== RESPONSE STATUS 403 - GET /pending-transactions ===');
      console.log('User role:', req.user.role);
      console.log('Access denied for non-sysadmin user');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    const {
      page = 1,
      limit = 10,
      boarding_house_id,
      transaction_type,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['pct.status = "pending"'];
    let queryParams = [];

    // Add filters
    if (boarding_house_id) {
      whereConditions.push('pct.boarding_house_id = ?');
      queryParams.push(boarding_house_id);
    }

    if (transaction_type) {
      whereConditions.push('pct.transaction_type = ?');
      queryParams.push(transaction_type);
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
      whereConditions.push('(pct.description LIKE ? OR pct.vendor_name LIKE ? OR pcu.full_name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get pending transactions
    const [transactions] = await db.query(
      `SELECT pct.*, 
              bh.name as boarding_house_name,
              pcu.full_name as user_name,
              pcu.department,
              pcu.employee_id,
              pcb.current_balance as user_current_balance
       FROM petty_cash_transactions pct
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       LEFT JOIN petty_cash_users pcu ON pct.petty_cash_user_id = pcu.id
       LEFT JOIN petty_cash_balances pcb ON pct.petty_cash_user_id = pcb.petty_cash_user_id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY pct.created_at ASC
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
    console.error('Error fetching pending transactions:', error);
    console.log('=== RESPONSE STATUS 500 - GET /pending-transactions ===');
    console.log('Internal server error occurred');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending transactions'
    });
  }
});

// Approve a petty cash transaction
router.post('/approve-transaction/:id', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    // Check if user is sysadmin
    if (req.user.role !== 'sysadmin') {
      console.log('=== RESPONSE STATUS 403 - POST /approve-transaction/:id ===');
      console.log('User role:', req.user.role);
      console.log('Access denied for transaction approval');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only system administrators can approve transactions.'
      });
    }

    await connection.beginTransaction();

    const transactionId = req.params.id;
    const { notes } = req.body;

    // Get transaction details
    const [transactionResult] = await connection.query(
      `SELECT pct.*, pcb.current_balance 
       FROM petty_cash_transactions pct
       LEFT JOIN petty_cash_balances pcb ON pct.petty_cash_user_id = pcb.petty_cash_user_id
       WHERE pct.id = ? AND pct.status = 'pending'`,
      [transactionId]
    );

    if (transactionResult.length === 0) {
      await connection.rollback();
      console.log('=== RESPONSE STATUS 404 - POST /approve-transaction/:id ===');
      console.log('Transaction ID:', transactionId);
      console.log('Transaction not found or already processed');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed'
      });
    }

    const transaction = transactionResult[0];

    // NOTE: Balance check is no longer needed here since balance was already deducted 
    // when the transaction was created (pending status)

    // Update transaction status
    await connection.query(
      `UPDATE petty_cash_transactions 
       SET status = 'approved', 
           approved_by = ?, 
           approved_at = CURRENT_TIMESTAMP,
           notes = CONCAT(COALESCE(notes, ''), ?, ?)
       WHERE id = ?`,
      [req.user.id, notes ? '\n\nAdmin Notes: ' : '', notes || '', transactionId]
    );

    // Update user balance based on transaction type
    // NOTE: For expenses, balance is already deducted when transaction was created (pending status)
    // So we only need to handle replenishments here
    if (transaction.transaction_type === 'replenishment') {
      await connection.query(
        `UPDATE petty_cash_balances 
         SET current_balance = current_balance + ?, 
             last_replenishment_date = ?,
             last_replenishment_amount = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE petty_cash_user_id = ?`,
        [transaction.amount, transaction.transaction_date, transaction.amount, transaction.petty_cash_user_id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Transaction approved successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error approving transaction:', error);
    console.log('=== RESPONSE STATUS 500 - POST /approve-transaction/:id ===');
    console.log('Internal server error during transaction approval');
    res.status(500).json({
      success: false,
      message: 'Failed to approve transaction'
    });
  } finally {
    connection.release();
  }
});

// Reject a petty cash transaction
router.post('/reject-transaction/:id', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if user is sysadmin
    if (req.user.role !== 'sysadmin') {
      console.log('=== RESPONSE STATUS 403 - POST /reject-transaction/:id ===');
      console.log('User role:', req.user.role);
      console.log('Access denied for transaction rejection');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only system administrators can reject transactions.'
      });
    }

    const transactionId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      console.log('=== RESPONSE STATUS 400 - POST /reject-transaction/:id ===');
      console.log('Transaction ID:', transactionId);
      console.log('Missing rejection reason');
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Check if transaction exists and is pending, and get transaction details
    const [transactionResult] = await connection.query(
      `SELECT id, petty_cash_user_id, transaction_type, amount 
       FROM petty_cash_transactions 
       WHERE id = ? AND status = "pending"`,
      [transactionId]
    );

    if (transactionResult.length === 0) {
      console.log('=== RESPONSE STATUS 404 - POST /reject-transaction/:id ===');
      console.log('Transaction ID:', transactionId);
      console.log('Transaction not found or already processed');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed'
      });
    }

    const transaction = transactionResult[0];

    // Update transaction status
    await connection.query(
      `UPDATE petty_cash_transactions 
       SET status = 'rejected', 
           approved_by = ?, 
           approved_at = CURRENT_TIMESTAMP,
           notes = CONCAT(COALESCE(notes, ''), ?, ?)
       WHERE id = ?`,
      [req.user.id, '\n\nRejection Reason: ', reason, transactionId]
    );

    // NEW: For expenses, add back the amount to balance since it was deducted when created
    if (transaction.transaction_type === 'expense') {
      await connection.query(
        `UPDATE petty_cash_balances 
         SET current_balance = current_balance + ?, 
             total_expenses_month = total_expenses_month - ?,
             total_expenses_year = total_expenses_year - ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE petty_cash_user_id = ?`,
        [transaction.amount, transaction.amount, transaction.amount, transaction.petty_cash_user_id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Transaction rejected successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting transaction:', error);
    console.log('=== RESPONSE STATUS 500 - POST /reject-transaction/:id ===');
    console.log('Internal server error during transaction rejection');
    res.status(500).json({
      success: false,
      message: 'Failed to reject transaction'
    });
  } finally {
    connection.release();
  }
});

// Get petty cash statistics for admin dashboard
router.get('/statistics', authenticate, async (req, res) => {
  try {
    // Check if user is sysadmin
    if (req.user.role !== 'sysadmin') {
      console.log('=== RESPONSE STATUS 403 - GET /statistics ===');
      console.log('User role:', req.user.role);
      console.log('Access denied for statistics access');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    // Get pending transactions count
    const [pendingCount] = await db.query(
      'SELECT COUNT(*) as count FROM petty_cash_transactions WHERE status = "pending"'
    );

    // Get total active users
    const [activeUsers] = await db.query(
      'SELECT COUNT(*) as count FROM petty_cash_users WHERE status = "active"'
    );

    // Get total balances
    const [totalBalances] = await db.query(
      'SELECT SUM(current_balance) as total FROM petty_cash_balances'
    );

    // Get monthly statistics
    const [monthlyStats] = await db.query(
      `SELECT 
         SUM(CASE WHEN transaction_type = 'expense' AND status = 'approved' THEN amount ELSE 0 END) as monthly_expenses,
         SUM(CASE WHEN transaction_type = 'replenishment' AND status = 'approved' THEN amount ELSE 0 END) as monthly_replenishments,
         COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_transactions,
         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_transactions
       FROM petty_cash_transactions 
       WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );

    // Get recent activity
    const [recentActivity] = await db.query(
      `SELECT pct.*, 
              pcu.full_name as user_name,
              bh.name as boarding_house_name
       FROM petty_cash_transactions pct
       LEFT JOIN petty_cash_users pcu ON pct.petty_cash_user_id = pcu.id
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       ORDER BY pct.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      statistics: {
        pending_transactions: pendingCount[0].count,
        active_users: activeUsers[0].count,
        total_balance: totalBalances[0].total || 0,
        monthly_expenses: monthlyStats[0].monthly_expenses || 0,
        monthly_replenishments: monthlyStats[0].monthly_replenishments || 0,
        approved_transactions: monthlyStats[0].approved_transactions || 0,
        rejected_transactions: monthlyStats[0].rejected_transactions || 0
      },
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    console.log('=== RESPONSE STATUS 500 - GET /statistics ===');
    console.log('Internal server error during statistics fetch');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get all petty cash accounts for admin management
router.get('/users', authenticate, async (req, res) => {
  try {
    const [accounts] = await db.query(
      `SELECT pca.*, 
              pcu.username,
              bh.name as boarding_house_name
       FROM petty_cash_accounts pca
       LEFT JOIN petty_cash_users pcu ON pca.petty_cash_user_id = pcu.id
       LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
       WHERE pca.deleted_at IS NULL
       ORDER BY pca.created_at DESC`
    );

    res.json({
      success: true,
      users: accounts
    });

  } catch (error) {
    console.error('Error fetching petty cash accounts:', error);
    console.log('=== RESPONSE STATUS 500 - GET /users ===');
    console.log('Internal server error during accounts fetch');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch petty cash accounts'
    });
  }
});

// Register a new petty cash user
router.post('/register', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    // Check if user is sysadmin
   

    const { 
      name, 
      full_name,
      email, 
      password, 
      employee_id, 
      department, 
      phone 
    } = req.body;

    // Use full_name if provided, otherwise use name for backward compatibility
    const finalName = full_name || name;

    // Validate required fields
    if (!finalName || !email || !password) {
      console.log('=== RESPONSE STATUS 400 - POST /register ===');
      console.log('Missing required fields:', { name: !!finalName, email: !!email, password: !!password });
      console.log('Validation failed for user creation');
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    await connection.beginTransaction();

    // Auto-generate employee_id if not provided
    let finalEmployeeId = employee_id || Math.floor(100000 + Math.random() * 900000).toString();

    // Auto-generate department if not provided
    const departments = ['Finance', 'Operations', 'Administration', 'Maintenance', 'Security'];
    const finalDepartment = department || departments[Math.floor(Math.random() * departments.length)];

    // Check if email already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM petty_cash_users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      console.log('=== RESPONSE STATUS 400 - POST /register ===');
      console.log('Email already exists:', email);
      console.log('Duplicate email validation failed');
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if employee_id already exists and regenerate if needed
    let [existingEmployee] = await connection.query(
      'SELECT id FROM petty_cash_users WHERE employee_id = ?',
      [finalEmployeeId]
    );

    while (existingEmployee.length > 0) {
      // If auto-generated ID exists, generate a new one
      finalEmployeeId = Math.floor(100000 + Math.random() * 900000).toString();
      [existingEmployee] = await connection.query(
        'SELECT id FROM petty_cash_users WHERE employee_id = ?',
        [finalEmployeeId]
      );
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate username from email
    const username = email.split('@')[0];

    // Create petty cash user
    const [userResult] = await connection.query(
      `INSERT INTO petty_cash_users 
       (username, full_name, email, password_hash, employee_id, department, phone, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
      [username, finalName, email, password_hash, finalEmployeeId, finalDepartment, phone]
    );

    // Create initial balance record
    await connection.query(
      `INSERT INTO petty_cash_balances 
       (petty_cash_user_id, current_balance, created_at) 
       VALUES (?, 0, CURRENT_TIMESTAMP)`,
      [userResult.insertId]
    );

    await connection.commit();

    console.log('=== RESPONSE STATUS 201 - POST /register ===');
    console.log('User created successfully:', { id: userResult.insertId, email, employee_id: finalEmployeeId });
    console.log('New petty cash user registration completed');
    res.status(201).json({
      success: true,
      message: 'Petty cash user created successfully',
      user: {
        id: userResult.insertId,
        username,
        full_name: finalName,
        email,
        employee_id: finalEmployeeId,
        department: finalDepartment,
        phone,
        status: 'active'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('=== ERROR in POST /register ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    console.error('===============================');
    console.log('=== RESPONSE STATUS 500 - POST /register ===');
    console.log('Internal server error during user creation');
    res.status(500).json({
      success: false,
      message: 'Failed to create petty cash user'
    });
  } finally {
    connection.release();
  }
});

// Update a petty cash user
router.put('/users/:id', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const userId = req.params.id;
    const { 
      name, 
      full_name,
      username,
      email, 
      password
    } = req.body;

    // Use full_name if provided, otherwise use name for backward compatibility
    const finalName = full_name || name;

    // Validate required fields
    if (!finalName || !email) {
      console.log('=== RESPONSE STATUS 400 - PUT /users/:id ===');
      console.log('Missing required fields:', { name: !!finalName, email: !!email });
      console.log('Validation failed for user update');
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT id, username, email FROM petty_cash_users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );

    if (existingUser.length === 0) {
      await connection.rollback();
      console.log('=== RESPONSE STATUS 404 - PUT /users/:id ===');
      console.log('User ID:', userId);
      console.log('User not found for update');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username already exists (excluding current user)
    if (username && username !== existingUser[0].username) {
      const [usernameCheck] = await connection.query(
        'SELECT id FROM petty_cash_users WHERE username = ? AND id != ? AND deleted_at IS NULL',
        [username, userId]
      );

      if (usernameCheck.length > 0) {
        await connection.rollback();
        console.log('=== RESPONSE STATUS 400 - PUT /users/:id ===');
        console.log('Username already exists:', username);
        console.log('Duplicate username validation failed for user update');
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check if email already exists (excluding current user)
    if (email !== existingUser[0].email) {
      const [emailCheck] = await connection.query(
        'SELECT id FROM petty_cash_users WHERE email = ? AND id != ? AND deleted_at IS NULL',
        [email, userId]
      );

      if (emailCheck.length > 0) {
        await connection.rollback();
        console.log('=== RESPONSE STATUS 400 - PUT /users/:id ===');
        console.log('Email already exists:', email);
        console.log('Duplicate email validation failed for user update');
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Prepare update query
    let updateQuery = `UPDATE petty_cash_users SET 
                       full_name = ?, 
                       email = ?, 
                       updated_at = CURRENT_TIMESTAMP`;
    
    let updateParams = [finalName, email];

    // Add username update if provided
    if (username && username !== existingUser[0].username) {
      updateQuery += `, username = ?`;
      updateParams.push(username);
    }

    // Add password update if provided
    if (password) {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      updateQuery += `, password = ?`;
      updateParams.push(password_hash);
    }

    updateQuery += ` WHERE id = ? AND deleted_at IS NULL`;
    updateParams.push(userId);

    // Update user
    await connection.query(updateQuery, updateParams);

    await connection.commit();

    console.log('=== RESPONSE STATUS 200 - PUT /users/:id ===');
    console.log('User ID:', userId);
    console.log('User updated successfully');
    res.json({
      success: true,
      message: 'Petty cash user updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating petty cash user:', error);
    console.log('=== RESPONSE STATUS 500 - PUT /users/:id ===');
    console.log('Internal server error during user update');
    res.status(500).json({
      success: false,
      message: 'Failed to update petty cash user'
    });
  } finally {
    connection.release();
  }
});

// Delete a petty cash user
router.delete('/users/:id', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    // Check if user is sysadmin
    if (req.user.role !== 'sysadmin') {
      console.log('=== RESPONSE STATUS 403 - DELETE /users/:id ===');
      console.log('User role:', req.user.role);
      console.log('Access denied for user deletion');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only system administrators can delete petty cash users.'
      });
    }

    const userId = req.params.id;

    await connection.beginTransaction();

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT id FROM petty_cash_users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      console.log('=== RESPONSE STATUS 404 - DELETE /users/:id ===');
      console.log('User ID:', id);
      console.log('User not found for deletion');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any pending transactions
    const [pendingTransactions] = await connection.query(
      'SELECT id FROM petty_cash_transactions WHERE petty_cash_user_id = ? AND status = "pending"',
      [userId]
    );

    if (pendingTransactions.length > 0) {
      console.log('=== RESPONSE STATUS 400 - DELETE /users/:id ===');
      console.log('User ID:', userId);
      console.log('Cannot delete user with pending transactions:', pendingTransactions.length);
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with pending transactions'
      });
    }

    // Soft delete the user
    await connection.query(
      'UPDATE petty_cash_users SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    // Also update the balance record
    await connection.query(
      'UPDATE petty_cash_balances SET updated_at = CURRENT_TIMESTAMP WHERE petty_cash_user_id = ?',
      [userId]
    );

    await connection.commit();

    console.log('=== RESPONSE STATUS 200 - DELETE /users/:id ===');
    console.log('User ID:', userId);
    console.log('User deleted successfully');
    res.json({
      success: true,
      message: 'Petty cash user deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting petty cash user:', error);
    console.log('=== RESPONSE STATUS 500 - DELETE /users/:id ===');
    console.log('Internal server error during user deletion');
    res.status(500).json({
      success: false,
      message: 'Failed to delete petty cash user'
    });
  } finally {
    connection.release();
  }
});

// Get specific user details for reconciliation
router.get('/users/:id', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details with balance
    const [users] = await db.query(
      `SELECT pcu.*, 
              pcb.current_balance,
              pcb.last_replenishment_date,
              pcb.total_expenses_month,
              pcb.total_expenses_year
       FROM petty_cash_users pcu
       LEFT JOIN petty_cash_balances pcb ON pcu.id = pcb.petty_cash_user_id
       WHERE pcu.id = ? AND pcu.status != 'deleted'`,
      [userId]
    );

    if (users.length === 0) {
      console.log('=== RESPONSE STATUS 404 - GET /users/:id ===');
      console.log('User ID:', userId);
      console.log('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    console.log('=== RESPONSE STATUS 500 - GET /users/:id ===');
    console.log('Internal server error during user details fetch');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// Get specific user's transactions for reconciliation
router.get('/users/:id/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    const { start_date, end_date, limit = 50 } = req.query;

    // Verify user exists
    const [userCheck] = await db.query(
      'SELECT id FROM petty_cash_users WHERE id = ? AND status != "deleted"',
      [userId]
    );

    if (userCheck.length === 0) {
      console.log('=== RESPONSE STATUS 404 - GET /users/:id/transactions ===');
      console.log('User ID:', userId);
      console.log('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let dateFilter = '';
    let queryParams = [userId];

    if (start_date && end_date) {
      dateFilter = 'AND pct.transaction_date BETWEEN ? AND ?';
      queryParams.push(start_date, end_date);
    }

    // Get transactions for the user
    const [transactions] = await db.query(
      `SELECT 
        pct.*,
        bh.name as boarding_house_name,
        CASE 
          WHEN pct.status = 'pending' THEN 'Pending Approval'
          WHEN pct.status = 'approved' THEN 'Approved'
          WHEN pct.status = 'rejected' THEN 'Rejected'
        END as status_text,
        approver.username as approved_by_name
       FROM petty_cash_transactions pct
       LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
       LEFT JOIN users approver ON pct.approved_by = approver.id
       WHERE pct.petty_cash_user_id = ? ${dateFilter}
       ORDER BY pct.transaction_date DESC, pct.created_at DESC
       LIMIT ?`,
      [...queryParams, parseInt(limit)]
    );

    res.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    console.log('=== RESPONSE STATUS 500 - GET /users/:id/transactions ===');
    console.log('Internal server error during user transactions fetch');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user transactions'
    });
  }
});

// Issue cash to a petty cash user
router.post('/users/:id/issue-cash', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.params.id;
    const { amount, purpose, reference_number, notes } = req.body;
    
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
    
    // Verify user exists
    const [userCheck] = await connection.query(
      'SELECT id, username FROM petty_cash_users WHERE id = ? AND status = "active"',
      [userId]
    );
    
    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const issuanceAmount = parseFloat(amount);
    const issued_by = req.user.id;
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (petty_cash_user_id, boarding_house_id, transaction_type, amount, description, 
        reference_number, notes, status, approved_by, approved_at, transaction_date)
       VALUES (?, ?, 'replenishment', ?, ?, ?, ?, 'approved', ?, NOW(), CURDATE())`,
      [userId, req.user.boarding_house_id || 1, issuanceAmount, purpose, reference_number, notes, issued_by]
    );
    
    // Update user balance
    await connection.query(
      `UPDATE petty_cash_balances 
       SET current_balance = current_balance + ?, 
           last_replenishment_date = CURDATE(),
           last_replenishment_amount = ?,
           updated_at = NOW()
       WHERE petty_cash_user_id = ?`,
      [issuanceAmount, issuanceAmount, userId]
    );
    
    // Get updated balance
    const [balanceResult] = await connection.query(
      'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
      [userId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Cash issued successfully',
      data: {
        transaction_id: transactionResult.insertId,
        amount: issuanceAmount,
        new_balance: balanceResult[0]?.current_balance || 0
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error issuing cash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue cash'
    });
  } finally {
    connection.release();
  }
});

// Reduce cash from a petty cash user
router.post('/users/:id/reduce-cash', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.params.id;
    const { amount, purpose, reference_number, notes } = req.body;
    
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
    
    // Verify user exists and get current balance
    const [userCheck] = await connection.query(
      `SELECT pcu.id, pcu.username, pcb.current_balance 
       FROM petty_cash_users pcu
       LEFT JOIN petty_cash_balances pcb ON pcu.id = pcb.petty_cash_user_id
       WHERE pcu.id = ? AND pcu.status = "active"`,
      [userId]
    );
    
    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const reductionAmount = parseFloat(amount);
    const currentBalance = parseFloat(userCheck[0].current_balance || 0);
    const reduced_by = req.user.id;
    
    // Check if user has sufficient balance
    if (currentBalance < reductionAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
      });
    }
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (petty_cash_user_id, boarding_house_id, transaction_type, amount, description, 
        reference_number, notes, status, approved_by, approved_at, transaction_date)
       VALUES (?, ?, 'withdrawal', ?, ?, ?, ?, 'approved', ?, NOW(), CURDATE())`,
      [userId, req.user.boarding_house_id || 1, reductionAmount, purpose, reference_number, notes, reduced_by]
    );
    
    // Update user balance
    await connection.query(
      `UPDATE petty_cash_balances 
       SET current_balance = current_balance - ?, 
           updated_at = NOW()
       WHERE petty_cash_user_id = ?`,
      [reductionAmount, userId]
    );
    
    // Get updated balance
    const [balanceResult] = await connection.query(
      'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
      [userId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Cash reduced successfully',
      data: {
        transaction_id: transactionResult.insertId,
        amount: reductionAmount,
        new_balance: balanceResult[0]?.current_balance || 0
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error reducing cash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reduce cash'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;