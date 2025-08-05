const db = require('../services/db');

/**
 * Record a payment to a supplier for an expense
 */
exports.recordSupplierPayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      expense_id,
      amount,
      payment_date,
      payment_method,
      reference_number,
      description,
      notes,
      boarding_house_id,
      petty_cash_account_id
    } = req.body;
    
    // Debug logging
    console.log('Recording supplier payment:', {
      expense_id,
      amount,
      payment_date,
      payment_method,
      boarding_house_id,
      petty_cash_account_id,
      user: req.user
    });
    
    // Validate required fields
    if (!expense_id || !amount || !payment_date || !payment_method || !boarding_house_id) {
      return res.status(400).json({ 
        message: 'Expense ID, amount, payment date, payment method, and boarding house are required' 
      });
    }

    // Validate petty cash account if payment method is petty_cash
    if (payment_method === 'petty_cash' && !petty_cash_account_id) {
      return res.status(400).json({ 
        message: 'Petty cash account is required when payment method is petty cash' 
      });
    }
    
    // Get expense details and verify it exists and belongs to the specified boarding house
    const [expenses] = await connection.query(
      `SELECT e.*, s.id as supplier_id, s.company as supplier_name
       FROM expenses e
       LEFT JOIN suppliers s ON e.supplier_id = s.id
       WHERE e.id = ? AND e.boarding_house_id = ? AND e.payment_method = 'credit' AND e.deleted_at IS NULL`,
      [expense_id, boarding_house_id]
    );
    
    if (expenses.length === 0) {
      return res.status(404).json({ 
        message: 'Credit expense not found or not associated with the specified boarding house' 
      });
    }
    
    const expense = expenses[0];
    
    // Check if payment amount is valid
    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }
    
    // Get total payments made so far for this expense
    const [paymentSums] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid
       FROM supplier_payments 
       WHERE expense_id = ? AND deleted_at IS NULL`,
      [expense_id]
    );

    const totalPaid = paymentSums[0].total_paid;
    const remainingBalance = expense.amount - totalPaid;

    if (amount > remainingBalance) {
      return res.status(400).json({ 
        message: `Payment amount cannot exceed remaining balance of $${remainingBalance}` 
      });
    }
    
    // Record the supplier payment
    const [paymentResult] = await connection.query(
      `INSERT INTO supplier_payments (
        supplier_id,
        expense_id,
        amount,
        payment_date,
        payment_method,
        petty_cash_account_id,
        reference_number,
        description,
        notes,
        boarding_house_id,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.supplier_id,
        expense_id,
        amount,
        payment_date,
        payment_method,
        petty_cash_account_id || null,
        reference_number,
        description || `Payment for ${expense.description}`,
        notes,
        boarding_house_id,
        req.user.id
      ]
    );
    
    // Calculate new remaining balance
    const newTotalPaid = totalPaid + amount;
    const newRemainingBalance = expense.amount - newTotalPaid;

    // Update expense payment status and remaining balance
    let paymentStatus = 'debt';
    if (newRemainingBalance <= 0) {
      paymentStatus = 'full';
    } else if (newTotalPaid > 0) {
      paymentStatus = 'partial';
    }

    await connection.query(
      `UPDATE expenses 
       SET payment_status = ?,
           remaining_balance = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [paymentStatus, Math.max(0, newRemainingBalance), expense_id]
    );
    
    // Create transaction record for the payment
    const transactionRef = `SP-${Date.now()}-${paymentResult.insertId}`;
    
    await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'supplier_payment',
        transactionRef,
        amount,
        expense.currency || 'USD',
        `Supplier payment - ${expense.description}`,
        payment_date,
        boarding_house_id,
        req.user.id,
        'posted'
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Supplier payment recorded successfully',
      data: {
        payment_id: paymentResult.insertId,
        expense_id,
        amount,
        remaining_balance: newRemainingBalance,
        transaction_reference: transactionRef
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error recording supplier payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

/**
 * Get all supplier payments for a boarding house
 */
exports.getSupplierPayments = async (req, res) => {
  try {
    const { supplier_id, expense_id } = req.query;
    
    let query = `
      SELECT 
        sp.*,
        s.company as supplier_name,
        s.contact_person as supplier_contact,
        e.description as expense_description,
        e.reference_number as expense_reference
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN expenses e ON sp.expense_id = e.id
      WHERE sp.boarding_house_id = ? AND sp.deleted_at IS NULL
    `;
    
    const params = [req.user.boarding_house_id];
    
    if (supplier_id) {
      query += ' AND sp.supplier_id = ?';
      params.push(supplier_id);
    }
    
    if (expense_id) {
      query += ' AND sp.expense_id = ?';
      params.push(expense_id);
    }
    
    query += ' ORDER BY sp.payment_date DESC, sp.created_at DESC';
    
    const [payments] = await db.query(query, params);
    
    res.json({
      data: payments,
      message: 'Supplier payments retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific supplier payment by ID
 */
exports.getSupplierPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [payments] = await db.query(
      `SELECT 
        sp.*,
        s.company as supplier_name,
        s.contact_person as supplier_contact,
        e.description as expense_description,
        e.reference_number as expense_reference
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN expenses e ON sp.expense_id = e.id
      WHERE sp.id = ? AND sp.boarding_house_id = ? AND sp.deleted_at IS NULL`,
      [id, req.user.boarding_house_id]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Supplier payment not found' });
    }
    
    res.json({
      data: payments[0],
      message: 'Supplier payment retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching supplier payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a supplier payment (soft delete)
 */
exports.deleteSupplierPayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Get payment details
    const [payments] = await connection.query(
      `SELECT sp.*, e.amount as expense_amount
       FROM supplier_payments sp
       LEFT JOIN expenses e ON sp.expense_id = e.id
       WHERE sp.id = ? AND sp.boarding_house_id = ? AND sp.deleted_at IS NULL`,
      [id, req.user.boarding_house_id]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Supplier payment not found' });
    }
    
    const payment = payments[0];
    
    // Soft delete the payment
    await connection.query(
      'UPDATE supplier_payments SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    
    // Recalculate remaining balance after removing this payment
    if (payment.expense_id) {
      // Get remaining payments for this expense (excluding the deleted one)
      const [remainingPayments] = await connection.query(
        `SELECT COALESCE(SUM(amount), 0) as total_paid
         FROM supplier_payments 
         WHERE expense_id = ? AND deleted_at IS NULL`,
        [payment.expense_id]
      );
      
      const totalPaid = remainingPayments[0].total_paid;
      const newRemainingBalance = payment.expense_amount - totalPaid;
      
      // Note: payment_status column doesn't exist in current table structure
      // The payment tracking is handled through supplier_payments table
    }
    
    await connection.commit();
    
    res.json({ message: 'Supplier payment deleted successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting supplier payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};