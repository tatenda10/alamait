const db = require('../services/db');

// Get students by boarding house
const getStudentsByBoardingHouse = async (req, res) => {
  try {
    const { boardingHouseId } = req.params;
    const [students] = await db.query(
      `SELECT 
        s.*,
        se.room_id,
        r.name as room_name,
        se.agreed_amount,
        se.currency,
        se.start_date,
        se.expected_end_date,
        bh.name as boarding_house_name
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
        AND se.deleted_at IS NULL 
        AND se.boarding_house_id = ?
      LEFT JOIN rooms r ON se.room_id = r.id AND r.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON s.boarding_house_id = bh.id AND bh.deleted_at IS NULL
      WHERE s.boarding_house_id = ? 
        AND s.deleted_at IS NULL
      ORDER BY s.full_name`,
      [boardingHouseId, boardingHouseId]
    );
    
    res.json(students);
  } catch (error) {
    console.error('Error in getStudentsByBoardingHouse:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a single student by ID with their details
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [students] = await db.query(
      `SELECT 
        s.*,
        se.room_id,
        r.name as room_name,
        se.start_date,
        se.expected_end_date,
        se.agreed_amount,
        se.admin_fee,
        se.security_deposit,
        se.currency
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
        AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id AND r.deleted_at IS NULL
      WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student documents
    const [documents] = await db.query(
      `SELECT id, doc_type, file_path, uploaded_at
       FROM student_documents
       WHERE student_id = ? AND deleted_at IS NULL
       ORDER BY uploaded_at DESC`,
      [id]
    );

    const studentData = {
      ...students[0],
      documents
    };

    res.json(studentData);
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get list of students
const getStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT 
        s.*,
        se.room_id,
        r.name as room_name,
        se.agreed_amount,
        se.currency,
        bh.name as boarding_house_name
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
        AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id AND r.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON s.boarding_house_id = bh.id AND bh.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
      ORDER BY s.full_name`
    );
    
    // Transform data to match frontend expectations
    const transformedStudents = students.map(student => {
      // Handle null or empty full_name
      const fullName = student.full_name || '';
      const nameParts = fullName.split(' ');
      
      return {
        id: student.id,
        id_number: student.student_number,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        full_name: student.full_name || '',
        email: student.email,
        phone_number: student.phone_number,
        course: student.university,
        year_level: student.year_level || 1,
        room_name: student.room_name || null,
        boarding_house_name: student.boarding_house_name || null,
        status: student.status || 'Inactive'
      };
    });
    
    res.json(transformedStudents);
  } catch (error) {
    console.error('Error in getStudents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new student
const createStudent = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Received request body:', req.body);
    
    const {
      fullName,
      studentNumber,
      nationalId,
      university,
      gender,
      address,
      phoneNumber,
      boardingHouseId,
      roomId,
      startDate,
      expectedEndDate,
      agreedAmount,
      currency
    } = req.body;

    console.log('Parsed student data:', {
      fullName,
      studentNumber,
      nationalId,
      university,
      gender,
      address,
      phoneNumber,
      boardingHouseId,
      roomId,
      startDate,
      expectedEndDate,
      agreedAmount,
      currency
    });

    // Validate required fields
    if (!fullName || !nationalId) {
      console.log('Validation failed. Missing required fields:', {
        hasFullName: !!fullName,
        hasNationalId: !!nationalId
      });
      return res.status(400).json({ message: 'Missing required fields: Full Name and National ID are required' });
    }

    // Check if national ID is unique
    const [existingStudents] = await connection.query(
      'SELECT id FROM students WHERE national_id = ? AND deleted_at IS NULL',
      [nationalId]
    );

    console.log('Existing students check:', {
      nationalId,
      existingCount: existingStudents.length
    });

    if (existingStudents.length > 0) {
      console.log('National ID already exists:', nationalId);
      return res.status(400).json({ message: 'Student with this National ID already exists' });
    }

    // Create student with basic information
    console.log('Attempting to insert student with values:', [
      fullName,
      nationalId,
      university || null,
      gender || 'Female',
      address || null,
      phoneNumber || null,
      boardingHouseId || null,
      'Pending'
    ]);

    const [result] = await connection.query(
      `INSERT INTO students (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, NOW())`,
      [
        fullName,
        nationalId,
        university || null,
        gender || 'Female',
        address || null,
        phoneNumber || null,
        boardingHouseId || null,
        'Pending'
      ]
    );

    console.log('Insert result:', result);

    // If room assignment details are provided, create enrollment
    if (roomId && startDate && expectedEndDate && agreedAmount && currency) {
      console.log('Creating enrollment with details:', {
        studentId: result.insertId,
        roomId,
        startDate,
        expectedEndDate,
        agreedAmount,
        currency,
        boardingHouseId
      });

      await connection.query(
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
          result.insertId,
          roomId,
          startDate,
          expectedEndDate,
          agreedAmount,
          currency,
          boardingHouseId
        ]
      );

      // Update room's available beds
      await connection.query(
        `UPDATE rooms 
         SET available_beds = available_beds - 1,
             updated_at = NOW()
         WHERE id = ?`,
        [roomId]
      );
    }

    const [newStudent] = await connection.query(
      'SELECT * FROM students WHERE id = ?',
      [result.insertId]
    );

    console.log('Successfully created student:', newStudent[0]);

    await connection.commit();
    res.status(201).json(newStudent[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in createStudent:', {
      error: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      code: error.code
    });
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    connection.release();
  }
};

// Update student details
const updateStudent = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const {
      fullName,
      studentNumber,
      nationalId,
      university,
      gender,
      address,
      phoneNumber,
      boardingHouseId,
      status
    } = req.body;

    // Check if student number is unique within the boarding house
    if (studentNumber && boardingHouseId) {
      const [existingStudents] = await connection.query(
        'SELECT id FROM students WHERE student_number = ? AND boarding_house_id = ? AND id != ? AND deleted_at IS NULL',
        [studentNumber, boardingHouseId, id]
      );

      if (existingStudents.length > 0) {
        return res.status(400).json({ message: 'Student number already exists in this boarding house' });
      }
    }

    const [result] = await connection.query(
      `UPDATE students
       SET full_name = COALESCE(?, full_name),
           student_number = COALESCE(?, student_number),
           national_id = COALESCE(?, national_id),
           university = COALESCE(?, university),
           gender = COALESCE(?, gender),
           address = COALESCE(?, address),
           phone_number = COALESCE(?, phone_number),
           boarding_house_id = COALESCE(?, boarding_house_id),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [
        fullName,
        studentNumber,
        nationalId,
        university,
        gender,
        address,
        phoneNumber,
        boardingHouseId,
        status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const [updatedStudent] = await connection.query(
      'SELECT * FROM students WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json(updatedStudent[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateStudent:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete a student (soft delete)
const deleteStudent = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Get current enrollments to update room availability
    const [enrollments] = await connection.query(
      'SELECT room_id FROM student_enrollments WHERE student_id = ? AND deleted_at IS NULL',
      [id]
    );

    // Soft delete student enrollments
    await connection.query(
      'UPDATE student_enrollments SET deleted_at = NOW() WHERE student_id = ? AND deleted_at IS NULL',
      [id]
    );

    // Update room availability for each active enrollment
    for (const enrollment of enrollments) {
      await connection.query(
        `UPDATE rooms 
         SET available_beds = available_beds + 1,
             updated_at = NOW()
         WHERE id = ?`,
        [enrollment.room_id]
      );
    }

    // Soft delete student documents
    await connection.query(
      'UPDATE student_documents SET deleted_at = NOW() WHERE student_id = ? AND deleted_at IS NULL',
      [id]
    );

    // Soft delete student comments
    await connection.query(
      'UPDATE student_comments SET deleted_at = NOW() WHERE student_id = ? AND deleted_at IS NULL',
      [id]
    );

    // Soft delete student
    const [result] = await connection.query(
      'UPDATE students SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await connection.commit();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteStudent:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Upload student documents
const uploadStudentDocuments = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { docType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if student exists
    const [student] = await connection.query(
      'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Save document information
    const [result] = await connection.query(
      `INSERT INTO student_documents (
        student_id,
        doc_type,
        file_path,
        uploaded_at
      ) VALUES (?, ?, ?, NOW())`,
      [id, docType, req.file.path]
    );

    const [newDocument] = await connection.query(
      'SELECT * FROM student_documents WHERE id = ?',
      [result.insertId]
    );

    await connection.commit();
    res.status(201).json(newDocument[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in uploadStudentDocuments:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Assign room to student
const assignRoom = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      roomId, 
      startDate, 
      endDate, 
      agreedAmount,
      adminFee,
      securityDeposit, 
      currency, 
      notes,
      documentId,
      paymentSchedule 
    } = req.body;

    console.log('Room assignment payload:', {
      roomId,
      startDate,
      endDate,
      agreedAmount,
      adminFee,
      securityDeposit,
      currency,
      notes,
      documentId,
      paymentSchedule
    });

    // Check if student exists
    const [student] = await connection.query(
      'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if room exists and has available beds
    const [room] = await connection.query(
      'SELECT id, available_beds FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [roomId]
    );

    if (room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room[0].available_beds < 1) {
      return res.status(400).json({ message: 'No available beds in this room' });
    }

    // Create enrollment with admin fee and security deposit
    const [enrollmentResult] = await connection.query(
      `INSERT INTO student_enrollments (
        student_id,
        room_id,
        start_date,
        expected_end_date,
        agreed_amount,
        admin_fee,
        security_deposit,
        currency,
        notes,
        boarding_house_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT boarding_house_id FROM rooms WHERE id = ?), NOW())`,
      [
        id, 
        roomId, 
        startDate, 
        endDate, 
        agreedAmount,
        adminFee || 0,
        securityDeposit || 0,
        currency, 
        notes, 
        roomId
      ]
    );

    const enrollmentId = enrollmentResult.insertId;

    // Get boarding house ID for transactions
    const [boardingHouse] = await connection.query(
      'SELECT boarding_house_id FROM rooms WHERE id = ?',
      [roomId]
    );
    const boardingHouseId = boardingHouse[0].boarding_house_id;

    // Create transactions and journal entries for admin fee and security deposit
    if (adminFee && parseFloat(adminFee) > 0) {
      // Create transaction for admin fee
      const transactionRef = `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [adminFeeTransaction] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, transaction_date, reference_number, description, 
          total_amount, currency, status, boarding_house_id, created_by
        ) VALUES (?, CURDATE(), ?, ?, ?, ?, 'posted', ?, ?)`,
        [
          'admin_fee',
          transactionRef,
          `Admin fee for student enrollment - ${id}`,
          parseFloat(adminFee),
          currency,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Create journal entries for admin fee
      // Debit: Accounts Receivable (12001)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts_branch WHERE code = '12001' AND branch_id = ? LIMIT 1), 'debit', ?, ?, ?, ?)`,
        [
          adminFeeTransaction.insertId,
          boardingHouseId,
          parseFloat(adminFee),
          `Admin fee receivable - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Credit: Fee Income (40002)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts_branch WHERE code = '40002' AND branch_id = ? LIMIT 1), 'credit', ?, ?, ?, ?)`,
        [
          adminFeeTransaction.insertId,
          boardingHouseId,
          parseFloat(adminFee),
          `Admin fee income - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );
    }

    if (securityDeposit && parseFloat(securityDeposit) > 0) {
      // Create transaction for security deposit
      const transactionRef = `DEPOSIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [depositTransaction] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, transaction_date, reference_number, description, 
          total_amount, currency, status, boarding_house_id, created_by
        ) VALUES (?, CURDATE(), ?, ?, ?, ?, 'posted', ?, ?)`,
        [
          'security_deposit',
          transactionRef,
          `Security deposit for student enrollment - ${id}`,
          parseFloat(securityDeposit),
          currency,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Create journal entries for security deposit
      // Debit: Accounts Receivable (12001)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts_branch WHERE code = '12001' AND branch_id = ? LIMIT 1), 'debit', ?, ?, ?, ?)`,
        [
          depositTransaction.insertId,
          boardingHouseId,
          parseFloat(securityDeposit),
          `Security deposit receivable - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Credit: Security Deposits Payable (20001)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts_branch WHERE code = '20001' AND branch_id = ? LIMIT 1), 'credit', ?, ?, ?, ?)`,
        [
          depositTransaction.insertId,
          boardingHouseId,
          parseFloat(securityDeposit),
          `Security deposit liability - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );
    }

    // Create payment schedules
    if (paymentSchedule && Array.isArray(paymentSchedule)) {
      for (const period of paymentSchedule) {
        await connection.query(
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
            enrollmentId,
            id,
            period.startDate,
            period.endDate,
            period.amount,
            period.currency || currency,
            period.notes
          ]
        );
      }
    }

    // Update room's available beds
    await connection.query(
      `UPDATE rooms 
       SET available_beds = available_beds - 1,
           updated_at = NOW()
       WHERE id = ?`,
      [roomId]
    );

    // Update student status
    await connection.query(
      `UPDATE students 
       SET status = 'Active'
       WHERE id = ?`,
      [id]
    );

    // Get created enrollment with payment schedules
    const [enrollment] = await connection.query(
      `SELECT 
        se.*,
        r.name as room_name,
        r.price_per_bed
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       WHERE se.id = ?`,
      [enrollmentId]
    );

    console.log('Created enrollment:', enrollment[0]);

    const [paymentSchedules] = await connection.query(
      `SELECT 
        ps.*,
        COALESCE(
          (SELECT SUM(amount) 
           FROM student_payments 
           WHERE schedule_id = ps.id AND deleted_at IS NULL
          ), 0
        ) as amount_paid
       FROM student_payment_schedules ps
       WHERE ps.enrollment_id = ? 
         AND ps.deleted_at IS NULL
       ORDER BY ps.period_start_date`,
      [enrollmentId]
    );

    console.log('Created payment schedules:', paymentSchedules);

    await connection.commit();
    res.status(201).json({
      message: 'Room assigned successfully',
      enrollment: enrollment[0],
      paymentSchedules
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in assignRoom:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get student enrollment
const getStudentEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if student exists
    const [students] = await db.query(
      'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get active enrollment
    const [enrollments] = await db.query(
      `SELECT 
        se.id,
        se.student_id,
        se.room_id,
        se.start_date,
        se.expected_end_date,
        se.agreed_amount,
        se.admin_fee,
        se.security_deposit,
        se.currency,
        se.notes,
        se.boarding_house_id,
        se.created_at,
        r.name as room_name,
        r.price_per_bed
      FROM student_enrollments se
      JOIN rooms r ON se.room_id = r.id
      WHERE se.student_id = ? 
        AND se.deleted_at IS NULL
        AND se.start_date <= CURRENT_DATE
        AND (se.expected_end_date >= CURRENT_DATE OR se.expected_end_date IS NULL)
      ORDER BY se.created_at DESC
      LIMIT 1`,
      [id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ message: 'No active enrollment found' });
    }

    // Get payment schedules for this enrollment
    const [schedules] = await db.query(
      `SELECT 
        ps.*,
        COALESCE(
          (SELECT SUM(amount) 
           FROM student_payments 
           WHERE schedule_id = ps.id AND deleted_at IS NULL
          ), 0
        ) as amount_paid
      FROM student_payment_schedules ps
      WHERE ps.enrollment_id = ? 
        AND ps.deleted_at IS NULL
      ORDER BY ps.period_start_date`,
      [enrollments[0].id]
    );

    // Return both enrollment and schedules
    res.json({
      ...enrollments[0],
      payment_schedules: schedules
    });
  } catch (error) {
    console.error('Error in getStudentEnrollment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update student enrollment
const updateEnrollment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { studentId, enrollmentId } = req.params;
    const { 
      roomId, 
      startDate, 
      endDate, 
      agreedAmount, 
      currency, 
      notes 
    } = req.body;

    // Get current enrollment to check room change
    const [currentEnrollment] = await connection.query(
      'SELECT room_id FROM student_enrollments WHERE id = ? AND student_id = ? AND deleted_at IS NULL',
      [enrollmentId, studentId]
    );

    if (currentEnrollment.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const oldRoomId = currentEnrollment[0].room_id;

    // If room is changing, check availability of new room
    if (roomId && roomId !== oldRoomId) {
      const [room] = await connection.query(
        'SELECT id, available_beds FROM rooms WHERE id = ? AND deleted_at IS NULL',
        [roomId]
      );

      if (room.length === 0) {
        return res.status(404).json({ message: 'New room not found' });
      }

      if (room[0].available_beds < 1) {
        return res.status(400).json({ message: 'No available beds in the new room' });
      }

      // Update old room's available beds (+1)
      await connection.query(
        `UPDATE rooms 
         SET available_beds = available_beds + 1,
             updated_at = NOW()
         WHERE id = ?`,
        [oldRoomId]
      );

      // Update new room's available beds (-1)
      await connection.query(
        `UPDATE rooms 
         SET available_beds = available_beds - 1,
             updated_at = NOW()
         WHERE id = ?`,
        [roomId]
      );
    }

    // Update enrollment
    await connection.query(
      `UPDATE student_enrollments
       SET room_id = COALESCE(?, room_id),
           start_date = COALESCE(?, start_date),
           expected_end_date = COALESCE(?, expected_end_date),
           agreed_amount = COALESCE(?, agreed_amount),
           currency = COALESCE(?, currency),
           notes = COALESCE(?, notes),
           updated_at = NOW()
       WHERE id = ? AND student_id = ? AND deleted_at IS NULL`,
      [roomId, startDate, endDate, agreedAmount, currency, notes, enrollmentId, studentId]
    );

    // Get updated enrollment
    const [updatedEnrollment] = await connection.query(
      `SELECT 
        se.id,
        se.student_id,
        se.room_id,
        se.start_date,
        se.expected_end_date,
        se.agreed_amount,
        se.currency,
        se.notes,
        se.boarding_house_id,
        se.created_at,
        r.name as room_name,
        r.price_per_bed
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       WHERE se.id = ?`,
      [enrollmentId]
    );

    await connection.commit();
    res.json({
      message: 'Enrollment updated successfully',
      enrollment: updatedEnrollment[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateEnrollment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get student enrollment history
const getEnrollmentHistory = async (req, res) => {
  try {
    const { id: studentId } = req.params;

    // First check if student exists
    const [students] = await db.query(
      'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const [enrollments] = await db.query(
      `SELECT 
        se.*,
        r.name as room_name,
        CASE
          WHEN se.deleted_at IS NULL AND se.expected_end_date >= CURRENT_DATE THEN 'active'
          WHEN se.checkout_date IS NOT NULL THEN 'terminated'
          ELSE 'completed'
        END as status
      FROM student_enrollments se
      JOIN rooms r ON se.room_id = r.id
      WHERE se.student_id = ?
      ORDER BY se.created_at DESC`,
      [studentId]
    );

    // Return empty array if no enrollments found
    res.json(enrollments);
  } catch (error) {
    console.error('Error in getEnrollmentHistory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getStudentsByBoardingHouse,
  getStudentById,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadStudentDocuments,
  assignRoom,
  getStudentEnrollment,
  updateEnrollment,
  getEnrollmentHistory
};