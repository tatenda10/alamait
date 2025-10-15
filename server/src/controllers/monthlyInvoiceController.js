// Generate monthly invoices for all active students
const generateMonthlyInvoices = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      invoice_month, // Format: YYYY-MM
      invoice_date,
      description_prefix = 'Monthly Rent'
    } = req.body;

    // Validate required fields
    if (!invoice_month) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: invoice_month (format: YYYY-MM)'
      });
    }

    // Parse the invoice month
    const [year, month] = invoice_month.split('-');
    const invoiceDate = invoice_date || new Date();
    
    // Check if invoices for this month already exist
    const [existingInvoices] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM student_invoices 
       WHERE DATE_FORMAT(invoice_date, '%Y-%m') = ? AND deleted_at IS NULL`,
      [invoice_month]
    );

    if (existingInvoices[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Invoices for ${invoice_month} already exist`
      });
    }

    // Get all active enrollments with their monthly rent
    const [activeEnrollments] = await connection.query(
      `SELECT 
        se.id as enrollment_id,
        se.student_id,
        se.agreed_amount as monthly_rent,
        se.currency,
        s.full_name as student_name,
        r.name as room_name,
        bh.name as boarding_house_name,
        COALESCE(sab.current_balance, 0) as current_balance
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN student_account_balances sab ON sab.enrollment_id = se.id
      WHERE se.deleted_at IS NULL
        AND se.start_date <= LAST_DAY(STR_TO_DATE(?, '%Y-%m'))
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= STR_TO_DATE(?, '%Y-%m-01'))
        AND s.status = 'Active'`,
      [invoice_month, invoice_month]
    );

    if (activeEnrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active enrollments found for the specified month'
      });
    }

    const generatedInvoices = [];
    const errors = [];

    // Generate invoice for each active enrollment
    for (const enrollment of activeEnrollments) {
      try {
        // Create invoice for monthly rent
        const invoiceAmount = parseFloat(enrollment.monthly_rent);
        
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
            enrollment.boarding_house_id || 1, // Default to boarding house 1
            1 // Default to user 1
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
            enrollment.boarding_house_id || 1,
            1
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
            enrollment.boarding_house_id || 1,
            1
          ]
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

module.exports = {
  generateMonthlyInvoices,
  getMonthlyInvoiceSummary
};
