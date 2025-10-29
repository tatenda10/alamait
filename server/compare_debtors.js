require('dotenv').config();
const mysql = require('mysql2/promise');

async function compareDebtors() {
  console.log('🔍 Comparing Debtors (students who owe money)...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Your Excel list (debtors only - negative balances, stored as positive values in your list)
    const excelDebtors = {
      'Bertha Majoni': -10,
      'Chantelle Gora': -33,
      'Dion sengamai': -80,
      'Emma Yoradin': -20,
      'Fadzai Mhizha': -61,
      'Kudzai Pemhiwa': -240,
      'Leona Dengu': -20,
      'Ropafadzo Masara': -30,
      'Rumbidzai Manyaora': -2,
      'Shalom Gora': -35
    };

    // Get current database debtors (students with negative balances)
    const [dbDebtors] = await connection.execute(`
      SELECT 
        s.full_name,
        sab.current_balance,
        r.name as room_name
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND sab.current_balance < 0
      ORDER BY sab.current_balance ASC
    `);

    console.log('=' .repeat(80));
    console.log('\n📊 DEBTORS COMPARISON RESULTS:\n');
    
    // Create a map of database debtors
    const dbMap = {};
    dbDebtors.forEach(row => {
      dbMap[row.full_name] = parseFloat(row.current_balance);
    });

    // Find differences
    let matched = 0;
    let mismatched = 0;
    let missingInDb = 0;
    let extraInDb = 0;

    // Check Excel list against DB
    console.log('🔍 Checking Excel list against Database:\n');
    for (const [name, balance] of Object.entries(excelDebtors)) {
      const dbBalance = dbMap[name];
      if (dbBalance === undefined) {
        console.log(`❌ MISSING IN DB: ${name} should owe $${Math.abs(balance)}`);
        missingInDb++;
      } else if (Math.abs(dbBalance - balance) > 0.01) {
        console.log(`⚠️  MISMATCH: ${name}`);
        console.log(`   Excel: -$${Math.abs(balance)} | DB: -$${Math.abs(dbBalance)}`);
        mismatched++;
      } else {
        console.log(`✅ MATCHED: ${name} = -$${Math.abs(balance)}`);
        matched++;
      }
    }

    // Check for extras in DB
    console.log('\n🔍 Checking for extra debtors in Database:\n');
    for (const [name, balance] of Object.entries(dbMap)) {
      if (excelDebtors[name] === undefined) {
        console.log(`➕ EXTRA IN DB: ${name} = -$${Math.abs(balance)} (not in Excel list)`);
        extraInDb++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 SUMMARY:');
    console.log(`✅ Matched: ${matched}`);
    console.log(`⚠️  Mismatched amounts: ${mismatched}`);
    console.log(`❌ Missing in DB: ${missingInDb}`);
    console.log(`➕ Extra in DB: ${extraInDb}`);
    console.log(`\n📊 Total in Excel: ${Object.keys(excelDebtors).length}`);
    console.log(`📊 Total in DB: ${dbDebtors.length}`);

    // Calculate totals
    const excelTotal = Object.values(excelDebtors).reduce((sum, val) => sum + Math.abs(val), 0);
    const dbTotal = dbDebtors.reduce((sum, row) => sum + Math.abs(parseFloat(row.current_balance)), 0);
    
    console.log(`\n💰 Excel Total Debt: $${excelTotal.toFixed(2)}`);
    console.log(`💰 DB Total Debt: $${dbTotal.toFixed(2)}`);
    console.log(`💰 Difference: $${Math.abs(dbTotal - excelTotal).toFixed(2)}`);

    // List all DB debtors for reference
    if (dbDebtors.length > 0) {
      console.log('\n\n📋 ALL DEBTORS IN DATABASE:');
      console.log('='.repeat(80));
      dbDebtors.forEach((debtor, index) => {
        console.log(`${index + 1}. ${debtor.full_name} (${debtor.room_name || 'No Room'}) = -$${Math.abs(debtor.current_balance)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

compareDebtors();

