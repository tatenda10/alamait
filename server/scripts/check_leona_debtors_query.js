const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function checkLeonaDebtorsQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking why Leona Dengu is not in debtors query...\n');

    // First, check Leona's records
    const [leona] = await connection.query(
      `SELECT 
        s.id as student_id,
        s.full_name,
        s.status as student_status,
        s.deleted_at as student_deleted,
        se.id as enrollment_id,
        se.checkout_date,
        se.deleted_at as enrollment_deleted,
        sab.id as balance_id,
        sab.current_balance,
        sab.deleted_at as balance_deleted
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.full_name LIKE '%Leona%Dengu%'
        OR s.full_name LIKE '%Dengu%Leona%'
        OR s.full_name LIKE '%Leona%'
      ORDER BY se.created_at DESC`,
      []
    );

    if (leona.length === 0) {
      console.log('❌ Leona not found');
      return;
    }

    console.log('📋 Leona\'s Records:');
    leona.forEach((record, idx) => {
      console.log(`\nRecord ${idx + 1}:`);
      console.log(`  Student ID: ${record.student_id}`);
      console.log(`  Full Name: ${record.full_name}`);
      console.log(`  Student Status: ${record.student_status}`);
      console.log(`  Student Deleted: ${record.student_deleted || 'No'}`);
      console.log(`  Enrollment ID: ${record.enrollment_id || 'None'}`);
      console.log(`  Checkout Date: ${record.checkout_date || 'Not checked out'}`);
      console.log(`  Enrollment Deleted: ${record.enrollment_deleted || 'No'}`);
      console.log(`  Balance ID: ${record.balance_id || 'None'}`);
      console.log(`  Current Balance: ${record.current_balance !== null ? record.current_balance : 'No balance'}`);
      console.log(`  Balance Deleted: ${record.balance_deleted || 'No'}`);
    });

    // Now test the exact query from the debtors report
    console.log('\n\n🔍 Testing Debtors Query for Leona...\n');
    
    const [debtorsQuery] = await connection.query(
      `SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        se.admin_fee,
        se.security_deposit,
        se.start_date as enrollment_start,
        se.expected_end_date as enrollment_end,
        se.checkout_date,
        r.name as room_number,
        bh.name as boarding_house_name,
        s.status as student_status,
        sab.current_balance,
        sab.updated_at as last_balance_update
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
        AND s.full_name LIKE '%Leona%'`,
      []
    );

    console.log(`Found ${debtorsQuery.length} records in debtors query for Leona:`);
    debtorsQuery.forEach((d, idx) => {
      console.log(`  ${idx + 1}. ${d.student_name} - Balance: ${d.current_balance}, Checkout: ${d.checkout_date || 'Not checked out'}`);
    });

    // Check if enrollment is soft-deleted
    if (leona[0].enrollment_deleted) {
      console.log('\n⚠️  ISSUE FOUND: Leona\'s enrollment is soft-deleted!');
      console.log(`   Enrollment deleted_at: ${leona[0].enrollment_deleted}`);
      console.log('   The query filters out soft-deleted enrollments with: se.deleted_at IS NULL');
    }

    // Check if balance is soft-deleted
    if (leona[0].balance_deleted) {
      console.log('\n⚠️  ISSUE FOUND: Leona\'s balance record is soft-deleted!');
      console.log(`   Balance deleted_at: ${leona[0].balance_deleted}`);
      console.log('   The query filters out soft-deleted balances with: sab.deleted_at IS NULL');
    }

    // Check enrollment_id mismatch
    if (leona[0].enrollment_id && leona[0].balance_id) {
      const [balanceCheck] = await connection.query(
        `SELECT enrollment_id FROM student_account_balances 
         WHERE id = ?`,
        [leona[0].balance_id]
      );
      if (balanceCheck.length > 0 && balanceCheck[0].enrollment_id !== leona[0].enrollment_id) {
        console.log('\n⚠️  ISSUE FOUND: Enrollment ID mismatch!');
        console.log(`   Enrollment ID in enrollment: ${leona[0].enrollment_id}`);
        console.log(`   Enrollment ID in balance: ${balanceCheck[0].enrollment_id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkLeonaDebtorsQuery()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

