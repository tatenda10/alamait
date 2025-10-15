// Record payment - credit student account balance
const recordStudentPayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      student_id,
      enrollment_id,
      amount,
      payment_method,
      payment_date,
      reference_number,
      notes
    } = req.body;

    // Validate required fields
    if (!student_id || !enrollment_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, enrollment_id, amount, payment_method'
      });
    }

    // Check if student and enrollment exist
    const [enrollment] = await connection.query(
      `SELECT se.*, s.full_name, r.name as room_name
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN rooms r ON se.room_id = r.id
       WHERE se.student_id = ? AND se.id = ? AND se.deleted_at IS NULL`,
      [student_id, enrollment_id]
    );

    if (enrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student enrollment not found'
      });
    }

    // Record payment
    const [paymentResult] = await connection.query(
      `INSERT INTO student_payments (
        student_id,
        enrollment_id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        notes,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
      [
        student_id,
        enrollment_id,
        amount,
        payment_method,
        payment_date || new Date(),
        reference_number,
        notes
      ]
    );

    // Update student account balance (credit the account)
    await connection.query(
      `UPDATE student_account_balances 
       SET current_balance = current_balance + ?,
           updated_at = NOW()
       WHERE student_id = ? AND enrollment_id = ?`,
      [amount, student_id, enrollment_id]
    );

    // Get updated balance
    const [balance] = await connection.query(
      'SELECT current_balance FROM student_account_balances WHERE student_id = ? AND enrollment_id = ?',
      [student_id, enrollment_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment_id: paymentResult.insertId,
        amount: amount,
        new_balance: balance[0].current_balance
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Record invoice/charge - debit student account balance
const recordStudentInvoice = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      student_id,
      enrollment_id,
      amount,
      description,
      invoice_date,
      reference_number,
      notes
    } = req.body;

    // Validate required fields
    if (!student_id || !enrollment_id || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, enrollment_id, amount, description'
      });
    }

    // Check if student and enrollment exist
    const [enrollment] = await connection.query(
      `SELECT se.*, s.full_name, r.name as room_name
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN rooms r ON se.room_id = r.id
       WHERE se.student_id = ? AND se.id = ? AND se.deleted_at IS NULL`,
      [student_id, enrollment_id]
    );

    if (enrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student enrollment not found'
      });
    }

    // Record invoice/charge
    const [invoiceResult] = await connection.query(
      `INSERT INTO student_invoices (
        student_id,
        enrollment_id,
        amount,
        description,
        invoice_date,
        reference_number,
        notes,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        student_id,
        enrollment_id,
        amount,
        description,
        invoice_date || new Date(),
        reference_number,
        notes
      ]
    );

    // Update student account balance (debit the account)
    await connection.query(
      `UPDATE student_account_balances 
       SET current_balance = current_balance - ?,
           updated_at = NOW()
       WHERE student_id = ? AND enrollment_id = ?`,
      [amount, student_id, enrollment_id]
    );

    // Get updated balance
    const [balance] = await connection.query(
      'SELECT current_balance FROM student_account_balances WHERE student_id = ? AND enrollment_id = ?',
      [student_id, enrollment_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Invoice recorded successfully',
      data: {
        invoice_id: invoiceResult.insertId,
        amount: amount,
        new_balance: balance[0].current_balance
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error recording invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
