const db = require('../services/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { updateAccountBalance } = require('../services/accountBalanceService');

// Student login authentication
const studentLogin = async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and password are required' 
      });
    }

    // Find student by student_id
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
        se.currency,
        bh.name as boarding_house_name,
        sab.current_balance as account_balance
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
        AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id AND r.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON s.boarding_house_id = bh.id AND bh.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.student_id = ? AND s.deleted_at IS NULL`,
      [student_id]
    );

    if (students.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Student ID or password' 
      });
    }

    const student = students[0];

    // Check if student has a password set, otherwise use student_id as fallback
    if (student.password) {
      // Use bcrypt to compare hashed password
      const validPassword = await bcrypt.compare(password, student.password);
      if (!validPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Student ID or password' 
        });
      }
    } else {
      // Fallback to student_id as password for backward compatibility
      if (password !== student_id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Student ID or password' 
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        studentId: student.id,
        student_id: student.student_id,
        boardingHouseId: student.boarding_house_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return student data without sensitive information
    const studentData = {
      id: student.id,
      student_id: student.student_id,
      full_name: student.full_name,
      national_id: student.national_id,
      phone_number: student.phone_number,
      university: student.university,
      status: student.status,
      room_id: student.room_id,
      room_name: student.room_name,
      boarding_house_name: student.boarding_house_name,
      agreed_amount: student.agreed_amount,
      admin_fee: student.admin_fee,
      security_deposit: student.security_deposit,
      currency: student.currency,
      start_date: student.start_date,
      expected_end_date: student.expected_end_date,
      account_balance: student.account_balance || 0
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      student: studentData
    });

  } catch (error) {
    console.error('Error in studentLogin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get students by boarding house (including students without enrollments and past enrollments)
const getStudentsByBoardingHouse = async (req, res) => {
  try {
    const { boardingHouseId } = req.params;
    // Get students with enrollments in this boarding house (including past/terminated enrollments)
    // Also include students with no enrollments at all (they might have left but still owe money)
    const [students] = await db.query(
      `SELECT DISTINCT
        s.*,
        latest_se.room_id,
        r.name as room_name,
        latest_se.agreed_amount,
        latest_se.currency,
        latest_se.start_date,
        latest_se.expected_end_date,
        latest_se.boarding_house_id,
        latest_se.id as enrollment_id,
        bh.name as boarding_house_name,
        COALESCE(sab.current_balance, 0) as current_balance,
        COALESCE(sab.currency, 'USD') as balance_currency
      FROM students s
      LEFT JOIN (
        SELECT se1.*
        FROM student_enrollments se1
        INNER JOIN (
          SELECT student_id, MAX(created_at) as max_created_at
          FROM student_enrollments
          WHERE deleted_at IS NULL 
            AND boarding_house_id = ?
          GROUP BY student_id
        ) se2 ON se1.student_id = se2.student_id 
          AND se1.created_at = se2.max_created_at
        WHERE se1.deleted_at IS NULL 
          AND se1.boarding_house_id = ?
      ) latest_se ON s.id = latest_se.student_id
      LEFT JOIN rooms r ON latest_se.room_id = r.id AND r.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON latest_se.boarding_house_id = bh.id AND bh.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id 
        AND (latest_se.id = sab.enrollment_id OR latest_se.id IS NULL)
      WHERE s.deleted_at IS NULL
        AND (
          latest_se.boarding_house_id = ? 
          OR latest_se.boarding_house_id IS NULL
        )
      ORDER BY s.full_name`,
      [boardingHouseId, boardingHouseId, boardingHouseId]
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
    // Get students with their most recent enrollment's boarding house
    const [students] = await db.query(
      `SELECT 
        s.*,
        latest_se.room_id,
        r.name as room_name,
        latest_se.agreed_amount,
        latest_se.currency,
        latest_se.boarding_house_id,
        latest_se.id as enrollment_id,
        bh.name as boarding_house_name,
        latest_se.start_date,
        COALESCE(sab.current_balance, 0) as current_balance,
        COALESCE(sab.currency, 'USD') as balance_currency
      FROM students s
      LEFT JOIN (
        SELECT se.*
        FROM (
          SELECT se.*,
            ROW_NUMBER() OVER (PARTITION BY se.student_id ORDER BY se.start_date DESC, se.id DESC) as rn
          FROM student_enrollments se
          WHERE se.deleted_at IS NULL
        ) se
        WHERE se.rn = 1
      ) latest_se ON s.id = latest_se.student_id
      LEFT JOIN rooms r ON latest_se.room_id = r.id AND r.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON latest_se.boarding_house_id = bh.id AND bh.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id 
        AND (latest_se.id = sab.enrollment_id OR latest_se.id IS NULL)
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
        student_number: student.student_number,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        full_name: student.full_name || '',
        email: student.email,
        phone_number: student.phone_number,
        course: student.university,
        year_level: student.year_level || 1,
        room_name: student.room_name || null,
        boarding_house_name: student.boarding_house_name || null,
        status: student.status || 'Inactive',
        current_balance: parseFloat(student.current_balance || 0),
        balance_currency: student.balance_currency || 'USD',
        enrollment_id: student.enrollment_id
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

    // Generate unique student ID
    const generateStudentId = () => {
      const prefix = 'STU';
      const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
      return `${prefix}${randomNum}`;
    };

    let studentId;
    let isUnique = false;
    let attempts = 0;
    
    // Ensure student ID is unique
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
      throw new Error('Unable to generate unique student ID after multiple attempts');
    }

    // Create student with basic information
    console.log('Attempting to insert student with values:', [
      studentId,
      fullName,
      nationalId,
      university || null,
      gender || 'Female',
      address || null,
      phoneNumber || null,
      boardingHouseId || null,
      'Active'
    ]);

    const [result] = await connection.query(
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
        fullName,
        nationalId,
        university || null,
        gender || 'Female',
        address || null,
        phoneNumber || null,
        boardingHouseId || null,
        'Active'
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
           status = COALESCE(?, status)
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

// Assign room to student with specific bed
const assignRoom = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      roomId, 
      bedId, // New: specific bed ID
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
      bedId,
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

    // Check if room exists
    const [room] = await connection.query(
      'SELECT id, available_beds, boarding_house_id FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [roomId]
    );

    if (room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const boardingHouseId = room[0].boarding_house_id;

    // Bed selection is REQUIRED
    if (!bedId) {
      return res.status(400).json({ message: 'Bed selection is required. Please select a specific bed.' });
    }

    // Check if that specific bed is available
    const [bed] = await connection.query(
      'SELECT id, status, price FROM beds WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
      [bedId, roomId]
    );

    if (bed.length === 0) {
      return res.status(404).json({ message: 'Bed not found in this room' });
    }

    if (bed[0].status !== 'available') {
      return res.status(400).json({ message: 'Selected bed is not available' });
    }

    // Use the bed's specific price if no agreed amount is provided
    if (!agreedAmount && bed[0].price) {
      agreedAmount = bed[0].price;
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
        boardingHouseId
      ]
    );

    const enrollmentId = enrollmentResult.insertId;

    // Get boarding house ID for transactions (already available from above)

    // Create transactions and journal entries for admin fee and security deposit
    if (adminFee && parseFloat(adminFee) > 0) {
      // Create transaction for admin fee
      const transactionRef = `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Date admin fee at the start of the month (same as rent invoice)
      const startMonthDateObj = new Date(startDate);
      const adminFeeDate = new Date(startMonthDateObj.getFullYear(), startMonthDateObj.getMonth(), 1);
      const [adminFeeTransaction] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, transaction_date, reference, description, 
          amount, currency, status, boarding_house_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 'posted', ?, ?)`,
        [
          'admin_fee',
          adminFeeDate,
          transactionRef,
          `Admin fee for student enrollment - ${id}`,
          parseFloat(adminFee),
          currency,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Create journal entries for admin fee
      // Debit: Accounts Receivable (10005)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL LIMIT 1), 'debit', ?, ?, ?, ?)`,
        [
          adminFeeTransaction.insertId,
          parseFloat(adminFee),
          `Admin fee receivable - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Credit: Rentals Income (40001)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts WHERE code = '40001' AND deleted_at IS NULL LIMIT 1), 'credit', ?, ?, ?, ?)`,
        [
          adminFeeTransaction.insertId,
          parseFloat(adminFee),
          `Admin fee income - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Update account balances for admin fee
      const [adminFeeReceivableAccount] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['10005']
      );
      const [adminFeeRevenueAccount] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['40001']
      );

      await updateAccountBalance(
        adminFeeReceivableAccount[0].id,
        parseFloat(adminFee),
        'debit',
        boardingHouseId,
        connection
      );

      await updateAccountBalance(
        adminFeeRevenueAccount[0].id,
        parseFloat(adminFee),
        'credit',
        boardingHouseId,
        connection
      );
    }

    if (securityDeposit && parseFloat(securityDeposit) > 0) {
      // Create transaction for security deposit
      const transactionRef = `DEPOSIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [depositTransaction] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, transaction_date, reference, description, 
          amount, currency, status, boarding_house_id, created_by
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
      // Debit: Accounts Receivable (10005)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL LIMIT 1), 'debit', ?, ?, ?, ?)`,
        [
          depositTransaction.insertId,
          parseFloat(securityDeposit),
          `Security deposit receivable - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Credit: Account Payables (20001)
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, (SELECT id FROM chart_of_accounts WHERE code = '20001' AND deleted_at IS NULL LIMIT 1), 'credit', ?, ?, ?, ?)`,
        [
          depositTransaction.insertId,
          parseFloat(securityDeposit),
          `Security deposit liability - Student ${id}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Update account balances for security deposit
      const [depositReceivableAccount] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['10005']
      );
      const [depositLiabilityAccount] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['20001']
      );

      await updateAccountBalance(
        depositReceivableAccount[0].id,
        parseFloat(securityDeposit),
        'debit',
        boardingHouseId,
        connection
      );

      await updateAccountBalance(
        depositLiabilityAccount[0].id,
        parseFloat(securityDeposit),
        'credit',
        boardingHouseId,
        connection
      );
    }

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
      [id, enrollmentId, 0, currency] // Start with zero balance, invoices will debit it
    );

    // Assign specific bed if bedId is provided
    if (bedId) {
      await connection.query(
        `UPDATE beds SET 
          status = 'occupied',
          student_id = ?,
          enrollment_id = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [id, enrollmentId, bedId]
      );
    }

    // Update room's available beds count
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

    // Get created enrollment with payment schedules and bed information
    const [enrollment] = await connection.query(
      `SELECT 
        se.*,
        r.name as room_name,
        r.price_per_bed,
        b.bed_number,
        b.price as bed_price,
        b.status as bed_status
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       LEFT JOIN beds b ON b.enrollment_id = se.id
       WHERE se.id = ?`,
      [enrollmentId]
    );

    console.log('Created enrollment:', enrollment[0]);

    // Get account balance instead of payment schedules
    const [accountBalance] = await connection.query(
      `SELECT current_balance, currency 
       FROM student_account_balances 
       WHERE student_id = ? AND enrollment_id = ?`,
      [id, enrollmentId]
    );

    console.log('Created account balance:', accountBalance[0]);

    // Create initial invoice for first month (includes monthly rent + admin fee)
    const startDateObj = new Date(startDate);
    const invoiceDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1); // First day of the month
    const invoiceRef = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate total for first invoice: RENT + ADMIN FEE
    const monthlyRent = parseFloat(agreedAmount);
    const adminFeeAmount = parseFloat(adminFee || 0);
    const firstInvoiceTotal = monthlyRent + adminFeeAmount;
    
    // Create invoice for first month (rent + admin fee)
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
        id,
        enrollmentId,
        firstInvoiceTotal,
        adminFeeAmount > 0 
          ? `First month rent + admin fee for ${startDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          : `First month rent for ${startDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        invoiceDate,
        invoiceRef,
        adminFeeAmount > 0
          ? `Initial invoice: Monthly rent (${currency} ${monthlyRent.toFixed(2)}) + Admin fee (${currency} ${adminFeeAmount.toFixed(2)})`
          : `Initial invoice: Monthly rent (${currency} ${monthlyRent.toFixed(2)})`,
        'pending'
      ]
    );

    // Update student account balance (debit the account for the invoice)
    await connection.query(
      `UPDATE student_account_balances 
       SET current_balance = current_balance - ?,
           updated_at = NOW()
       WHERE student_id = ? AND enrollment_id = ?`,
      [firstInvoiceTotal, id, enrollmentId]
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
        id,
        invoiceTransactionRef,
        firstInvoiceTotal,
        currency,
        `Initial invoice - ${enrollment[0].full_name || 'Student'}`,
        invoiceDate,
        boardingHouseId,
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
    // Debit: Accounts Receivable (increases receivable) - for rent only
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
        monthlyRent,
        `Initial invoice - Debit Accounts Receivable (Rent)`,
        boardingHouseId,
        req.user?.id || 1
      ]
    );

    // Credit: Revenue Account - for rent only
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
        monthlyRent,
        `Initial invoice - Credit Rentals Income (Rent)`,
        boardingHouseId,
        req.user?.id || 1
      ]
    );
    
    // Note: Admin fee is handled separately in its own transaction (lines 806-883)
    // This ensures proper accounting while including it in the student balance

    // Update account balances after creating journal entries (rent only)
    // Admin fee account balances are updated separately in lines 868-882
    await updateAccountBalance(
      receivableAccount[0].id,
      monthlyRent,
      'debit',
      boardingHouseId,
      connection
    );

    await updateAccountBalance(
      revenueAccount[0].id,
      monthlyRent,
      'credit',
      boardingHouseId,
      connection
    );

    console.log('Created initial monthly rent invoice:', invoiceResult.insertId);

    await connection.commit();
    res.status(201).json({
      message: 'Room assigned successfully',
      enrollment: enrollment[0],
      account_balance: accountBalance[0]
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

    // Get account balance instead of payment schedules
    const [accountBalance] = await db.query(
      `SELECT current_balance, currency 
       FROM student_account_balances 
       WHERE student_id = ? AND enrollment_id = ?`,
      [id, enrollments[0].id]
    );

    // Return enrollment with account balance
    res.json({
      ...enrollments[0],
      account_balance: accountBalance[0] || { current_balance: 0, currency: 'USD' }
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
      bedId, // Bed ID for bed assignment
      startDate, 
      endDate, 
      agreedAmount, 
      currency, 
      notes 
    } = req.body;

    // Get current enrollment to check room and bed change
    const [currentEnrollment] = await connection.query(
      'SELECT room_id FROM student_enrollments WHERE id = ? AND student_id = ? AND deleted_at IS NULL',
      [enrollmentId, studentId]
    );

    if (currentEnrollment.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const oldRoomId = currentEnrollment[0].room_id;

    // If room is changing, bed selection is REQUIRED
    if (roomId && roomId !== oldRoomId) {
      if (!bedId) {
        return res.status(400).json({ message: 'Bed selection is required when changing rooms. Please select a specific bed.' });
      }

      const [room] = await connection.query(
        'SELECT id, available_beds FROM rooms WHERE id = ? AND deleted_at IS NULL',
        [roomId]
      );

      if (room.length === 0) {
        return res.status(404).json({ message: 'New room not found' });
      }

      // Check if the selected bed is available in the new room
      const [bed] = await connection.query(
        'SELECT id, status, price FROM beds WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
        [bedId, roomId]
      );

      if (bed.length === 0) {
        return res.status(404).json({ message: 'Bed not found in the new room' });
      }

      if (bed[0].status !== 'available') {
        return res.status(400).json({ message: 'Selected bed is not available in the new room' });
      }

      // Free up the old bed (if one was assigned)
      await connection.query(
        `UPDATE beds 
         SET status = 'available',
             student_id = NULL,
             enrollment_id = NULL,
             updated_at = NOW()
         WHERE enrollment_id = ? AND deleted_at IS NULL`,
        [enrollmentId]
      );

      // Assign the new bed
      await connection.query(
        `UPDATE beds 
         SET status = 'occupied',
             student_id = ?,
             enrollment_id = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [studentId, enrollmentId, bedId]
      );

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
    } else if (bedId && roomId === oldRoomId) {
      // If only bed is changing (same room), validate and update bed
      const [bed] = await connection.query(
        'SELECT id, status, price FROM beds WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
        [bedId, roomId]
      );

      if (bed.length === 0) {
        return res.status(404).json({ message: 'Bed not found in this room' });
      }

      if (bed[0].status !== 'available') {
        return res.status(400).json({ message: 'Selected bed is not available' });
      }

      // Free up the old bed
      await connection.query(
        `UPDATE beds 
         SET status = 'available',
             student_id = NULL,
             enrollment_id = NULL,
             updated_at = NOW()
         WHERE enrollment_id = ? AND deleted_at IS NULL`,
        [enrollmentId]
      );

      // Assign the new bed
      await connection.query(
        `UPDATE beds 
         SET status = 'occupied',
             student_id = ?,
             enrollment_id = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [studentId, enrollmentId, bedId]
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
           notes = COALESCE(?, notes)
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

    // Update invoice status based on payment
    // Find unpaid invoices for this student and mark them as paid if payment covers them
    const [unpaidInvoices] = await connection.query(
      `SELECT id, amount, status 
       FROM student_invoices 
       WHERE student_id = ? AND enrollment_id = ? AND status = 'pending' AND deleted_at IS NULL
       ORDER BY invoice_date ASC`,
      [student_id, enrollment_id]
    );

    let remainingPayment = parseFloat(amount);
    
    for (const invoice of unpaidInvoices) {
      if (remainingPayment <= 0) break;
      
      const invoiceAmount = parseFloat(invoice.amount);
      
      if (remainingPayment >= invoiceAmount) {
        // Payment covers this invoice completely
        await connection.query(
          `UPDATE student_invoices 
           SET status = 'paid', updated_at = NOW()
           WHERE id = ?`,
          [invoice.id]
        );
        remainingPayment -= invoiceAmount;
      } else {
        // Partial payment - could implement partial payment logic here
        // For now, we'll leave it as pending
        break;
      }
    }

    // Create journal entries for the main accounting system
    const transactionRef = reference_number || `STU-PAY-${paymentResult.insertId}`;
    
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
        'student_payment',
        student_id,
        transactionRef,
        amount,
        enrollment[0].currency,
        `Student payment - ${enrollment[0].full_name}`,
        payment_date || new Date(),
        enrollment[0].boarding_house_id,
        req.user?.id || 1, // Default to user 1 if no auth
        'posted'
      ]
    );

    // Determine cash account based on payment method
    let cashAccountCode;
    switch (payment_method) {
      case 'cash':
      case 'cash_to_admin':
        cashAccountCode = '10002'; // Cash
        break;
      case 'cash_to_ba':
        // For cash to BA, we need to handle petty cash
        cashAccountCode = '10001'; // Petty Cash
        break;
      case 'bank':
      case 'bank_transfer':
        cashAccountCode = '10003'; // CBZ Bank Account
        break;
      case 'mobile_money':
        cashAccountCode = '10002'; // Cash (treat mobile money as cash)
        break;
      default:
        cashAccountCode = '10002'; // Default to Cash
    }

    // Get account IDs
    const [cashAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      [cashAccountCode]
    );

    const [receivableAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10005'] // Accounts Receivable
    );

    if (cashAccount.length === 0 || receivableAccount.length === 0) {
      throw new Error('Required accounts not found in chart of accounts');
    }

    // Create journal entries
    // Debit: Cash/Bank Account
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
        cashAccount[0].id,
        'debit',
        amount,
        `Student payment - Debit ${cashAccountCode === '10001' ? 'Petty Cash' : cashAccountCode === '10002' ? 'Cash' : 'Bank'}`,
        enrollment[0].boarding_house_id,
        req.user?.id || 1
      ]
    );

    // Credit: Accounts Receivable (reduces receivable)
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
        'credit',
        amount,
        `Student payment - Credit Accounts Receivable`,
        enrollment[0].boarding_house_id,
        req.user?.id || 1
      ]
    );

    // Update account balances after creating journal entries
    console.log('Updating account balances for payment:');
    console.log('Cash Account ID:', cashAccount[0].id, 'Amount:', amount, 'Type: debit');
    console.log('Receivable Account ID:', receivableAccount[0].id, 'Amount:', amount, 'Type: credit');
    
    await updateAccountBalance(
      cashAccount[0].id,
      amount,
      'debit',
      enrollment[0].boarding_house_id,
      connection
    );

    await updateAccountBalance(
      receivableAccount[0].id,
      amount,
      'credit',
      enrollment[0].boarding_house_id,
      connection
    );
    
    console.log('Account balance updates completed');

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

    // Create journal entries for the main accounting system
    const transactionRef = reference_number || `STU-INV-${invoiceResult.insertId}`;
    
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
        'student_invoice',
        student_id,
        transactionRef,
        amount,
        enrollment[0].currency,
        `Student invoice - ${enrollment[0].full_name}`,
        invoice_date || new Date(),
        enrollment[0].boarding_house_id,
        req.user?.id || 1, // Default to user 1 if no auth
        'posted'
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
        amount,
        `Student invoice - Debit Accounts Receivable`,
        enrollment[0].boarding_house_id,
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
        amount,
        `Student invoice - Credit Rentals Income`,
        enrollment[0].boarding_house_id,
        req.user?.id || 1
      ]
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

// Get student invoices
const getStudentInvoices = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Get student invoices
    const [invoices] = await connection.query(
      `SELECT 
        si.*,
        se.currency,
        r.name as room_name
       FROM student_invoices si
       JOIN student_enrollments se ON si.enrollment_id = se.id
       LEFT JOIN rooms r ON se.room_id = r.id
       WHERE si.student_id = ? 
         AND si.deleted_at IS NULL
       ORDER BY si.invoice_date DESC, si.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      invoices: invoices
    });

  } catch (error) {
    console.error('Error fetching student invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get student payments for dashboard
const getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [payments] = await db.query(
      `SELECT 
        sp.id,
        sp.amount,
        sp.payment_method,
        sp.payment_date,
        sp.notes,
        sp.reference_number,
        sp.payment_type,
        sp.created_at
      FROM student_payments sp
      WHERE sp.student_id = ? AND sp.deleted_at IS NULL
      ORDER BY sp.payment_date DESC, sp.created_at DESC
      LIMIT 50`,
      [studentId]
    );

    res.json(payments);
  } catch (error) {
    console.error('Error in getStudentPayments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get student invoices for dashboard
const getStudentInvoicesForDashboard = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [invoices] = await db.query(
      `SELECT 
        si.id,
        si.reference_number,
        si.amount,
        si.description,
        si.invoice_date,
        si.status,
        si.notes,
        si.created_at
      FROM student_invoices si
      WHERE si.student_id = ? AND si.deleted_at IS NULL
      ORDER BY si.invoice_date DESC, si.created_at DESC
      LIMIT 50`,
      [studentId]
    );

    res.json(invoices);
  } catch (error) {
    console.error('Error in getStudentInvoicesForDashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit lease signature
const submitLeaseSignature = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { signature_data } = req.body;

    if (!signature_data) {
      return res.status(400).json({
        success: false,
        message: 'Signature data is required'
      });
    }

    // First, get the student information
    const [students] = await db.query(
      'SELECT full_name FROM students WHERE id = ? AND deleted_at IS NULL',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = students[0];

    // Update student application with signature data
    const [result] = await db.query(
      `UPDATE student_applications 
       SET signature_data = ?, updated_at = NOW() 
       WHERE student_name = ? AND deleted_at IS NULL`,
      [signature_data, student.full_name]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student application not found'
      });
    }

    res.json({
      success: true,
      message: 'Lease signature submitted successfully'
    });

  } catch (error) {
    console.error('Error in submitLeaseSignature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change student password
const changeStudentPassword = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const studentId = req.user.studentId; // From JWT token
    
    // Check if this is a student token or admin token
    if (!studentId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - please login as a student' 
      });
    }

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password and confirmation do not match' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Get current student data
    const [students] = await connection.query(
      'SELECT id, student_id, password FROM students WHERE id = ? AND deleted_at IS NULL',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const student = students[0];

    // Verify current password
    let currentPasswordValid = false;
    
    if (student.password) {
      // Student has a hashed password
      currentPasswordValid = await bcrypt.compare(currentPassword, student.password);
    } else {
      // Fallback to student_id as password
      currentPasswordValid = (currentPassword === student.student_id);
    }

    if (!currentPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await connection.query(
      'UPDATE students SET password = ? WHERE id = ?',
      [hashedNewPassword, studentId]
    );

    await connection.commit();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in changeStudentPassword:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  } finally {
    connection.release();
  }
};

// Add student previous balance
// This function allows adding a previous balance (debit or credit) to a student's account
// It creates journal entries affecting Accounts Receivable and Revenue accounts
const addStudentPreviousBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      student_id,
      enrollment_id,
      amount,
      balance_type, // 'debit' (student owes) or 'credit' (student has prepaid/credit)
      description,
      transaction_date,
      reference_number,
      notes
    } = req.body;

    // Validate required fields
    if (!student_id || !enrollment_id || !amount || !balance_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, enrollment_id, amount, balance_type (debit or credit)'
      });
    }

    if (balance_type !== 'debit' && balance_type !== 'credit') {
      return res.status(400).json({
        success: false,
        message: 'balance_type must be either "debit" or "credit"'
      });
    }

    // Check if student and enrollment exist
    const [enrollment] = await connection.query(
      `SELECT se.*, s.full_name, s.student_number, r.name as room_name, bh.id as boarding_house_id, bh.name as boarding_house_name
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN rooms r ON se.room_id = r.id
       JOIN boarding_houses bh ON se.boarding_house_id = bh.id
       WHERE se.student_id = ? AND se.id = ? AND se.deleted_at IS NULL`,
      [student_id, enrollment_id]
    );

    if (enrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student enrollment not found'
      });
    }

    const enrollmentData = enrollment[0];
    const boardingHouseId = enrollmentData.boarding_house_id;
    const amountValue = parseFloat(amount);

    // Get account IDs
    const [receivableAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10005'] // Accounts Receivable
    );

    // Use Rentals Income (40001) as default, but allow for other income accounts
    const revenueAccountCode = req.body.revenue_account_code || '40001'; // Default to Rentals Income
    const [revenueAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      [revenueAccountCode]
    );

    if (receivableAccount.length === 0 || revenueAccount.length === 0) {
      throw new Error('Required accounts not found in chart of accounts');
    }

    // Create transaction record
    const transactionRef = reference_number || `PREV-BAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionDescription = description || `Previous balance adjustment - ${enrollmentData.full_name} (${balance_type})`;
    
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
        'previous_balance',
        student_id,
        transactionRef,
        amountValue,
        enrollmentData.currency,
        transactionDescription,
        transaction_date || new Date(),
        boardingHouseId,
        req.user?.id || 1,
        'posted'
      ]
    );

    const transactionId = transactionResult.insertId;

    // Create journal entries based on balance type
    if (balance_type === 'debit') {
      // Student owes money (debit balance)
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
          transactionId,
          receivableAccount[0].id,
          'debit',
          amountValue,
          `Previous balance (debit) - Debit Accounts Receivable - ${enrollmentData.full_name}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Credit: Revenue Account (increases income)
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
          transactionId,
          revenueAccount[0].id,
          'credit',
          amountValue,
          `Previous balance (debit) - Credit Revenue - ${enrollmentData.full_name}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Update student account balance (decrease balance, making it more negative)
      // If record doesn't exist, assume balance is 0
      await connection.query(
        `INSERT INTO student_account_balances 
         (student_id, enrollment_id, current_balance, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         current_balance = current_balance - ?,
         updated_at = NOW()`,
        [student_id, enrollment_id, -amountValue, amountValue]
      );

      // Update account balances using the service
      const { updateAccountBalance } = require('../services/accountBalanceService');
      await updateAccountBalance(
        receivableAccount[0].id,
        amountValue,
        'debit',
        boardingHouseId,
        connection
      );

      await updateAccountBalance(
        revenueAccount[0].id,
        amountValue,
        'credit',
        boardingHouseId,
        connection
      );

    } else {
      // balance_type === 'credit' - Student has prepaid/credit
      // Credit: Accounts Receivable (reduces receivable, or creates negative receivable)
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
          transactionId,
          receivableAccount[0].id,
          'credit',
          amountValue,
          `Previous balance (credit) - Credit Accounts Receivable - ${enrollmentData.full_name}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Debit: Revenue Account (reduces income, or creates a prepaid expense)
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
          transactionId,
          revenueAccount[0].id,
          'debit',
          amountValue,
          `Previous balance (credit) - Debit Revenue - ${enrollmentData.full_name}`,
          boardingHouseId,
          req.user?.id || 1
        ]
      );

      // Update student account balance (increase balance, making it more positive)
      // If record doesn't exist, assume balance is 0
      await connection.query(
        `INSERT INTO student_account_balances 
         (student_id, enrollment_id, current_balance, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         current_balance = current_balance + ?,
         updated_at = NOW()`,
        [student_id, enrollment_id, amountValue, amountValue]
      );

      // Update account balances using the service
      const { updateAccountBalance } = require('../services/accountBalanceService');
      await updateAccountBalance(
        receivableAccount[0].id,
        amountValue,
        'credit',
        boardingHouseId,
        connection
      );

      await updateAccountBalance(
        revenueAccount[0].id,
        amountValue,
        'debit',
        boardingHouseId,
        connection
      );
    }

    // Create a student invoice record for tracking (even if it's a credit, we record it)
    const invoiceDescription = description || `Previous balance (${balance_type}) - ${enrollmentData.full_name}`;
    await connection.query(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        student_id,
        enrollment_id,
        balance_type === 'debit' ? amountValue : -amountValue, // Negative for credit
        invoiceDescription,
        transaction_date || new Date(),
        transactionRef,
        notes || `Previous balance adjustment: ${balance_type}`,
        'pending',
      ]
    );

    // Get updated balance
    const [balance] = await connection.query(
      'SELECT current_balance FROM student_account_balances WHERE student_id = ? AND enrollment_id = ?',
      [student_id, enrollment_id]
    );

    await connection.commit();

    // Ensure we have a balance value (default to 0 if not found)
    const newBalance = balance && balance.length > 0 ? balance[0].current_balance : 0;

    res.status(201).json({
      success: true,
      message: `Previous balance (${balance_type}) added successfully`,
      data: {
        transaction_id: transactionId,
        amount: amountValue,
        balance_type: balance_type,
        new_balance: newBalance,
        student_name: enrollmentData.full_name,
        student_number: enrollmentData.student_number,
        room_name: enrollmentData.room_name
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding previous balance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  studentLogin,
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
  getEnrollmentHistory,
  recordStudentPayment,
  recordStudentInvoice,
  getStudentInvoices,
  getStudentPayments,
  getStudentInvoicesForDashboard,
  submitLeaseSignature,
  changeStudentPassword,
  addStudentPreviousBalance
};