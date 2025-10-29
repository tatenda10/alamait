require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixMunasheAndCompare() {
  console.log('🔧 Fixing Munashe balance and comparing lists...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Fix Munashe balance to 0
    console.log('Step 1: Fixing Munashe balance to $0...');
    const [munashe] = await connection.execute(`
      SELECT s.id, s.full_name
      FROM students s
      WHERE s.full_name LIKE '%Munashe%'
        AND s.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
      LIMIT 1
    `);

    if (munashe.length > 0) {
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = 0,
            updated_at = NOW()
        WHERE student_id = ?
      `, [munashe[0].id]);
      console.log(`✅ ${munashe[0].full_name} balance updated to $0.00\n`);
    }

    await connection.commit();

    // Your Excel list (prepayments only - positive balances)
    const excelPrepayments = {
      'Paidamoyo Munyimi': 320,
      'Vannessa Magorimbo': 5,
      'Kimbely Bones': 35,
      'Tinotenda Chidavaenzi': 20,
      'Pelagia Gomakalila': 190,
      'Sandra Chirinda': 280,
      'Precious Dziva': 133,
      'Takudzwa Makunde': 180,
      'Tatenda Kamatando': 40,
      'Anita Gwenda': 160,
      'Farai Muzembe': 40,
      'Grace Vutika': 460,
      'Thelma Nzvimari': 80,
      'Natasha Chinho': 180,
      'Bellis Mapetere': 180,
      'Tadiwa Mhloro': 100,
      'Salina Saidi': 20,
      'Tinotenda Bwangangwanyo': 10,
      'Tinotenda Magiga': 5,
      'Rachel Madembe': 540,
      'Sharon Matanha': 98,
      'Merrylin Makunzva': 30,
      'Trypheane Chinembiri': 80,
      'Shantel Mashe': 98,
      'Tawana Kuwana': 180,
      'Fay Mubaiwa': 35
    };

    // Get current database prepayments
    const [dbPrepayments] = await connection.execute(`
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
        AND sab.current_balance > 0
      ORDER BY s.full_name
    `);

    console.log('Step 2: Comparing Excel list vs Database prepayments...\n');
    console.log('=' .repeat(80));
    
    // Create a map of database prepayments
    const dbMap = {};
    dbPrepayments.forEach(row => {
      dbMap[row.full_name] = parseFloat(row.current_balance);
    });

    // Find differences
    let matched = 0;
    let mismatched = 0;
    let missingInDb = 0;
    let extraInDb = 0;

    console.log('\n📊 COMPARISON RESULTS:\n');
    
    // Check Excel list against DB
    console.log('🔍 Checking Excel list against Database:\n');
    for (const [name, balance] of Object.entries(excelPrepayments)) {
      const dbBalance = dbMap[name];
      if (dbBalance === undefined) {
        console.log(`❌ MISSING IN DB: ${name} should have $${balance}`);
        missingInDb++;
      } else if (Math.abs(dbBalance - balance) > 0.01) {
        console.log(`⚠️  MISMATCH: ${name}`);
        console.log(`   Excel: $${balance} | DB: $${dbBalance}`);
        mismatched++;
      } else {
        matched++;
      }
    }

    // Check for extras in DB
    console.log('\n🔍 Checking for extra entries in Database:\n');
    for (const [name, balance] of Object.entries(dbMap)) {
      if (excelPrepayments[name] === undefined) {
        console.log(`➕ EXTRA IN DB: ${name} = $${balance} (not in Excel list)`);
        extraInDb++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 SUMMARY:');
    console.log(`✅ Matched: ${matched}`);
    console.log(`⚠️  Mismatched amounts: ${mismatched}`);
    console.log(`❌ Missing in DB: ${missingInDb}`);
    console.log(`➕ Extra in DB: ${extraInDb}`);
    console.log(`\n📊 Total in Excel: ${Object.keys(excelPrepayments).length}`);
    console.log(`📊 Total in DB: ${dbPrepayments.length}`);

    // Calculate totals
    const excelTotal = Object.values(excelPrepayments).reduce((sum, val) => sum + val, 0);
    const dbTotal = dbPrepayments.reduce((sum, row) => sum + parseFloat(row.current_balance), 0);
    
    console.log(`\n💰 Excel Total: $${excelTotal.toFixed(2)}`);
    console.log(`💰 DB Total: $${dbTotal.toFixed(2)}`);
    console.log(`💰 Difference: $${(dbTotal - excelTotal).toFixed(2)}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixMunasheAndCompare();

