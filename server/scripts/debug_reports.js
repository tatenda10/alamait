const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugReports() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Debugging reports...');
    
    // Check if students have enrollments
    const [studentsWithEnrollments] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      WHERE s.deleted_at IS NULL AND se.deleted_at IS NULL
    `);
    
    console.log('Students with enrollments:', studentsWithEnrollments[0].count);
    
    // Check enrollment dates
    const [enrollmentDates] = await connection.execute(`
      SELECT 
        MIN(se.start_date) as min_start,
        MAX(se.start_date) as max_start,
        MIN(se.expected_end_date) as min_end,
        MAX(se.expected_end_date) as max_end,
        COUNT(*) as count
      FROM student_enrollments se
      WHERE se.deleted_at IS NULL
    `);
    
    console.log('Enrollment dates:');
    console.table(enrollmentDates);
    
    // Check current date
    const [currentDate] = await connection.execute('SELECT CURDATE() as current_date');
    console.log('Current date:', currentDate[0].current_date);
    
    // Check students with balances and their enrollment status
    const [studentsWithBalances] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        s.status as student_status,
        se.start_date,
        se.expected_end_date,
        sab.current_balance,
        CASE 
          WHEN se.start_date <= CURDATE() THEN 'started'
          ELSE 'not_started'
        END as enrollment_status,
        CASE 
          WHEN se.expected_end_date IS NULL THEN 'no_end_date'
          WHEN se.expected_end_date >= CURDATE() THEN 'active'
          ELSE 'ended'
        END as end_status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL 
        AND se.deleted_at IS NULL 
        AND sab.deleted_at IS NULL
      LIMIT 5
    `);
    
    console.log('Students with balances and enrollment status:');
    console.table(studentsWithBalances);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

debugReports();
