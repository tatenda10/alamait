const db = require('../services/db');
const { updateAccountBalance } = require('../services/accountBalanceService');

// Generate monthly invoices for all active students
const generateMonthlyInvoices = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      invoice_month, // Format: YYYY-MM
      invoice_date,
      description_prefix = 'Monthly Rent',
      boarding_house_id,
      students = [] // Optional: array of {enrollment_id, amount} for adjusted amounts
    } = req.body;

    // Validate required fields
    if (!invoice_month) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: invoice_month (format: YYYY-MM)'
      });
    }

    if (!boarding_house_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: boarding_house_id'
      });
    }

    // Parse the invoice month
    const [year, month] = invoice_month.split('-');
    const invoiceDate = invoice_date || new Date();
    
    // Get all active enrollments with bed assignments for the boarding house
    // Only include students who are Active and have a bed assigned (status = 'occupied')
    const [activeEnrollments] = await connection.query(
      `SELECT 
        se.id as enrollment_id,
        se.student_id,
        COALESCE(b.price, r.price_per_bed, se.agreed_amount) as monthly_rent,
        se.currency,
        s.full_name as student_name,
        r.name as room_name,
        bh.name as boarding_house_name,
        bh.id as boarding_house_id,
        COALESCE(sab.current_balance, 0) as current_balance,
        b.id as bed_id,
        b.bed_number
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      INNER JOIN beds b ON b.enrollment_id = se.id 
        AND b.student_id = se.student_id
        AND b.status = 'occupied'
        AND b.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON sab.enrollment_id = se.id AND sab.student_id = s.id
      WHERE se.deleted_at IS NULL
        AND se.boarding_house_id = ?
        AND s.status = 'Active'
        AND s.deleted_at IS NULL
      ORDER BY s.full_name`,
      [boarding_house_id]
    );

    if (activeEnrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active enrollments found for the specified month'
      });
    }

    const generatedInvoices = [];
    const errors = [];

    // Create a map of adjusted amounts if provided
    const adjustedAmounts = {};
    if (students && students.length > 0) {
      students.forEach(student => {
        adjustedAmounts[student.enrollment_id] = parseFloat(student.amount);
      });
    }

    // Generate invoice for each active enrollment
    for (const enrollment of activeEnrollments) {
      try {
        // Use adjusted amount if provided, otherwise use monthly rent
        const invoiceAmount = adjustedAmounts[enrollment.enrollment_id] 
          ? adjustedAmounts[enrollment.enrollment_id]
          : parseFloat(enrollment.monthly_rent);
        
        // Create invoice
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
            enrollment.student_id,
            enrollment.enrollment_id,
            invoiceAmount,
            `${description_prefix} - ${invoice_month}`,
            invoiceDate,
            `INV-${invoice_month}-${enrollment.enrollment_id}`,
            `Monthly rent for ${enrollment.room_name} in ${enrollment.boarding_house_name}`
          ]
        );

        // Update student account balance (debit the account)
        await connection.query(
          `UPDATE student_account_balances 
           SET current_balance = current_balance - ?,
               updated_at = NOW()
           WHERE student_id = ? AND enrollment_id = ?`,
          [invoiceAmount, enrollment.student_id, enrollment.enrollment_id]
        );

        // Create journal entries for the main accounting system
        const transactionRef = `INV-${invoice_month}-${enrollment.enrollment_id}`;
        
        // Create transaction record
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
            'monthly_invoice',
            enrollment.student_id,
            transactionRef,
            invoiceAmount,
            enrollment.currency,
            `Monthly invoice - ${enrollment.student_name} - ${invoice_month}`,
            invoiceDate,
            enrollment.boarding_house_id,
            req.user?.id || 1, // Use authenticated user or default to user 1
            'posted' // Status for the transaction
          ]
        );

        // Get account IDs
        const [receivableAccount] = await connection.query(
          'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
          ['10005'] // Accounts Receivable
        );

        const [revenueAccount] = await connection.query(
          'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
          ['40001'] // Rentals Income
        );

        if (receivableAccount.length === 0 || revenueAccount.length === 0) {
          throw new Error('Required accounts not found in chart of accounts');
        }

        // Create journal entries
        // Debit: Accounts Receivable (increases receivable)
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
            receivableAccount[0].id,
            'debit',
            invoiceAmount,
            `Monthly invoice - Debit Accounts Receivable`,
            enrollment.boarding_house_id,
            req.user?.id || 1
          ]
        );

        // Credit: Revenue Account
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
            revenueAccount[0].id,
            'credit',
            invoiceAmount,
            `Monthly invoice - Credit Rentals Income`,
            enrollment.boarding_house_id,
            req.user?.id || 1
          ]
        );

        // Update current_account_balances for both accounts
        await updateAccountBalance(
          receivableAccount[0].id,
          invoiceAmount,
          'debit',
          enrollment.boarding_house_id,
          connection
        );

        await updateAccountBalance(
          revenueAccount[0].id,
          invoiceAmount,
          'credit',
          enrollment.boarding_house_id,
          connection
        );

        generatedInvoices.push({
          invoice_id: invoiceResult.insertId,
          student_id: enrollment.student_id,
          student_name: enrollment.student_name,
          enrollment_id: enrollment.enrollment_id,
          amount: invoiceAmount,
          currency: enrollment.currency,
          room_name: enrollment.room_name,
          boarding_house_name: enrollment.boarding_house_name
        });

      } catch (error) {
        console.error(`Error generating invoice for student ${enrollment.student_id}:`, error);
        errors.push({
          student_id: enrollment.student_id,
          student_name: enrollment.student_name,
          error: error.message
        });
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Monthly invoices generated for ${invoice_month}`,
      data: {
        invoice_month: invoice_month,
        total_invoices: generatedInvoices.length,
        total_amount: generatedInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        invoices: generatedInvoices,
        errors: errors
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error generating monthly invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get monthly invoice summary
const getMonthlyInvoiceSummary = async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Get invoice summary for the month
    const [summary] = await db.query(
      `SELECT 
        COUNT(*) as total_invoices,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount
      FROM student_invoices 
      WHERE DATE_FORMAT(invoice_date, '%Y-%m') = ? AND deleted_at IS NULL`,
      [month]
    );

    // Get detailed invoice list
    const [invoices] = await db.query(
      `SELECT 
        si.*,
        s.full_name as student_name,
        r.name as room_name,
        bh.name as boarding_house_name
      FROM student_invoices si
      JOIN students s ON si.student_id = s.id
      JOIN student_enrollments se ON si.enrollment_id = se.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE DATE_FORMAT(si.invoice_date, '%Y-%m') = ? AND si.deleted_at IS NULL
      ORDER BY si.created_at DESC`,
      [month]
    );

    res.json({
      success: true,
      data: {
        month: month,
        summary: summary[0],
        invoices: invoices
      }
    });

  } catch (error) {
    console.error('Error getting monthly invoice summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Preview invoices for a boarding house and month (without generating them)
const previewMonthlyInvoices = async (req, res) => {
  try {
    const { boarding_house_id, invoice_month } = req.query;

    if (!boarding_house_id || !invoice_month) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: boarding_house_id and invoice_month'
      });
    }

    // Get all active enrollments with bed assignments for the boarding house
    // Only include students who are Active and have a bed assigned (status = 'occupied')
    const [activeEnrollments] = await db.query(
      `SELECT 
        se.id as enrollment_id,
        se.student_id,
        COALESCE(b.price, r.price_per_bed, se.agreed_amount) as monthly_rent,
        se.currency,
        s.full_name as student_name,
        s.student_number,
        r.name as room_name,
        bh.name as boarding_house_name,
        bh.id as boarding_house_id,
        COALESCE(sab.current_balance, 0) as current_balance,
        se.start_date,
        se.expected_end_date,
        b.id as bed_id,
        b.bed_number
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      INNER JOIN beds b ON b.enrollment_id = se.id 
        AND b.student_id = se.student_id
        AND b.status = 'occupied'
        AND b.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON sab.enrollment_id = se.id AND sab.student_id = s.id
      WHERE se.deleted_at IS NULL
        AND se.boarding_house_id = ?
        AND s.status = 'Active'
        AND s.deleted_at IS NULL
      ORDER BY s.full_name`,
      [boarding_house_id]
    );

    // Transform data for preview
    const previewData = activeEnrollments.map(enrollment => ({
      enrollment_id: enrollment.enrollment_id,
      student_id: enrollment.student_id,
      student_name: enrollment.student_name,
      student_number: enrollment.student_number,
      room_name: enrollment.room_name,
      monthly_rent: parseFloat(enrollment.monthly_rent),
      currency: enrollment.currency,
      current_balance: parseFloat(enrollment.current_balance),
      start_date: enrollment.start_date,
      expected_end_date: enrollment.expected_end_date
    }));

    res.json({
      success: true,
      data: {
        invoice_month: invoice_month,
        boarding_house_id: parseInt(boarding_house_id),
        boarding_house_name: activeEnrollments.length > 0 ? activeEnrollments[0].boarding_house_name : '',
        total_students: previewData.length,
        total_amount: previewData.reduce((sum, student) => sum + student.monthly_rent, 0),
        students: previewData
      }
    });

  } catch (error) {
    console.error('Error previewing monthly invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  generateMonthlyInvoices,
  getMonthlyInvoiceSummary,
  previewMonthlyInvoices
};
