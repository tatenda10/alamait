require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkStudentPrepayments() {
  console.log('🔍 Checking Student Prepayments Calculation...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get all student balances
    console.log('📊 All Student Balances:');
    const [all] = await connection.execute(`
      SELECT 
        s.full_name,
        sab.current_balance
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      WHERE s.deleted_at IS NULL
      ORDER BY sab.current_balance
    `);
    console.table(all);

    // Get debtors (negative balances = students who owe)
    console.log('\n💰 Debtors (Students who OWE us - NEGATIVE balances):');
    const [debtors] = await connection.execute(`
      SELECT 
        COUNT(*) as count, 
        SUM(ABS(current_balance)) as total
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      WHERE sab.current_balance < 0 AND s.deleted_at IS NULL
    `);
    console.table(debtors);

    // Get prepayments (positive balances = students who overpaid)
    console.log('\n✅ Prepayments (Students who OVERPAID - POSITIVE balances):');
    const [prepayments] = await connection.execute(`
      SELECT 
        COUNT(*) as count, 
        SUM(current_balance) as total
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      WHERE sab.current_balance > 0 AND s.deleted_at IS NULL
    `);
    console.table(prepayments);

    // Show students with positive balances
    console.log('\n👥 Students with Prepayments (Positive Balances):');
    const [prepaymentsList] = await connection.execute(`
      SELECT 
        s.full_name,
        sab.current_balance as prepayment_amount
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      WHERE sab.current_balance > 0 AND s.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);
    console.table(prepaymentsList);

    console.log('\n📝 Summary:');
    console.log(`Total Debtors: $${debtors[0].total} (${debtors[0].count} students)`);
    console.log(`Total Prepayments: $${prepayments[0].total} (${prepayments[0].count} students)`);
    console.log(`Net Balance: $${parseFloat(prepayments[0].total) - parseFloat(debtors[0].total)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStudentPrepayments();
