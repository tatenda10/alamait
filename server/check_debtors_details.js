require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDebtorsDetails() {
  console.log('💰 Checking Debtors Details...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get ALL negative balances (students who owe)
    console.log('📋 ALL Negative Balances (from student_account_balances):');
    const [allDebtors] = await connection.execute(`
      SELECT 
        sab.student_id,
        sab.enrollment_id,
        s.full_name,
        s.status as student_status,
        ABS(sab.current_balance) as amount_owed,
        sab.current_balance as raw_balance,
        CASE 
          WHEN se.id IS NULL THEN 'No Active Enrollment'
          WHEN se.room_id IS NULL THEN 'No Room Assigned'
          WHEN se.deleted_at IS NOT NULL THEN 'Enrollment Deleted'
          ELSE 'Active Enrollment'
        END as enrollment_status
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      LEFT JOIN student_enrollments se ON sab.enrollment_id = se.id AND se.deleted_at IS NULL
      WHERE sab.current_balance < 0 
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance ASC
    `);

    console.table(allDebtors);
    const allDebtorsTotal = allDebtors.reduce((sum, d) => sum + parseFloat(d.amount_owed), 0);
    console.log(`\nTotal ALL Debtors: $${allDebtorsTotal.toFixed(2)} (${allDebtors.length} records)\n`);

    // Check if there's a student owing exactly $540
    const owing540 = allDebtors.filter(d => Math.abs(parseFloat(d.amount_owed) - 540) < 0.01);
    if (owing540.length > 0) {
      console.log('🔍 Students owing $540:');
      console.table(owing540);
    } else {
      console.log('❌ No student owes exactly $540\n');
    }

    // Get debtors with ACTIVE enrollments (what SHOULD be in report)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Debtors with ACTIVE Enrollments (Correct for Report):');
    const [activeDebtors] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.full_name,
        se.id as enrollment_id,
        r.name as room_name,
        bh.name as boarding_house,
        ABS(sab.current_balance) as amount_owed,
        sab.current_balance as raw_balance
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance ASC
    `);

    console.table(activeDebtors);
    const activeDebtorsTotal = activeDebtors.reduce((sum, d) => sum + parseFloat(d.amount_owed), 0);
    console.log(`\n✅ Total Active Debtors: $${activeDebtorsTotal.toFixed(2)} (${activeDebtors.length} students)`);
    
    console.log(`\n📊 Difference: $${(allDebtorsTotal - activeDebtorsTotal).toFixed(2)} (${allDebtors.length - activeDebtors.length} students without active enrollments)`);

    // Show debtors NOT in active list
    const notActive = allDebtors.filter(d => d.enrollment_status !== 'Active Enrollment');
    if (notActive.length > 0) {
      console.log('\n❌ Debtors NOT in Report:');
      console.table(notActive);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDebtorsDetails();
