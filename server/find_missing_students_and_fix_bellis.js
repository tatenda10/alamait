require('dotenv').config();
const mysql = require('mysql2/promise');

async function findMissingAndFixBellis() {
  console.log('🔍 Finding missing students and fixing Bellis balance...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Find Lilian Chatikobo
    console.log('Searching for: Lilian Chatikobo');
    const [lilian] = await connection.execute(`
      SELECT id, student_id, full_name, status, deleted_at
      FROM students
      WHERE full_name LIKE '%Lilian%' OR full_name LIKE '%Chatikobo%'
    `);
    console.log('Results:', lilian.length > 0 ? lilian : 'NOT FOUND');
    console.log('');

    // Find Ravimbo Singe
    console.log('Searching for: Ravimbo Singe');
    const [ravimbo] = await connection.execute(`
      SELECT id, student_id, full_name, status, deleted_at
      FROM students
      WHERE full_name LIKE '%Ravimbo%' OR full_name LIKE '%Singe%'
    `);
    console.log('Results:', ravimbo.length > 0 ? ravimbo : 'NOT FOUND');
    console.log('');

    // Find Shantell Mavarira
    console.log('Searching for: Shantell Mavarira');
    const [shantell] = await connection.execute(`
      SELECT id, student_id, full_name, status, deleted_at
      FROM students
      WHERE full_name LIKE '%Shantell%' OR full_name LIKE '%Mavarira%'
    `);
    console.log('Results:', shantell.length > 0 ? shantell : 'NOT FOUND');
    console.log('');

    // Get total active students count
    console.log('Checking total active students...');
    const [activeCount] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM students
      WHERE deleted_at IS NULL
        AND (status = 'Active' OR status IS NULL)
    `);
    console.log(`Total Active Students: ${activeCount[0].total}`);
    console.log('');

    // Fix Bellis balance to 180
    console.log('Updating Bellis Mapetere balance to $180...');
    const [bellis] = await connection.execute(`
      SELECT s.id, s.full_name
      FROM students s
      WHERE s.full_name LIKE '%Bellis%Mapetere%'
        AND s.deleted_at IS NULL
      LIMIT 1
    `);

    if (bellis.length > 0) {
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = 180,
            updated_at = NOW()
        WHERE student_id = ?
      `, [bellis[0].id]);
      console.log(`✅ Bellis Mapetere balance updated to $180.00`);
    } else {
      console.log('⚠️ Bellis Mapetere not found');
    }

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

    console.log('\n📊 Updated Totals (Active Students with Non-Zero Balances):');
    console.log(`  Students with balances: ${totals[0].total_students}`);
    console.log(`  Prepayments: $${parseFloat(totals[0].total_prepayments || 0).toFixed(2)}`);
    console.log(`  Debtors: $${parseFloat(totals[0].total_debtors || 0).toFixed(2)}`);
    console.log(`  Net Balance: $${parseFloat(totals[0].net_balance || 0).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

findMissingAndFixBellis();

