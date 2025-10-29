require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixTawanaAndShelter() {
  console.log('🔧 Fixing Tawana Kuwana and Shelter Masosonere balances...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Fix Tawana Kuwana to $180
    console.log('Updating Tawana Kuwana...');
    const [tawana] = await connection.execute(`
      SELECT s.id, s.full_name, sab.current_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Tawana%Kuwana%'
        AND s.deleted_at IS NULL
      LIMIT 1
    `);

    if (tawana.length > 0) {
      console.log(`  Current: ${tawana[0].full_name} = $${tawana[0].current_balance}`);
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = 180,
            updated_at = NOW()
        WHERE student_id = ?
      `, [tawana[0].id]);
      console.log(`  ✅ Updated to $180.00\n`);
    } else {
      console.log('  ⚠️ Tawana Kuwana not found\n');
    }

    // Fix Shelter Masosonere to $0
    console.log('Updating Shelter Masosonere...');
    const [shelter] = await connection.execute(`
      SELECT s.id, s.full_name, sab.current_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Shelter%Masosonere%'
        AND s.deleted_at IS NULL
      LIMIT 1
    `);

    if (shelter.length > 0) {
      console.log(`  Current: ${shelter[0].full_name} = $${shelter[0].current_balance}`);
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = 0,
            updated_at = NOW()
        WHERE student_id = ?
      `, [shelter[0].id]);
      console.log(`  ✅ Updated to $0.00\n`);
    } else {
      console.log('  ⚠️ Shelter Masosonere not found\n');
    }

    await connection.commit();

    // Calculate new totals
    const [totals] = await connection.execute(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN sab.current_balance > 0 THEN sab.current_balance ELSE 0 END) as total_prepayments,
        SUM(CASE WHEN sab.current_balance < 0 THEN ABS(sab.current_balance) ELSE 0 END) as total_debtors,
        SUM(sab.current_balance) as net_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND sab.current_balance != 0
    `);

    console.log('📊 Updated Totals (Active Students with Non-Zero Balances):');
    console.log(`  Students with balances: ${totals[0].total_students}`);
    console.log(`  Prepayments: $${parseFloat(totals[0].total_prepayments || 0).toFixed(2)}`);
    console.log(`  Debtors: $${parseFloat(totals[0].total_debtors || 0).toFixed(2)}`);
    console.log(`  Net Balance: $${parseFloat(totals[0].net_balance || 0).toFixed(2)}`);

    console.log('\n✅ All updates completed successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixTawanaAndShelter();

