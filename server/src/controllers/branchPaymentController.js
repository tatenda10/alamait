const db = require('../services/db');

// Record a payment from branch (pending approval)
const recordBranchPayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      student_id, 
      amount, 
      payment_method, 
      payment_date, 
      description, 
      reference_number,
      receipt_path 
    } = req.body;
    
    const userId = req.user.id;
    
    // Validate required fields
    if (!student_id || !amount || !payment_method || !payment_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, amount, payment method, and payment date are required' 
      });
    }
    
    // Check if student exists
    const [students] = await connection.query(
      `SELECT id, full_name 
       FROM students 
       WHERE id = ? AND deleted_at IS NULL`,
      [student_id]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    const student = students[0];
    
    // Get boarding house from student's active enrollment
    const [enrollments] = await connection.query(
      `SELECT boarding_house_id 
       FROM student_enrollments 
       WHERE student_id = ? 
         AND deleted_at IS NULL 
         AND checkout_date IS NULL
       ORDER BY start_date DESC 
       LIMIT 1`,
      [student_id]
    );
    
    let boardingHouseId = null;
    if (enrollments.length > 0) {
      boardingHouseId = enrollments[0].boarding_house_id;
    }
    
    // If no enrollment, try to get from user's boarding house or header
    if (!boardingHouseId) {
      boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    }
    
    // Validate that boarding house exists
    if (boardingHouseId) {
      const [boardingHouses] = await connection.query(
        `SELECT id FROM boarding_houses WHERE id = ? AND deleted_at IS NULL`,
        [boardingHouseId]
      );
      
      if (boardingHouses.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid boarding house ID: ${boardingHouseId}. The boarding house does not exist.` 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot determine boarding house. Student has no active enrollment and no boarding house specified.' 
      });
    }
    
    // Create payment record with pending status
    const [paymentResult] = await connection.query(
      `INSERT INTO ba_payments (
        student_id, 
        amount, 
        payment_method, 
        payment_date, 
        description, 
        reference_number,
        receipt_path,
        status,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())`,
      [
        student_id,
        parseFloat(amount),
        payment_method,
        payment_date,
        description || `Payment from ${student.full_name}`,
        reference_number || `PAY-${Date.now()}`,
        receipt_path,
        boardingHouseId,
        userId
      ]
    );
    
    const paymentId = paymentResult.insertId;
    
    // Create journal entries for petty cash and accounts receivable
    await createBranchPaymentJournals(connection, paymentId, student_id, parseFloat(amount), boardingHouseId, userId, payment_date);
    
    // Update petty cash balance (use user's boarding house, not student's)
    const userBoardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    await updatePettyCashBalance(connection, userId, parseFloat(amount), 'cash_inflow', `Payment from ${student.full_name}`, userBoardingHouseId);
    
    // Update student account balance and create student payment record
    await updateStudentAccountBalance(connection, student_id, parseFloat(amount), paymentId, boardingHouseId, userId, payment_date);
    
    // Get the created payment with student details
    const [newPayment] = await connection.query(
      `SELECT 
        p.*,
        s.full_name,
        s.phone_number
      FROM ba_payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.id = ?`,
      [paymentId]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully and pending admin approval',
      payment: newPayment[0]
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error recording branch payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record payment',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Get pending payments for admin approval
const getPendingPayments = async (req, res) => {
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    const [payments] = await connection.query(
      `SELECT 
        p.*,
        s.first_name,
        s.last_name,
        s.email,
        s.phone_number,
        u.username as created_by_name
      FROM ba_payments p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON p.created_by = u.id
      WHERE p.status = 'pending' 
        AND p.boarding_house_id = ?
      ORDER BY p.created_at DESC`,
      [boardingHouseId]
    );
    
    res.json({
      success: true,
      payments
    });
    
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending payments' 
    });
  }
};

// Approve a pending payment (admin only)
const approvePayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { paymentId } = req.params;
    const approvedBy = req.user.id;
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    // Get the payment details
    const [payments] = await connection.query(
      `SELECT 
        p.*,
        s.first_name,
        s.last_name
      FROM ba_payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.id = ? 
        AND p.status = 'pending' 
        AND p.boarding_house_id = ?`,
      [paymentId, boardingHouseId]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pending payment not found' 
      });
    }
    
    const payment = payments[0];
    
    // Update payment status to completed
    await connection.query(
      `UPDATE ba_payments 
       SET status = 'completed', 
           approved_by = ?, 
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [approvedBy, paymentId]
    );
    
    // Add to petty cash account as inflow
    await connection.query(
      `INSERT INTO petty_cash_transactions (
        user_id,
        boarding_house_id,
        transaction_type,
        amount,
        description,
        reference_number,
        transaction_date,
        created_by,
        created_at
      ) VALUES (?, ?, 'cash_inflow', ?, ?, ?, ?, ?, NOW())`,
      [
        approvedBy, // Using admin as the user for petty cash
        boardingHouseId,
        payment.amount,
        `Payment from ${payment.first_name} ${payment.last_name}`,
        payment.reference_number,
        payment.payment_date,
        approvedBy
      ]
    );
    
    // Update petty cash account balance
    await connection.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = current_balance + ?,
           total_inflows = total_inflows + ?,
           updated_at = NOW()
       WHERE user_id = ? AND boarding_house_id = ?`,
      [payment.amount, payment.amount, approvedBy, boardingHouseId]
    );
    
    // Create journal entries
    // Find petty cash account
    const [pettyCashAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts 
       WHERE name LIKE '%Petty Cash%' AND type = 'Asset' AND deleted_at IS NULL 
       ORDER BY id LIMIT 1`
    );
    
    // Find cash account
    const [cashAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts 
       WHERE name LIKE '%Cash%' AND type = 'Asset' AND deleted_at IS NULL 
       ORDER BY id LIMIT 1`
    );
    
    if (pettyCashAccounts.length > 0 && cashAccounts.length > 0) {
      const pettyCashAccountId = pettyCashAccounts[0].id;
      const cashAccountId = cashAccounts[0].id;
      
      // Create transaction header
      const [transactionResult] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, transaction_date, reference, description, amount,
          boarding_house_id, created_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'posted')`,
        [
          'payment',
          payment.payment_date,
          payment.reference_number,
          `Payment from ${payment.first_name} ${payment.last_name}`,
          payment.amount,
          boardingHouseId,
          approvedBy
        ]
      );
      
      const transactionId = transactionResult.insertId;
      
      // Debit petty cash account
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description,
          boarding_house_id, created_by
        ) VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
        [
          transactionId,
          pettyCashAccountId,
          payment.amount,
          `Payment from ${payment.first_name} ${payment.last_name}`,
          boardingHouseId,
          approvedBy
        ]
      );
      
      // Credit cash account
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description,
          boarding_house_id, created_by
        ) VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
        [
          transactionId,
          cashAccountId,
          payment.amount,
          `Payment from ${payment.first_name} ${payment.last_name}`,
          boardingHouseId,
          approvedBy
        ]
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Payment approved and added to petty cash account'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error approving payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve payment',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Reject a pending payment (admin only)
const rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejection_reason } = req.body;
    const rejectedBy = req.user.id;
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    // Update payment status to rejected
    const [result] = await db.query(
      `UPDATE ba_payments 
       SET status = 'rejected', 
           rejected_by = ?, 
           rejected_at = NOW(),
           rejection_reason = ?,
           updated_at = NOW()
       WHERE id = ? 
         AND status = 'pending' 
         AND boarding_house_id = ?`,
      [rejectedBy, rejection_reason, paymentId, boardingHouseId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pending payment not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });
    
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject payment',
      error: error.message 
    });
  }
};

// Get payment history for a student
const getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    const [payments] = await db.query(
      `SELECT 
        p.*,
        s.first_name,
        s.last_name,
        u.username as created_by_name,
        approver.username as approved_by_name
      FROM ba_payments p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON p.created_by = u.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      WHERE p.student_id = ? 
        AND p.boarding_house_id = ?
      ORDER BY p.created_at DESC`,
      [studentId, boardingHouseId]
    );
    
    res.json({
      success: true,
      payments
    });
    
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch student payments' 
    });
  }
};

// Helper function to create journal entries for branch payments
const createBranchPaymentJournals = async (connection, paymentId, studentId, amount, boardingHouseId, userId, paymentDate) => {
  try {
    // Find petty cash account - use same pattern as expenditure confirmation
    let [pettyCashAccounts] = await connection.query(
      `SELECT id, code, name FROM chart_of_accounts 
       WHERE name LIKE '%Cash%' AND type = 'Asset' AND deleted_at IS NULL 
       ORDER BY id LIMIT 1`
    );
    
    // If not found, try Petty Cash specifically
    if (pettyCashAccounts.length === 0) {
      [pettyCashAccounts] = await connection.query(
        `SELECT id, code, name FROM chart_of_accounts 
         WHERE name LIKE '%Petty Cash%' AND type = 'Asset' AND deleted_at IS NULL 
         ORDER BY id LIMIT 1`
      );
    }
    
    // If still not found, try by account code (10001 is typically Petty Cash)
    if (pettyCashAccounts.length === 0) {
      [pettyCashAccounts] = await connection.query(
        `SELECT id, code, name FROM chart_of_accounts 
         WHERE code = '10001' AND type = 'Asset' AND deleted_at IS NULL 
         LIMIT 1`
      );
    }
    
    if (pettyCashAccounts.length === 0) {
      throw new Error('Petty Cash account not found in chart of accounts');
    }
    
    const pettyCashAccountId = pettyCashAccounts[0].id;
    console.log(`Found Petty Cash account: ID=${pettyCashAccountId}, Code=${pettyCashAccounts[0].code}, Name=${pettyCashAccounts[0].name}`);
    
    // Find accounts receivable account
    const [arAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts 
       WHERE name LIKE '%Accounts Receivable%' AND type = 'Asset' AND deleted_at IS NULL 
       ORDER BY id LIMIT 1`
    );
    
    if (arAccounts.length === 0) {
      throw new Error('Accounts Receivable account not found');
    }
    
    const arAccountId = arAccounts[0].id;
    
    // Create transaction header
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type, transaction_date, reference, description, amount,
        boarding_house_id, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'posted')`,
      [
        'branch_payment',
        paymentDate || new Date().toISOString().split('T')[0],
        `BP-${paymentId}`,
        `Branch Payment - Student ${studentId}`,
        amount,
        boardingHouseId,
        userId
      ]
    );
    
    const transactionId = transactionResult.insertId;
    
    // Create journal entries
    // Use payment date for journal entries to match transaction date
    const journalDate = paymentDate ? paymentDate + ' 00:00:00' : null;
    
    // Debit: Petty Cash (Asset increase)
    if (journalDate) {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'debit', ?, ?, ?, ?, ?)`,
        [transactionId, pettyCashAccountId, amount, `Petty Cash - Branch Payment ${paymentId}`, boardingHouseId, userId, journalDate]
      );
    } else {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
        [transactionId, pettyCashAccountId, amount, `Petty Cash - Branch Payment ${paymentId}`, boardingHouseId, userId]
      );
    }
    
    // Credit: Accounts Receivable (Asset decrease)
    if (journalDate) {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'credit', ?, ?, ?, ?, ?)`,
        [transactionId, arAccountId, amount, `Accounts Receivable - Branch Payment ${paymentId}`, boardingHouseId, userId, journalDate]
      );
    } else {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
        [transactionId, arAccountId, amount, `Accounts Receivable - Branch Payment ${paymentId}`, boardingHouseId, userId]
      );
    }
    
    // Update account balances using the account balance service
    const { updateAccountBalance } = require('../services/accountBalanceService');
    
    console.log(`Updating COA balances: Petty Cash ID=${pettyCashAccountId}, AR ID=${arAccountId}, Amount=${amount}, BoardingHouse=${boardingHouseId}`);
    
    // Update Petty Cash account balance (debit increases asset)
    try {
      await updateAccountBalance(
        pettyCashAccountId,
        amount,
        'debit',
        boardingHouseId,
        connection
      );
      console.log(`Successfully updated Petty Cash COA balance (account ID: ${pettyCashAccountId})`);
    } catch (error) {
      console.error(`Error updating Petty Cash COA balance:`, error);
      throw error;
    }
    
    // Update Accounts Receivable account balance (credit decreases asset)
    try {
      await updateAccountBalance(
        arAccountId,
        amount,
        'credit',
        boardingHouseId,
        connection
      );
      console.log(`Successfully updated Accounts Receivable COA balance (account ID: ${arAccountId})`);
    } catch (error) {
      console.error(`Error updating Accounts Receivable COA balance:`, error);
      throw error;
    }
    
    console.log(`Updated COA balances for Petty Cash (${pettyCashAccountId}) and Accounts Receivable (${arAccountId})`);
    
  } catch (error) {
    console.error('Error creating branch payment journals:', error);
    throw error;
  }
};

// Helper function to update petty cash balance
const updatePettyCashBalance = async (connection, userId, amount, type, description, boardingHouseId) => {
  try {
    console.log(`Updating petty cash balance: User ${userId}, Amount ${amount}, Type ${type}, Boarding House ${boardingHouseId}`);
    
    // First check if this is a petty cash user (has petty_cash_user_id)
    // If not, check if it's a regular user that needs to be linked to a petty cash account
    const [pettyCashUser] = await connection.query(
      `SELECT id FROM petty_cash_users WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );
    
    let pettyCashUserId = null;
    if (pettyCashUser.length > 0) {
      // This is a petty cash user
      pettyCashUserId = userId;
    } else {
      // Check if there's a petty cash user linked to this regular user
      const [linkedUser] = await connection.query(
        `SELECT id FROM petty_cash_users WHERE user_id = ? AND deleted_at IS NULL`,
        [userId]
      );
      if (linkedUser.length > 0) {
        pettyCashUserId = linkedUser[0].id;
      }
    }
    
    if (!pettyCashUserId) {
      console.log(`No petty cash user found for user ${userId}. Cannot update petty cash balance.`);
      throw new Error(`No petty cash account found for user ${userId}`);
    }
    
    // Check if user has a petty cash account using petty_cash_user_id
    const [accounts] = await connection.query(
      `SELECT id, current_balance FROM petty_cash_accounts 
       WHERE petty_cash_user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
      [pettyCashUserId, boardingHouseId]
    );
    
    console.log(`Found ${accounts.length} accounts for petty cash user ${pettyCashUserId} in boarding house ${boardingHouseId}`);
    
    if (accounts.length === 0) {
      console.log(`No petty cash account found. Cannot update balance without an account.`);
      throw new Error(`No petty cash account found for petty cash user ${pettyCashUserId}`);
    }
    
    const account = accounts[0];
    const oldBalance = parseFloat(account.current_balance || 0);
    const amountDecimal = parseFloat(amount);
    const newBalance = type === 'cash_inflow' 
      ? oldBalance + amountDecimal
      : oldBalance - amountDecimal;
    
    // Round to 2 decimal places to avoid floating point precision issues
    const roundedNewBalance = Math.round(newBalance * 100) / 100;
    
    console.log(`Updating existing account ${account.id}: ${oldBalance} -> ${roundedNewBalance} (${type})`);
    
    // Add transaction - use user_id (the table uses user_id, not petty_cash_user_id)
    // Use the original userId (which could be a regular user or petty cash user)
    await connection.query(
      `INSERT INTO petty_cash_transactions (
        user_id, boarding_house_id, transaction_type, amount, description, transaction_date, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      [userId, boardingHouseId, type, amountDecimal, description, userId]
    );
    
    // Update account balance with rounded value
    await connection.query(
      `UPDATE petty_cash_accounts SET current_balance = ?, updated_at = NOW() WHERE id = ?`,
      [roundedNewBalance, account.id]
    );
    console.log(`Updated account ${account.id} balance to ${roundedNewBalance}`);
    
    // Note: COA balance is updated in createBranchPaymentJournals, so we don't update it here
    // to avoid double updates
    
  } catch (error) {
    console.error('Error updating petty cash balance:', error);
    throw error;
  }
};

// Helper function to update student account balance and create payment record
const updateStudentAccountBalance = async (connection, studentId, amount, branchPaymentId, boardingHouseId, userId, paymentDate) => {
  try {
    console.log(`Updating student account balance: Student ${studentId}, Amount ${amount}`);
    
    // Get student enrollment details
    const [enrollments] = await connection.query(
      `SELECT id, boarding_house_id FROM student_enrollments 
       WHERE student_id = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
      [studentId, boardingHouseId]
    );
    
    if (enrollments.length === 0) {
      console.log(`No enrollment found for student ${studentId} in boarding house ${boardingHouseId}`);
      return; // Skip if no enrollment
    }
    
    const enrollment = enrollments[0];
    
    // Check if student has an account balance record
    const [accountBalances] = await connection.query(
      `SELECT id, current_balance FROM student_account_balances 
       WHERE student_id = ? AND enrollment_id = ?`,
      [studentId, enrollment.id]
    );
    
    let accountBalanceId;
    let newBalance;
    
    if (accountBalances.length === 0) {
      // Create account balance record
      const [newAccountBalance] = await connection.query(
        `INSERT INTO student_account_balances (student_id, enrollment_id, current_balance, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [studentId, enrollment.id, 0]
      );
      accountBalanceId = newAccountBalance.insertId;
      newBalance = amount; // First payment
      console.log(`Created new account balance record with ID ${accountBalanceId}`);
    } else {
      accountBalanceId = accountBalances[0].id;
      const currentBalance = parseFloat(accountBalances[0].current_balance);
      newBalance = currentBalance + amount; // Add payment to existing balance
      console.log(`Updated existing account balance: ${currentBalance} + ${amount} = ${newBalance}`);
    }
    
    // Update the account balance
    await connection.query(
      `UPDATE student_account_balances SET current_balance = ? WHERE id = ?`,
      [newBalance, accountBalanceId]
    );
    
    // Create student payment record
    const [studentPaymentResult] = await connection.query(
      `INSERT INTO student_payments (
        student_id,
        enrollment_id,
        amount,
        payment_date,
        payment_method,
        payment_type,
        reference_number,
        notes,
        created_by,
        status
      ) VALUES (?, ?, ?, ?, 'cash', 'branch_payment', ?, ?, ?, 'completed')`,
      [
        studentId,
        enrollment.id,
        amount,
        paymentDate || new Date().toISOString().split('T')[0],
        `BP-${branchPaymentId}`,
        `Branch payment recorded by user ${userId}`,
        userId
      ]
    );
    
    console.log(`Created student payment record with ID ${studentPaymentResult.insertId}`);
    
  } catch (error) {
    console.error('Error updating student account balance:', error);
    throw error;
  }
};

// Get payment history for the current user (all payments made by this user)
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [payments] = await db.query(
      `SELECT 
        p.*,
        s.full_name as student_name,
        s.phone_number as student_phone,
        u.username as created_by_name,
        approver.username as approved_by_name,
        rejector.username as rejected_by_name
      FROM ba_payments p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON p.created_by = u.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      LEFT JOIN users rejector ON p.rejected_by = rejector.id
      WHERE p.created_by = ?
      ORDER BY p.created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history' 
    });
  }
};

module.exports = {
  recordBranchPayment,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getStudentPayments,
  getPaymentHistory
};
