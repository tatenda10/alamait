const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function fixGraciousBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    console.log('🔍 Finding Gracious...\n');

    // Find the student
    const [students] = await connection.query(
      `SELECT s.id, s.full_name, se.id as enrollment_id, 
              sab.current_balance, se.agreed_amount, se.admin_fee
       FROM students s
       JOIN student_enrollments se ON s.id = se.student_id
       LEFT JOIN student_account_balances sab ON s.id = sab.student_id 
         AND se.id = sab.enrollment_id
       WHERE s.full_name LIKE '%Gracious%'
         AND s.deleted_at IS NULL
         AND se.deleted_at IS NULL
       ORDER BY se.created_at DESC
       LIMIT 5`,
      []
    );

    if (students.length === 0) {
      console.log('❌ Student not found');
      await connection.rollback();
      return;
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.full_name} (ID: ${student.id})`);
    console.log(`📊 Current balance: ${student.current_balance || 0}`);
    console.log(`💰 Agreed amount (rent): ${student.agreed_amount || 0}`);
    console.log(`💵 Admin fee: ${student.admin_fee || 0}\n`);

    const targetBalance = -160.00;
    const currentBalance = parseFloat(student.current_balance || 0);

    if (Math.abs(currentBalance - targetBalance) < 0.01) {
      console.log('✅ Balance is already correct!');
      await connection.rollback();
      return;
    }

    console.log(`🔧 Updating balance from ${currentBalance} to ${targetBalance}\n`);

    // Update or create student account balance
    if (student.enrollment_id) {
      const [existingBalance] = await connection.query(
        `SELECT id FROM student_account_balances 
         WHERE student_id = ? AND enrollment_id = ?`,
        [student.id, student.enrollment_id]
      );

      if (existingBalance.length > 0) {
        await connection.query(
          `UPDATE student_account_balances 
           SET current_balance = ?,
               updated_at = NOW()
           WHERE student_id = ? AND enrollment_id = ?`,
          [targetBalance, student.id, student.enrollment_id]
        );
        console.log(`✅ Updated student account balance to ${targetBalance}`);
      } else {
        await connection.query(
          `INSERT INTO student_account_balances 
           (student_id, enrollment_id, current_balance, currency, created_at, updated_at)
           VALUES (?, ?, ?, 'USD', NOW(), NOW())`,
          [student.id, student.enrollment_id, targetBalance]
        );
        console.log(`✅ Created student account balance: ${targetBalance}`);
      }
    } else {
      console.log('❌ No enrollment found');
      await connection.rollback();
      return;
    }

    await connection.commit();
    console.log('\n✅ Successfully fixed Gracious\'s balance!');
    console.log(`   New balance: ${targetBalance}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixGraciousBalance()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

