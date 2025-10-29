require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPrepaymentsAfterFix() {
  console.log('💰 Checking Prepayments After Duplicate Removal...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check what the creditors report returns now
    console.log('🔍 Creditors Report Query (Active Enrollments with Rooms):');
    const [creditorsReport] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        r.name as room_number,
        bh.name as boarding_house_name,
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
    console.log(`\n✅ Creditors Report Total: $${creditorsTotal.toFixed(2)} (${creditorsReport.length} students)`);

    // Check total of ALL positive balances (including non-enrolled)
    console.log('\n\n🔍 All Positive Balances (Including Non-Active Enrollments):');
    const [allPositive] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name,
        sab.enrollment_id,
        sab.current_balance,
        CASE 
          WHEN se.id IS NULL THEN 'No Active Enrollment'
          WHEN se.room_id IS NULL THEN 'No Room Assigned'
          WHEN se.deleted_at IS NOT NULL THEN 'Enrollment Deleted'
          ELSE 'Should Be In Report'
        END as status
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      LEFT JOIN student_enrollments se ON sab.enrollment_id = se.id AND se.deleted_at IS NULL
      WHERE sab.current_balance > 0 
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.table(allPositive);
    const allTotal = allPositive.reduce((sum, p) => sum + parseFloat(p.current_balance), 0);
    console.log(`\n📊 Total All Positive Balances: $${allTotal.toFixed(2)} (${allPositive.length} records)`);
    console.log(`📊 Difference: $${(allTotal - creditorsTotal).toFixed(2)} (${allPositive.length - creditorsReport.length} records not in report)`);

    // Show breakdown
    const notInReport = allPositive.filter(p => p.status !== 'Should Be In Report');
    console.log('\n❌ Positive Balances NOT in Report:');
    console.table(notInReport);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPrepaymentsAfterFix();
