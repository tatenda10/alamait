const db = require('../services/db');
const multer = require('multer');
const path = require('path');
const { updateAccountBalance } = require('../services/accountBalanceService');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/payment-receipts/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
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

// Record a payment
exports.recordPayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      student_id,
      amount,
      payment_method,
      fee_type,
      payment_date,
      reference_number,
      notes,
      boarding_house_id,
      petty_cash_account_id
    } = req.body;

    // Get created_by from the authenticated user
    const created_by = req.user.id;

    // Use boarding_house_id from request body if provided, otherwise use req.user.boarding_house_id
    const targetBoardingHouseId = boarding_house_id || req.user.boarding_house_id;

    console.log('Received payment request:', {
      student_id,
      amount,
      payment_method,
      fee_type,
      payment_date,
      reference_number,
      notes,
      boarding_house_id: targetBoardingHouseId,
      petty_cash_account_id
    });

    // Validate required fields
    if (!student_id) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    if (!amount) {
      return res.status(400).json({ message: 'Payment amount is required' });
    }
    if (!payment_method) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    if (!fee_type) {
      return res.status(400).json({ message: 'Fee type is required' });
    }
    if (!payment_date) {
      return res.status(400).json({ message: 'Payment date is required' });
    }
    if (!targetBoardingHouseId) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    // Parse amount as float
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Determine debit and credit account codes based on payment_method and fee_type
    let debitAccountCode, creditAccountCode;

    // First determine which cash/bank account to use based on payment_method
    switch (payment_method) {
      case 'cash_to_admin':
        debitAccountCode = '10002'; // Cash
        break;
      case 'cash_to_ba':
        debitAccountCode = '10001'; // Petty Cash
        break;
      case 'bank':
        debitAccountCode = '10003'; // Bank
        break;
      default:
        debitAccountCode = '10002'; // Default to Cash
    }

    // For payments, we should credit Accounts Receivable (not Revenue)
    // Revenue is only credited when invoices are created, not when payments are received
    creditAccountCode = '10005'; // Accounts Receivable

    console.log('Selected account codes:', { debitAccountCode, creditAccountCode });

    // Get account details from the database
    const [accounts] = await connection.query(
      `SELECT 
        debit.id as debit_account_id,
        debit.name as debit_name,
        debit.code as debit_code,
        credit.id as credit_account_id,
        credit.name as credit_name,
        credit.code as credit_code
       FROM chart_of_accounts debit
       JOIN chart_of_accounts credit ON credit.id != debit.id
       WHERE debit.code = ? 
         AND credit.code = ?
         AND debit.deleted_at IS NULL
         AND credit.deleted_at IS NULL`,
      [debitAccountCode, creditAccountCode]
    );

    if (accounts.length === 0) {
      return res.status(400).json({ 
        message: 'Required accounts not found in chart of accounts',
        details: {
          debit_account: debitAccountCode,
          credit_account: creditAccountCode
        }
      });
    }

    const accountDetails = accounts[0];
    console.log('Using accounts:', {
      debit: {
        code: accountDetails.debit_code,
        name: accountDetails.debit_name,
        id: accountDetails.debit_account_id
      },
      credit: {
        code: accountDetails.credit_code,
        name: accountDetails.credit_name,
        id: accountDetails.credit_account_id
      }
    });

    // Get active enrollment first
    const [enrollments] = await connection.query(
      `SELECT * FROM student_enrollments 
       WHERE student_id = ? 
         AND deleted_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [student_id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ message: 'No active enrollment found for student' });
    }

    const enrollment = enrollments[0];

    // Validate that student exists and enrollment belongs to the correct boarding house
    const [students] = await connection.query(
      `SELECT s.* 
       FROM students s
       WHERE s.id = ? 
         AND s.deleted_at IS NULL`,
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Use the enrollment's boarding house ID instead of the request's boarding house ID
    const actualBoardingHouseId = enrollment.boarding_house_id;
    
    // If the request specifies a different boarding house, use the enrollment's boarding house
    if (targetBoardingHouseId !== actualBoardingHouseId) {
      console.log(`Boarding house mismatch: Request=${targetBoardingHouseId}, Enrollment=${actualBoardingHouseId}. Using enrollment's boarding house.`);
    }

    let schedule = null;

    // Validate petty cash account if payment method is cash_to_ba
    if (payment_method === 'cash_to_ba') {
      if (!petty_cash_account_id) {
        return res.status(400).json({ message: 'Petty cash account is required for cash to BA payments' });
      }

      // Check petty cash account balance
      const [pettyCashResult] = await connection.query(
        `SELECT current_balance FROM petty_cash_accounts 
         WHERE boarding_house_id = ?`,
        [actualBoardingHouseId]
      );

      if (pettyCashResult.length === 0) {
        return res.status(400).json({ message: 'Petty cash account not found for this boarding house' });
      }

      const currentBalance = parseFloat(pettyCashResult[0].current_balance) || 0;
      // Note: We don't check balance here as the payment will ADD to petty cash, not subtract
    }

    // Create transaction record
    const transactionRef = reference_number || `PMT-${Date.now()}`;
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        student_id,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        created_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        fee_type,
        student_id,
        transactionRef,
        paymentAmount,
        enrollment.currency,
        `${fee_type.replace('_', ' ')} payment - ${accountDetails.debit_name} to ${accountDetails.credit_name}`,
        payment_date,
        actualBoardingHouseId,
        req.user.id,
        'posted'
      ]
    );

    // Create journal entries
    // Debit entry
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          transactionResult.insertId,
        accountDetails.debit_account_id,
        'debit',
          paymentAmount,
        `${fee_type.replace('_', ' ')} payment - Debit ${accountDetails.debit_name}`,
        actualBoardingHouseId,
        req.user.id
        ]
      );

    // Credit entry
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          transactionResult.insertId,
        accountDetails.credit_account_id,
        'credit',
          paymentAmount,
        `${fee_type.replace('_', ' ')} payment - Credit ${accountDetails.credit_name}`,
        actualBoardingHouseId,
        req.user.id
      ]
    );

    // Update account balances after creating journal entries
    console.log('Updating account balances for payment:');
    console.log('Debit Account ID:', accountDetails.debit_account_id, 'Amount:', paymentAmount, 'Type: debit');
    console.log('Credit Account ID:', accountDetails.credit_account_id, 'Amount:', paymentAmount, 'Type: credit');
    
    await updateAccountBalance(
      accountDetails.debit_account_id,
      paymentAmount,
      'debit',
      actualBoardingHouseId,
      connection
    );

    await updateAccountBalance(
      accountDetails.credit_account_id,
      paymentAmount,
      'credit',
      actualBoardingHouseId,
      connection
    );
    
    console.log('Account balance updates completed');

    // Create payment record
    const [result] = await connection.query(
      `INSERT INTO student_payments (
        student_id,
        enrollment_id,
        transaction_id,
        amount,
        payment_date,
        payment_method,
        payment_type,
        reference_number,
        notes,
        created_by,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
        student_id,
        enrollment.id,
        transactionResult.insertId,
        paymentAmount,
        payment_date,
        payment_method,
        fee_type,
        transactionRef,
        notes,
        req.user.id,
        'completed'
      ]
    );

    // If payment is made to petty cash (cash_to_ba), update petty cash account
    if (payment_method === 'cash_to_ba') {
      // Add to petty cash account balance
      await connection.query(
        `INSERT INTO petty_cash_accounts (boarding_house_id, account_name, account_code, current_balance, total_inflows, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         current_balance = current_balance + ?,
         total_inflows = total_inflows + ?,
         updated_at = NOW()`,
        [actualBoardingHouseId, 'Petty Cash Account', 'PC-001', paymentAmount, paymentAmount, created_by, paymentAmount, paymentAmount]
      );

      // Create petty cash transaction record
      await connection.query(
        `INSERT INTO petty_cash_transactions 
         (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
         VALUES (?, 'student_payment', ?, ?, ?, ?, ?, ?, NOW())`,
        [
          actualBoardingHouseId, 
          paymentAmount, 
          `Student payment - ${fee_type.replace('_', ' ')}`, 
          transactionRef, 
          notes, 
          payment_date, 
          req.user.id
        ]
      );
    }

    // Update student account balance (payment reduces the negative balance)
    await connection.query(
      `INSERT INTO student_account_balances (student_id, enrollment_id, current_balance, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       updated_at = NOW()`,
      [student_id, enrollment.id, paymentAmount, enrollment.currency, paymentAmount]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Payment recorded successfully',
      payment_id: result.insertId,
      transaction_id: transactionResult.insertId,
      transaction_reference: transactionRef,
      transaction_details: {
        debit_account: {
          code: accountDetails.debit_code,
          name: accountDetails.debit_name
        },
        credit_account: {
          code: accountDetails.credit_code,
          name: accountDetails.credit_name
        },
        amount: paymentAmount,
        currency: enrollment.currency
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in recordPayment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Upload payment receipt
exports.uploadReceipt = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { payment_id } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Verify payment exists and belongs to the same boarding house
      const [payments] = await connection.query(
        `SELECT p.* 
         FROM student_payments p
         JOIN student_enrollments se ON p.enrollment_id = se.id
         WHERE p.id = ? 
           AND se.boarding_house_id = ?
           AND p.deleted_at IS NULL`,
        [payment_id, req.user.boarding_house_id]
      );

      if (payments.length === 0) {
        return res.status(404).json({ message: 'Payment not found or not associated with your boarding house' });
      }

      // Save receipt record with relative path
      const relativePath = req.file.filename;
      const [result] = await connection.query(
        `INSERT INTO payment_receipts (
          payment_id,
          file_path,
          file_name
        ) VALUES (?, ?, ?)`,
        [payment_id, relativePath, req.file.filename]
      );

      const [receipt] = await connection.query(
        'SELECT * FROM payment_receipts WHERE id = ?',
        [result.insertId]
      );

      await connection.commit();
      res.status(201).json(receipt[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Error in uploadReceipt:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      connection.release();
    }
  });
};

// Create a payment schedule
exports.createPaymentSchedule = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { student_id } = req.params;
    const { 
      startDate,
      endDate,
      amount,
      currency = 'USD',
      notes,
      enrollment_id
    } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !amount || !enrollment_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Check if student exists and has active enrollment
    const [enrollments] = await connection.query(
      `SELECT se.*, r.name as room_name
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       WHERE se.id = ? 
         AND se.student_id = ? 
         AND se.boarding_house_id = ?
         AND se.deleted_at IS NULL`,
      [enrollment_id, student_id, req.user.boarding_house_id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ message: 'Student enrollment not found or not associated with your boarding house' });
    }

    // Create payment schedule
    const [result] = await connection.query(
      `INSERT INTO student_payment_schedules (
        enrollment_id,
        student_id,
        period_start_date,
        period_end_date,
        amount_due,
        currency,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        enrollment_id,
        student_id,
        startDate,
        endDate,
        amount,
        currency,
        notes || null
      ]
    );

    // Get created schedule
    const [schedule] = await connection.query(
      `SELECT 
        ps.*,
        COALESCE(
          (SELECT SUM(amount) 
           FROM student_payments 
           WHERE schedule_id = ps.id AND deleted_at IS NULL
          ), 0
        ) as amount_paid
       FROM student_payment_schedules ps
       WHERE ps.id = ?`,
      [result.insertId]
    );

    await connection.commit();
    res.status(201).json(schedule[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in createPaymentSchedule:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get student payment schedule
exports.getStudentSchedule = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { enrollment_id } = req.query;

    // Validate that student belongs to the same boarding house
    const [students] = await db.query(
      `SELECT s.* 
       FROM students s
       JOIN student_enrollments se ON s.id = se.student_id
       WHERE s.id = ? 
         AND se.boarding_house_id = ?
         AND s.deleted_at IS NULL
         AND se.deleted_at IS NULL`,
      [student_id, req.user.boarding_house_id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found or not associated with your boarding house' });
    }

    let query = `
      SELECT 
        ps.*,
        s.full_name as student_name,
        r.name as room_name,
        se.start_date as enrollment_start,
        se.expected_end_date as enrollment_end
      FROM student_payment_schedules ps
      JOIN students s ON ps.student_id = s.id
      JOIN student_enrollments se ON ps.enrollment_id = se.id
      JOIN rooms r ON se.room_id = r.id
      WHERE ps.student_id = ? 
        AND se.boarding_house_id = ?
        AND ps.deleted_at IS NULL
    `;
    
    const params = [student_id, req.user.boarding_house_id];

    if (enrollment_id) {
      query += ' AND ps.enrollment_id = ?';
      params.push(enrollment_id);
    }

    query += ' ORDER BY ps.period_start_date';

    const [schedules] = await db.query(query, params);

    // Get payment history for each schedule
    for (let schedule of schedules) {
      const [payments] = await db.query(
        `SELECT p.*, pr.file_path as receipt_path
         FROM student_payments p
         LEFT JOIN payment_receipts pr ON p.id = pr.payment_id
         JOIN student_enrollments se ON p.enrollment_id = se.id
         WHERE p.schedule_id = ? 
           AND se.boarding_house_id = ?
           AND p.deleted_at IS NULL
         ORDER BY p.payment_date`,
        [schedule.id, req.user.boarding_house_id]
      );
      schedule.payments = payments;
    }

    res.json(schedules);
  } catch (error) {
    console.error('Error in getStudentSchedule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a payment
exports.updatePayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const {
      amount,
      payment_date,
      payment_method,
      reference_number,
      notes
    } = req.body;

    // Parse amount as float to ensure numeric value
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Get current payment to check if it exists and belongs to the boarding house
    const [payments] = await connection.query(
      `SELECT sp.*, se.boarding_house_id 
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       WHERE sp.id = ? 
         AND sp.deleted_at IS NULL`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = payments[0];

    // Check if payment belongs to the user's boarding house
    if (payment.boarding_house_id !== req.user.boarding_house_id) {
      return res.status(403).json({ message: 'Not authorized to update this payment' });
    }

    // Update payment record
    await connection.query(
      `UPDATE student_payments 
       SET amount = ?,
           payment_date = ?,
           payment_method = ?,
           reference_number = ?,
           notes = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        paymentAmount,
        payment_date,
        payment_method,
        reference_number,
        notes,
        id
      ]
    );

    // Get updated payment details
    const [updatedPayment] = await connection.query(
      `SELECT 
        sp.*,
        s.full_name as student_name,
        r.name as room_name
       FROM student_payments sp
       JOIN students s ON sp.student_id = s.id
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       JOIN rooms r ON se.room_id = r.id
       WHERE sp.id = ?`,
      [id]
    );

    await connection.commit();
    res.json(updatedPayment[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in updatePayment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Get current payment to check if it exists and belongs to the boarding house
    const [payments] = await connection.query(
      `SELECT sp.*, se.boarding_house_id, ps.id as schedule_id, ps.amount_paid
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       LEFT JOIN student_payment_schedules ps ON sp.schedule_id = ps.id
       WHERE sp.id = ? 
         AND sp.deleted_at IS NULL`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = payments[0];

    // Check if payment belongs to the user's boarding house
    if (payment.boarding_house_id !== req.user.boarding_house_id) {
      return res.status(403).json({ message: 'Not authorized to delete this payment' });
    }

    // If payment is linked to a schedule, update the schedule's amount_paid
    if (payment.schedule_id) {
      const newAmountPaid = parseFloat(payment.amount_paid) - parseFloat(payment.amount);
      const status = newAmountPaid <= 0 ? 'pending' : 'partial';

      await connection.query(
        `UPDATE student_payment_schedules 
         SET amount_paid = ?,
             status = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [Math.max(0, newAmountPaid), status, payment.schedule_id]
      );
    }

    // Soft delete the payment
    await connection.query(
      `UPDATE student_payments 
       SET deleted_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await connection.commit();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deletePayment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get payment details
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await db.query(
      `SELECT 
        sp.*,
        s.full_name as student_name,
        r.name as room_name,
        se.boarding_house_id
       FROM student_payments sp
       JOIN students s ON sp.student_id = s.id
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       JOIN rooms r ON se.room_id = r.id
       WHERE sp.id = ? 
         AND sp.deleted_at IS NULL`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = payments[0];

    // Check if payment belongs to the user's boarding house
    if (payment.boarding_house_id !== req.user.boarding_house_id) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error in getPaymentById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Get student's payments
exports.getStudentPayments = async (req, res) => {
  try {
    const { student_id } = req.params;

    console.log('getStudentPayments called with:', {
      student_id,
      user_id: req.user?.id,
      user_boarding_house_id: req.user?.boarding_house_id
    });

    // First, check if the student exists
    const [students] = await db.query(
      `SELECT s.* 
       FROM students s
       WHERE s.id = ? 
         AND s.deleted_at IS NULL`,
      [student_id]
    );

    if (students.length === 0) {
      console.log('Student not found:', student_id);
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Student found:', students[0]);

    // Get the student's boarding house from their enrollment
    const [enrollments] = await db.query(
      `SELECT se.boarding_house_id
       FROM student_enrollments se
       WHERE se.student_id = ? 
         AND se.deleted_at IS NULL
       ORDER BY se.created_at DESC
       LIMIT 1`,
      [student_id]
    );

    if (enrollments.length === 0) {
      console.log('No enrollment found for student:', student_id);
      return res.status(404).json({ message: 'No enrollment found for student' });
    }

    const studentBoardingHouseId = enrollments[0].boarding_house_id;
    console.log('Student boarding house ID:', studentBoardingHouseId);

    // If user has a boarding_house_id, validate that the student belongs to that boarding house
    // Exception: Allow branch users to view payments for students from any boarding house
    // (since branch payments can be made across boarding houses)
    if (req.user.boarding_house_id && req.user.boarding_house_id !== studentBoardingHouseId) {
      // Check if this is a branch user (has branch-specific permissions)
      // For now, we'll allow all users to view payments for any student
      // This can be refined later with proper role-based permissions
      console.log('Cross-boarding-house access: user boarding house ID:', req.user.boarding_house_id, 'student boarding house ID:', studentBoardingHouseId);
      // Allow access - remove the 403 restriction
    }

    // Get the student's payments
    const [payments] = await db.query(
      `SELECT 
        p.*,
        pr.file_path as receipt_path,
        ps.period_start_date,
        ps.period_end_date,
        ps.amount_due
      FROM student_payments p
      LEFT JOIN payment_receipts pr ON p.id = pr.payment_id
      LEFT JOIN student_payment_schedules ps ON p.schedule_id = ps.id
      JOIN student_enrollments se ON p.enrollment_id = se.id
      WHERE p.student_id = ? 
        AND se.boarding_house_id = ?
        AND p.deleted_at IS NULL
      ORDER BY p.payment_date DESC`,
      [student_id, studentBoardingHouseId]
    );

    console.log('Found payments:', payments.length);
    res.json(payments);
  } catch (error) {
    console.error('Error in getStudentPayments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Get all payments for a boarding house
exports.getBoardingHousePayments = async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT 
        sp.*,
        s.full_name as student_name,
        se.room_id,
        r.name as room_name,
        sps.period_start_date,
        sps.period_end_date
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      JOIN student_enrollments se ON sp.enrollment_id = se.id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_payment_schedules sps ON sp.schedule_id = sps.id
      WHERE se.boarding_house_id = ?
        AND sp.deleted_at IS NULL
      ORDER BY sp.payment_date DESC, sp.created_at DESC`,
      [req.user.boarding_house_id]
    );

    // Transform the data for frontend display
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      student_id: payment.student_id,
      student_name: payment.student_name,
      room_name: payment.room_name,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      payment_type: payment.payment_type,
      reference_number: payment.reference_number,
      status: payment.status,
      period: payment.period_start_date && payment.period_end_date ? {
        start: payment.period_start_date,
        end: payment.period_end_date
      } : null,
      notes: payment.notes,
      created_at: payment.created_at
    }));

    res.json(transformedPayments);
  } catch (error) {
    console.error('Error in getBoardingHousePayments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Get overdue payments for a boarding house
exports.getOverduePayments = async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT 
        sps.*,
        s.full_name as student_name,
        se.room_id,
        r.name as room_name,
        se.currency
      FROM student_payment_schedules sps
      JOIN students s ON sps.student_id = s.id
      JOIN student_enrollments se ON sps.enrollment_id = se.id
      JOIN rooms r ON se.room_id = r.id
      WHERE se.boarding_house_id = ?
        AND sps.deleted_at IS NULL
        AND sps.period_end_date < CURRENT_DATE
        AND (sps.status = 'pending' OR sps.status = 'partial')
      ORDER BY sps.period_end_date ASC`,
      [req.user.boarding_house_id]
    );

    res.json(payments);
  } catch (error) {
    console.error('Error in getOverduePayments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Get rent ledger for a student
exports.getStudentLedger = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Get all charges (payment schedules)
    const [charges] = await db.query(
      `SELECT 
        sps.id,
        sps.period_start_date as date,
        CONCAT('Rent for ', DATE_FORMAT(sps.period_start_date, '%M %Y')) as description,
        'charge' as type,
        sps.amount_due as amount,
        sps.amount_paid,
        sps.currency,
        sps.status,
        sps.payment_type
      FROM student_payment_schedules sps
      JOIN student_enrollments se ON sps.enrollment_id = se.id
      WHERE sps.student_id = ? 
        AND se.boarding_house_id = ?
        AND sps.deleted_at IS NULL
      ORDER BY sps.period_start_date ASC`,
      [student_id, req.user.boarding_house_id]
    );

    // Get all payments
    const [payments] = await db.query(
      `SELECT 
        sp.id,
        sp.payment_date as date,
        CONCAT('Payment - ', sp.payment_method, COALESCE(CONCAT(' (', sp.reference_number, ')'), '')) as description,
        'payment' as type,
        sp.amount,
        sp.currency,
        sp.status,
        sp.payment_type,
        sp.notes
      FROM student_payments sp
      JOIN student_enrollments se ON sp.enrollment_id = se.id
      WHERE sp.student_id = ? 
        AND se.boarding_house_id = ?
        AND sp.deleted_at IS NULL
      ORDER BY sp.payment_date ASC`,
      [student_id, req.user.boarding_house_id]
    );

    // Combine and sort all entries by date
    const allEntries = [...charges, ...payments].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json(allEntries);
  } catch (error) {
    console.error('Error in getStudentLedger:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 
