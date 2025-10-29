require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkBalances() {
  console.log('🔍 Checking Student Account Balances Details...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check structure of student_account_balances
    const [structure] = await connection.execute(`DESCRIBE student_account_balances`);
    console.log('📋 Table Structure:');
    console.table(structure);

    // Get all positive balances with enrollment info
    console.log('\n💰 All Positive Balances (Prepayments):');
    const [prepayments] = await connection.execute(`
      SELECT 
        sab.student_id,
        sab.enrollment_id,
        s.full_name,
        s.status as student_status,
        se.expected_end_date,
        CASE 
          WHEN se.id IS NULL THEN 'No Enrollment'
          WHEN se.expected_end_date IS NOT NULL AND se.expected_end_date < CURRENT_DATE THEN 'Expired Enrollment'
          ELSE 'Active Enrollment'
        END as enrollment_status,
        sab.current_balance
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      LEFT JOIN student_enrollments se ON sab.enrollment_id = se.id AND se.deleted_at IS NULL
      WHERE sab.current_balance > 0 
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.table(prepayments);
    console.log(`\nTotal records: ${prepayments.length}`);

    // Get totals by enrollment status
    const activeTotal = prepayments
      .filter(p => p.enrollment_status === 'Active Enrollment')
      .reduce((sum, p) => sum + parseFloat(p.current_balance), 0);
    
    const expiredTotal = prepayments
      .filter(p => p.enrollment_status === 'Expired Enrollment')
      .reduce((sum, p) => sum + parseFloat(p.current_balance), 0);
    
    const noEnrollmentTotal = prepayments
      .filter(p => p.enrollment_status === 'No Enrollment')
      .reduce((sum, p) => sum + parseFloat(p.current_balance), 0);

    console.log('\n📊 Totals by Enrollment Status:');
    console.log(`Active Enrollments: $${activeTotal.toFixed(2)} (${prepayments.filter(p => p.enrollment_status === 'Active Enrollment').length} students)`);
    console.log(`Expired Enrollments: $${expiredTotal.toFixed(2)} (${prepayments.filter(p => p.enrollment_status === 'Expired Enrollment').length} students)`);
    console.log(`No Enrollment: $${noEnrollmentTotal.toFixed(2)} (${prepayments.filter(p => p.enrollment_status === 'No Enrollment').length} students)`);
    console.log(`\nGrand Total: $${(activeTotal + expiredTotal + noEnrollmentTotal).toFixed(2)}`);

    // Now check what the creditors report query returns
    console.log('\n\n🔍 What Creditors Report Query Returns:');
    const [creditorsReport] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        se.expected_end_date,
        r.name as room_number,
        bh.name as boarding_house_name,
        s.status as student_status,
        sab.current_balance
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.table(creditorsReport);
    const creditorsTotal = creditorsReport.reduce((sum, c) => sum + parseFloat(c.current_balance), 0);
    console.log(`\nCreditors Report Total: $${creditorsTotal.toFixed(2)} (${creditorsReport.length} students)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkBalances();
