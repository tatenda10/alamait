require('dotenv').config();
const mysql = require('mysql2/promise');

async function removeDuplicates() {
  console.log('🔍 Removing duplicate student records in EXT1...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // First, let's see all the duplicate records for Chantelle Gora
    console.log('📋 CHANTELLE GORA - Current Records:');
    const [chantelleRecords] = await connection.execute(`
      SELECT 
        sab.id as balance_id,
        s.id as student_id,
        s.full_name,
        se.id as enrollment_id,
        r.name as room,
        sab.current_balance,
        sab.created_at,
        sab.deleted_at
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name = 'Chantelle Gora'
        AND s.deleted_at IS NULL
        AND r.name = 'EXT1'
      ORDER BY sab.current_balance ASC, sab.created_at DESC
    `);
    console.table(chantelleRecords);

    // Keep the one with negative balance (the debtor), delete the zero balance
    if (chantelleRecords.length > 1) {
      const recordsToDelete = chantelleRecords.filter(r => r.current_balance >= 0);
      for (const record of recordsToDelete) {
        if (record.balance_id) {
          await connection.execute(
            'UPDATE student_account_balances SET deleted_at = NOW() WHERE id = ?',
            [record.balance_id]
          );
          console.log(`✓ Deleted Chantelle Gora balance record ${record.balance_id} with balance $${record.current_balance}`);
        }
      }
    }

    // Now for Dion sengamai
    console.log('\n📋 DION SENGAMAI - Current Records:');
    const [dionRecords] = await connection.execute(`
      SELECT 
        sab.id as balance_id,
        s.id as student_id,
        s.full_name,
        se.id as enrollment_id,
        r.name as room,
        sab.current_balance,
        sab.created_at,
        sab.deleted_at
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name = 'Dion sengamai'
        AND s.deleted_at IS NULL
        AND r.name = 'EXT1'
      ORDER BY sab.current_balance ASC, sab.created_at DESC
    `);
    console.table(dionRecords);

    // Keep the one with negative balance (the debtor), delete the zero balance
    if (dionRecords.length > 1) {
      const recordsToDelete = dionRecords.filter(r => r.current_balance >= 0);
      for (const record of recordsToDelete) {
        if (record.balance_id) {
          await connection.execute(
            'UPDATE student_account_balances SET deleted_at = NOW() WHERE id = ?',
            [record.balance_id]
          );
          console.log(`✓ Deleted Dion sengamai balance record ${record.balance_id} with balance $${record.current_balance}`);
        }
      }
    }

    await connection.commit();

    // Verify the cleanup
    console.log('\n✅ VERIFICATION - EXT1 Students After Cleanup:');
    const [finalCheck] = await connection.execute(`
      SELECT 
        s.full_name,
        r.name as room,
        sab.current_balance as balance
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND sab.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND r.name = 'EXT1'
      ORDER BY s.full_name
    `);
    console.table(finalCheck);

    console.log(`\n✅ Total students in EXT1: ${finalCheck.length}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

removeDuplicates();


