require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugPrepayments() {
  console.log('🔍 Debugging Prepayments Query...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Step 1: Check all students with balances
    console.log('1️⃣ All students with balances > 0:\n');
    const [allBalances] = await connection.execute(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        sab.current_balance,
        sab.deleted_at as balance_deleted
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE sab.current_balance > 0
        AND s.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.log(`Found ${allBalances.length} students with positive balances:`);
    allBalances.forEach(s => {
      console.log(`  ${s.full_name}: $${s.current_balance} (Balance Deleted: ${s.balance_deleted || 'No'})`);
    });

    // Step 2: Check with enrollments
    console.log('\n2️⃣ Students with balances AND active enrollments:\n');
    const [withEnrollments] = await connection.execute(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        sab.current_balance,
        se.deleted_at as enrollment_deleted,
        se.id as enrollment_id
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      WHERE sab.current_balance > 0
        AND s.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.log(`Found ${withEnrollments.length} students:`);
    withEnrollments.forEach(s => {
      console.log(`  ${s.full_name}: $${s.current_balance} (Enrollment: ${s.enrollment_id || 'NONE'}, Deleted: ${s.enrollment_deleted || 'No'})`);
    });

    // Step 3: Full query with all conditions
    console.log('\n3️⃣ Full prepayments query (with all conditions):\n');
    const [fullQuery] = await connection.execute(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        sab.current_balance,
        sab.enrollment_id as sab_enrollment_id,
        se.id as se_enrollment_id,
        r.name as room_name,
        bh.name as boarding_house,
        s.status,
        se.expected_end_date,
        se.deleted_at as enrollment_deleted,
        sab.deleted_at as balance_deleted
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND sab.enrollment_id = se.id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE sab.current_balance > 0
        AND s.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.log(`Found ${fullQuery.length} students:`);
    fullQuery.forEach(s => {
      console.log(`\n  ${s.full_name}:`);
      console.log(`    Balance: $${s.current_balance}`);
      console.log(`    SAB Enrollment ID: ${s.sab_enrollment_id}`);
      console.log(`    SE Enrollment ID: ${s.se_enrollment_id || 'NONE'}`);
      console.log(`    Room: ${s.room_name || 'NONE'}`);
      console.log(`    Boarding House: ${s.boarding_house || 'NONE'}`);
      console.log(`    Status: ${s.status || 'NULL'}`);
      console.log(`    End Date: ${s.expected_end_date || 'NULL'}`);
      console.log(`    Enrollment Deleted: ${s.enrollment_deleted || 'No'}`);
      console.log(`    Balance Deleted: ${s.balance_deleted || 'No'}`);
    });

    // Step 4: Check the actual query used in the export
    console.log('\n4️⃣ Actual export query:\n');
    const [exportQuery] = await connection.execute(`
      SELECT 
        s.id as student_db_id,
        s.student_id,
        s.full_name as student_name,
        bh.name as boarding_house,
        r.name as room_name,
        sab.current_balance as credit_balance,
        sab.currency,
        sab.updated_at as last_updated,
        s.status
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
      ORDER BY sab.current_balance DESC, s.full_name
    `);

    console.log(`Export query returned: ${exportQuery.length} records`);
    if (exportQuery.length > 0) {
      console.log('\nSample records:');
      exportQuery.slice(0, 5).forEach(s => {
        console.log(`  ${s.student_name}: $${s.credit_balance} (${s.room_name}, ${s.boarding_house})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugPrepayments().catch(console.error);

