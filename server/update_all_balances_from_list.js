require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateAllBalances() {
  console.log('🔧 Updating all student balances to match the provided list...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Correct balances from the spreadsheet
    const correctBalances = {
      'Agape Chiware': 0,
      'Alicia Mutamuko': 0,
      'Anita Gwenda': 160,
      'Bellis Mapetere': 0,
      'Bertha Majoni': -10,
      'Bertha Mwangu': 0,
      'Chantelle Gora': -33,
      'Christine Mutsikwa': 0,
      'Dion sengamai': -80,
      'Emma Yoradin': -60,
      'Fadzai Mhizha': -61,
      'Farai Muzembe': 40,
      'Fay Mubaiwa': 35,
      'Grace Vutika': 460,
      'Gracious': 0,
      'Kimbely Bones': 35,
      'Kimberly Mutowembwa': 0,
      'Kimberly Nkomo': 0,
      'Kudzai Matare': 0,
      'Kudzai Pemhiwa': -240,
      'Kuziwa': 0,
      'Leona Dengu': -20,
      'Lilian Chatikobo': 0,
      'Lorraine Mlambo': 0,
      'Merrylin Makunzva': 30,
      'Mitchel Chikosha': 0,
      'Munashe': 20,
      'Natasha Chinho': 180,
      'Nyashadzashe Chinos': 0,
      'Paidamoyo Munyimi': 320,
      'Pelagia Gomakalila': 190,
      'Precious Dziva': 133,
      'Precious Mashava': 0,
      'Rachel Madembe': 540,
      'Ropafadzo Masara': -30,
      'Rumbidzai Manyame': -2,
      'Ravimbo Singe': 0,
      'Salina Saidi': 20,
      'Sandra Chirinda': 280,
      'Shalom Gora': -35,
      'Shantel Mashe': 98,
      'Shantell Mavarira': 0,
      'Sharon Matanha': 98,
      'Shelter Masosonere': 180,
      'Tadiwa': 0,
      'Tadiwa Mhloro': 100,
      'Takudzwa Makunde': 180,
      'Tanaka Chikonyera': 0,
      'Tatenda Kamatando': 40,
      'Tawana Kuwana': 37,
      'Thelma Nzvimari': 80,
      'Tinotenda Bwangangwanyo': 10,
      'Tinotenda Chidavaenzi': 20,
      'Tinotenda Magiga': 5,
      'Trypheane Chinembiri': 80,
      'Vannessa Magorimbo': 5,
      'Varaidzo Tafirei': -70,
      'Vimbai': 0
    };

    let updated = 0;
    let notFound = [];

    for (const [fullName, balance] of Object.entries(correctBalances)) {
      // Find student
      const [students] = await connection.execute(`
        SELECT s.id, s.full_name
        FROM students s
        WHERE s.full_name LIKE ?
          AND s.deleted_at IS NULL
        LIMIT 1
      `, [`%${fullName}%`]);

      if (students.length > 0) {
        const student = students[0];
        
        // Update balance
        await connection.execute(`
          UPDATE student_account_balances 
          SET current_balance = ?,
              updated_at = NOW()
          WHERE student_id = ?
        `, [balance, student.id]);

        console.log(`✓ ${fullName}: $${balance}`);
        updated++;
      } else {
        console.log(`✗ ${fullName}: NOT FOUND`);
        notFound.push(fullName);
      }
    }

    await connection.commit();

    console.log(`\n✅ Updated ${updated} student balances`);
    if (notFound.length > 0) {
      console.log(`\n⚠️ Not found (${notFound.length}):`);
      notFound.forEach(name => console.log(`  - ${name}`));
    }

    // Calculate new totals
    const [totals] = await connection.execute(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN current_balance > 0 THEN current_balance ELSE 0 END) as total_prepayments,
        SUM(CASE WHEN current_balance < 0 THEN ABS(current_balance) ELSE 0 END) as total_debtors,
        SUM(current_balance) as net_balance
      FROM student_account_balances
      WHERE deleted_at IS NULL
    `);

    console.log('\n📊 New Totals:');
    console.log(`  Students: ${totals[0].total_students}`);
    console.log(`  Prepayments: $${parseFloat(totals[0].total_prepayments).toFixed(2)}`);
    console.log(`  Debtors: $${parseFloat(totals[0].total_debtors).toFixed(2)}`);
    console.log(`  Net Balance: $${parseFloat(totals[0].net_balance).toFixed(2)}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateAllBalances();

