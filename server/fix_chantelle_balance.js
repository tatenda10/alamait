require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixChantelleBalance() {
  console.log('🔧 Fixing Chantelle Gora balance...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Find Chantelle Gora
    const [chantelle] = await connection.execute(`
      SELECT s.id, s.full_name, sab.current_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Chantelle%Gora%'
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      LIMIT 1
    `);

    if (chantelle.length > 0) {
      console.log(`Found: ${chantelle[0].full_name}`);
      console.log(`Current balance: $${chantelle[0].current_balance}`);
      console.log(`Target balance: -$35.00\n`);

      // Update to -35
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = -35,
            updated_at = NOW()
        WHERE student_id = ?
      `, [chantelle[0].id]);

      console.log('✅ Chantelle Gora balance updated to -$35.00');
    } else {
      console.log('⚠️ Chantelle Gora not found');
    }

    await connection.commit();

    // Calculate new totals
    const [totals] = await connection.execute(`
      SELECT 
        COUNT(*) as total_debtors,
        SUM(ABS(sab.current_balance)) as total_debt
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND sab.current_balance < 0
    `);

    console.log('\n📊 Updated Totals:');
    console.log(`  Total Debtors: ${totals[0].total_debtors}`);
    console.log(`  Total Debt: $${parseFloat(totals[0].total_debt || 0).toFixed(2)}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixChantelleBalance();

