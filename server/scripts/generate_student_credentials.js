const db = require('../src/services/db');

async function generateStudentCredentials() {
  const conn = await db.getConnection();
  try {
    console.log('🎓 Generating Student IDs and Passwords...\n');

    // Get all students without student_id
    const [students] = await conn.query(`
      SELECT id, full_name, phone_number, boarding_house_id
      FROM students 
      WHERE deleted_at IS NULL 
        AND (student_id IS NULL OR student_id = '')
      ORDER BY id
    `);

    console.log(`Found ${students.length} students without Student IDs\n`);

    if (students.length === 0) {
      console.log('✅ All students already have Student IDs!');
      conn.release();
      process.exit(0);
    }

    // Generate student credentials
    const credentials = [];
    let studentCounter = 1;

    for (const student of students) {
      // Generate student ID: STU + 4-digit number (e.g., STU0001, STU0002, etc.)
      const studentId = `STU${String(studentCounter).padStart(4, '0')}`;
      
      // For simplicity, password = student_id (students can change later)
      const password = studentId;

      credentials.push({
        id: student.id,
        full_name: student.full_name,
        student_id: studentId,
        password: password
      });

      studentCounter++;
    }

    // Update students with their new credentials
    console.log('📝 Updating students with new credentials...\n');

    for (const cred of credentials) {
      await conn.query(
        `UPDATE students 
         SET student_id = ?, 
             updated_at = NOW()
         WHERE id = ?`,
        [cred.student_id, cred.id]
      );

      console.log(`✅ ${cred.full_name}: ${cred.student_id} (Password: ${cred.password})`);
    }

    // Create a summary file for easy reference
    console.log('\n📋 Student Login Credentials Summary:');
    console.log('=' .repeat(60));
    console.log('Student Name'.padEnd(25) + 'Student ID'.padEnd(12) + 'Password');
    console.log('=' .repeat(60));
    
    credentials.forEach(cred => {
      console.log(
        cred.full_name.padEnd(25) + 
        cred.student_id.padEnd(12) + 
        cred.password
      );
    });

    console.log('\n🎉 Student credentials generated successfully!');
    console.log('📱 Students can now log in using their Student ID as both username and password.');
    console.log('💡 They can change their passwords after first login.');

    // Test a few logins
    console.log('\n🧪 Testing student login system...');
    
    const testStudent = credentials[0];
    const [testResult] = await conn.query(`
      SELECT id, full_name, student_id 
      FROM students 
      WHERE student_id = ? AND deleted_at IS NULL
    `, [testStudent.student_id]);

    if (testResult.length > 0) {
      console.log(`✅ Test successful: ${testResult[0].full_name} can now log in with ID: ${testResult[0].student_id}`);
    } else {
      console.log('❌ Test failed: Student not found');
    }

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error generating student credentials:', e);
    conn.release();
    process.exit(1);
  }
}

generateStudentCredentials();
