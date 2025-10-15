const db = require('../services/db');
const { sendApplicationApprovalEmail, sendApplicationRejectionEmail } = require('../services/emailService');
const { updateAccountBalance } = require('../services/accountBalanceService');

// Submit a new student application
const submitApplication = async (req, res) => {
  try {
    console.log('Received application data:', req.body);
    
    const {
      student_name,
      email,
      phone,
      national_id,
      gender,
      address,
      institution,
      medical_history,
      room_id,
      bed_id,
      preferred_move_in_date,
      lease_start_date,
      lease_end_date,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      additional_notes,
      signature_data
    } = req.body;

    // Validate required fields
    const requiredFields = {
      student_name,
      email,
      phone,
      national_id,
      gender,
      address,
      institution,
      room_id,
      lease_start_date,
      lease_end_date
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if room exists
    const [roomCheck] = await db.query(
      'SELECT id, name FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [room_id]
    );

    if (roomCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if bed exists and is available (if bed_id provided)
    if (bed_id) {
      const [bedCheck] = await db.query(
        'SELECT id, status FROM beds WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
        [bed_id, room_id]
      );

      if (bedCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found in this room'
        });
      }

      if (bedCheck[0].status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Selected bed is not available'
        });
      }
    }

    // Insert application
    const [result] = await db.query(
      `INSERT INTO student_applications (
        student_name, email, phone, national_id, gender, address, institution, medical_history,
        room_id, bed_id, preferred_move_in_date, lease_start_date, lease_end_date,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        additional_notes, signature_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        student_name, email, phone, national_id, gender, address, institution, medical_history,
        room_id, bed_id, preferred_move_in_date, lease_start_date, lease_end_date,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        additional_notes, signature_data
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application_id: result.insertId
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all applications (admin view)
const getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE sa.deleted_at IS NULL';
    let queryParams = [];

    if (status) {
      whereClause += ' AND sa.status = ?';
      queryParams.push(status);
    }

    const [applications] = await db.query(
      `SELECT 
        sa.id,
        sa.student_name,
        sa.email,
        sa.phone,
        sa.national_id,
        sa.gender,
        sa.address,
        sa.institution,
        sa.medical_history,
        sa.room_id,
        sa.bed_id,
        sa.preferred_move_in_date,
        sa.lease_start_date,
        sa.lease_end_date,
        sa.emergency_contact_name,
        sa.emergency_contact_phone,
        sa.emergency_contact_relationship,
        sa.additional_notes,
        sa.signature_data,
        sa.status,
        sa.created_at,
        sa.updated_at,
        r.name as room_name,
        r.boarding_house_id,
        bh.name as boarding_house_name,
        b.bed_number,
        b.price as bed_price
      FROM student_applications sa
      LEFT JOIN rooms r ON sa.room_id = r.id
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON sa.bed_id = b.id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM student_applications sa ${whereClause}`,
      queryParams
    );

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single application
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [applications] = await db.query(
      `SELECT 
        sa.id,
        sa.student_name,
        sa.email,
        sa.phone,
        sa.institution,
        sa.medical_history,
        sa.room_id,
        sa.bed_id,
        sa.preferred_move_in_date,
        sa.emergency_contact_name,
        sa.emergency_contact_phone,
        sa.emergency_contact_relationship,
        sa.additional_notes,
        sa.status,
        sa.created_at,
        sa.updated_at,
        r.name as room_name,
        r.description as room_description,
        r.amenities as room_amenities,
        r.capacity as room_capacity,
        r.boarding_house_id,
        bh.name as boarding_house_name,
        b.bed_number,
        b.price as bed_price
      FROM student_applications sa
      LEFT JOIN rooms r ON sa.room_id = r.id
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON sa.bed_id = b.id
      WHERE sa.id = ? AND sa.deleted_at IS NULL`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: applications[0]
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status, admin_notes, auto_assign_room = false } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, rejected, or under_review'
      });
    }

    // Get application details
    const [applications] = await connection.query(
      `SELECT 
        sa.*,
        r.name as room_name,
        r.price_per_bed,
        r.admin_fee,
        r.boarding_house_id,
        bh.name as boarding_house_name,
        b.bed_number,
        b.price as bed_price
      FROM student_applications sa
      LEFT JOIN rooms r ON sa.room_id = r.id
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON sa.bed_id = b.id
      WHERE sa.id = ? AND sa.deleted_at IS NULL`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = applications[0];

    // Prevent re-approval or any further changes once approved
    if (application.status === 'approved') {
      if (status === 'approved') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Application is already approved and cannot be approved again.'
        });
      } else {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Approved applications are locked and cannot be changed.'
        });
      }
    }

    // Update application status
    await connection.query(
      'UPDATE student_applications SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
      [status, admin_notes || null, id]
    );

    // Send email notification for rejected applications
    if (status === 'rejected') {
      try {
        await sendApplicationRejectionEmail(
          application.email,
          application.student_name,
          admin_notes
        );
        console.log(`Rejection email sent to ${application.email}`);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't fail the transaction if email fails
      }
    }

    let studentData = null;
    let enrollmentData = null;

    // If approved and auto_assign_room is true, create student and assign room
    if (status === 'approved' && auto_assign_room) {
      // Generate unique student ID
      const generateStudentId = () => {
        const prefix = 'STU';
        const randomNum = Math.floor(Math.random() * 900000) + 100000;
        return `${prefix}${randomNum}`;
      };

      let studentId;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        studentId = generateStudentId();
        const [existing] = await connection.query(
          'SELECT id FROM students WHERE student_id = ?',
          [studentId]
        );
        if (existing.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Unable to generate unique student ID');
      }

      // Create student
      const [studentResult] = await connection.query(
        `INSERT INTO students (
          student_id,
          full_name,
          national_id,
          university,
          gender,
          address,
          phone_number,
          boarding_house_id,
          joined_at,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, NOW())`,
        [
          studentId,
          application.student_name,
          application.national_id || `APP-${id}`, // Use national_id from application or fallback
          application.institution,
          application.gender || 'Female', // Use gender from application or default
          application.address || null, // Use address from application
          application.phone,
          application.boarding_house_id,
          'Active'
        ]
      );

      const studentId_db = studentResult.insertId;

      // Create enrollment
      const [enrollmentResult] = await connection.query(
        `INSERT INTO student_enrollments (
          student_id,
          room_id,
          start_date,
          expected_end_date,
          agreed_amount,
          currency,
          boarding_house_id,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          studentId_db,
          application.room_id,
          application.lease_start_date || application.preferred_move_in_date || new Date(),
          application.lease_end_date || null,
          application.bed_price || application.price_per_bed || 0,
          'USD', // Default currency
          application.boarding_house_id
        ]
      );

      const enrollmentId = enrollmentResult.insertId;

      // Create student account balance (start with zero balance)
      await connection.query(
        `INSERT INTO student_account_balances (
          student_id,
          enrollment_id,
          current_balance,
          currency,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [studentId_db, enrollmentId, 0, 'USD'] // Start with zero balance, invoices will debit it
      );

      // Create initial invoice for first month (includes monthly rent + admin fee)
      const monthlyRent = parseFloat(application.bed_price || application.price_per_bed || 0);
      const adminFeeAmount = parseFloat(application.admin_fee || 0); // Use room's admin fee, fallback to 0 if not set
      const firstInvoiceTotal = monthlyRent + adminFeeAmount;
      const startDateObj = new Date(application.preferred_move_in_date || new Date());
      const invoiceDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1); // First day of the month
      const invoiceRef = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create invoice for first month (rent + admin fee if applicable)
      const invoiceDescription = adminFeeAmount > 0 
        ? `First month rent + admin fee for ${startDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        : `First month rent for ${startDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      
      const invoiceNotes = adminFeeAmount > 0 
        ? `Initial invoice: Monthly rent (USD ${monthlyRent.toFixed(2)}) + Admin fee (USD ${adminFeeAmount.toFixed(2)})`
        : `Initial invoice: Monthly rent (USD ${monthlyRent.toFixed(2)})`;
      
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
          studentId_db,
          enrollmentId,
          firstInvoiceTotal,
          invoiceDescription,
          invoiceDate,
          invoiceRef,
          invoiceNotes,
          'pending'
        ]
      );

      // Update student account balance (debit the account for the invoice)
      await connection.query(
        `UPDATE student_account_balances 
         SET current_balance = current_balance - ?,
             updated_at = NOW()
         WHERE student_id = ? AND enrollment_id = ?`,
        [firstInvoiceTotal, studentId_db, enrollmentId]
      );

      // Create journal entries for the initial invoice
      const invoiceTransactionRef = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create transaction record for the invoice
      const [invoiceTransactionResult] = await connection.query(
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
          'initial_invoice',
          studentId_db,
          invoiceTransactionRef,
          firstInvoiceTotal,
          'USD',
          `Initial invoice - ${application.student_name}`,
          invoiceDate,
          application.boarding_house_id,
          req.user?.id || 1,
          'posted'
        ]
      );

      // Get account IDs for journal entries
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

      // Create journal entries for the initial invoice
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
          invoiceTransactionResult.insertId,
          receivableAccount[0].id,
          'debit',
          firstInvoiceTotal,
          `Initial invoice - Debit Accounts Receivable`,
          application.boarding_house_id,
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
          invoiceTransactionResult.insertId,
          revenueAccount[0].id,
          'credit',
          firstInvoiceTotal,
          `Initial invoice - Credit Rentals Income`,
          application.boarding_house_id,
          req.user?.id || 1
        ]
      );

      // Update account balances after creating journal entries
      await updateAccountBalance(
        receivableAccount[0].id,
        firstInvoiceTotal,
        'debit',
        application.boarding_house_id,
        connection
      );

      await updateAccountBalance(
        revenueAccount[0].id,
        firstInvoiceTotal,
        'credit',
        application.boarding_house_id,
        connection
      );

      console.log('Created initial monthly rent invoice from application:', invoiceResult.insertId);

      // Assign specific bed if bed_id provided
      if (application.bed_id) {
        await connection.query(
          `UPDATE beds SET 
            status = 'occupied',
            student_id = ?,
            enrollment_id = ?,
            updated_at = NOW()
          WHERE id = ?`,
          [studentId_db, enrollmentId, application.bed_id]
        );
      }

      // Update room's available beds count
      await connection.query(
        `UPDATE rooms 
         SET available_beds = available_beds - 1,
             updated_at = NOW()
         WHERE id = ?`,
        [application.room_id]
      );

      // Get created student and enrollment data
      const [student] = await connection.query(
        'SELECT * FROM students WHERE id = ?',
        [studentId_db]
      );

      const [enrollment] = await connection.query(
        `SELECT 
          se.*,
          r.name as room_name,
          b.bed_number,
          b.price as bed_price
         FROM student_enrollments se
         JOIN rooms r ON se.room_id = r.id
         LEFT JOIN beds b ON b.enrollment_id = se.id
         WHERE se.id = ?`,
        [enrollmentId]
      );

      studentData = student[0];
      enrollmentData = enrollment[0];

      // Send email notification
      try {
        await sendApplicationApprovalEmail(
          application.email,
          application.student_name,
          studentData.student_id,
          enrollmentData.room_name,
          application.boarding_house_name
        );
        console.log(`Approval email sent to ${application.email}`);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the transaction if email fails
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application_id: id,
        status: status,
        student: studentData,
        enrollment: enrollmentData
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete application (soft delete)
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE student_applications SET deleted_at = NOW() WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
};
