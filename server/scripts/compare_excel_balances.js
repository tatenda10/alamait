const mysql = require('mysql2/promise');
require('dotenv').config();

async function compareExcelBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Comparing Excel balances with database balances...');
    console.log('Note: Values in parentheses () are negative balances (credits)\n');

    // Data extracted from the Excel image
    const excelBalances = [
      { customer: 'Trypheane Chinembiri', balanceDue: 80.00 },
      { customer: 'Leona Dengu', balanceDue: -20.00 },
      { customer: 'Takudzwa Makunde', balanceDue: 180.00 },
      { customer: 'Kudzai Matare', balanceDue: 0.00 }, // '-' means 0
      { customer: 'Shantel Mashe', balanceDue: 98.00 },
      { customer: 'Anita Gwenda', balanceDue: 160.00 },
      { customer: 'Lillian Chatikobo', balanceDue: 0.00 },
      { customer: 'Sharon Matanha', balanceDue: 98.00 },
      { customer: 'Bellis Mapetere', balanceDue: 180.00 },
      { customer: 'Tatenda Kamatando', balanceDue: 40.00 },
      { customer: 'Fay Mubaiwa', balanceDue: 35.00 },
      { customer: 'Christine Mutsikwa', balanceDue: 0.00 },
      { customer: 'Bertha Mwangu', balanceDue: 0.00 },
      { customer: 'Merrylin Makunzva', balanceDue: 30.00 },
      { customer: 'Shantell Mawarira', balanceDue: 0.00 },
      { customer: 'Salina Saidi', balanceDue: 20.00 },
      { customer: 'Tinotenda Bwangangwanyo', balanceDue: 10.00 },
      { customer: 'Kimberly Nkomo', balanceDue: 0.00 },
      { customer: 'Kimberly Mutowembwa', balanceDue: 0.00 },
      { customer: 'Alicia Mutamuko', balanceDue: 0.00 },
      { customer: 'Tawana Kuwana', balanceDue: 37.00 },
      { customer: 'Bertha Majoni', balanceDue: -10.00 },
      { customer: 'Lorraine Mlambo', balanceDue: 0.00 },
      { customer: 'Tinotenda Magiga', balanceDue: 5.00 },
      { customer: 'Rumbidzai Manyaora', balanceDue: -2.00 },
      { customer: 'Precious Mashava', balanceDue: 0.00 },
      { customer: 'Tanaka Chikonyera', balanceDue: 0.00 },
      { customer: 'Nyashadzashe Chinorwiwa', balanceDue: 0.00 },
      { customer: 'Kimbely Bones', balanceDue: 35.00 },
      { customer: 'Natasha Chinho', balanceDue: 180.00 },
      { customer: 'Tadiwa', balanceDue: 0.00 },
      { customer: 'Tadiwa Mhloro', balanceDue: 100.00 },
      { customer: 'Varaidzo Tafirei', balanceDue: -70.00 },
      { customer: 'Precious Dziva', balanceDue: 133.00 },
      { customer: 'Shelter Masosonere', balanceDue: 180.00 },
      { customer: 'Munashe', balanceDue: 20.00 },
      { customer: 'Sandra Chirinda', balanceDue: 280.00 },
      { customer: 'Chantelle Gora', balanceDue: -35.00 },
      { customer: 'Shalom Gora', balanceDue: -35.00 },
      { customer: 'Ruvimbo Singe', balanceDue: 0.00 },
      { customer: 'Thelma Nzviramiri', balanceDue: 80.00 },
      { customer: 'Fadzai Mhizha', balanceDue: -61.00 },
      { customer: 'Kuziwa', balanceDue: 0.00 },
      { customer: 'Mitchel Chikosha', balanceDue: 0.00 },
      { customer: 'Vimbai', balanceDue: 0.00 },
      { customer: 'Vannessa Magorimbo', balanceDue: 5.00 },
      { customer: 'Agape Chiware', balanceDue: 0.00 },
      { customer: 'Paidamoyo Munyimi', balanceDue: 320.00 },
      { customer: 'Gracious', balanceDue: 0.00 },
      { customer: 'Grace Vutika', balanceDue: 460.00 },
      { customer: 'Rachel Madembe', balanceDue: 540.00 },
      { customer: 'Pelagia Gomakalila', balanceDue: 190.00 },
      { customer: 'Farai Muzembe', balanceDue: 40.00 },
      { customer: 'Tinotenda Chidavaenzi', balanceDue: 20.00 },
      { customer: 'Dion sengamai', balanceDue: -80.00 },
      { customer: 'Emma Yoradin', balanceDue: -20.00 },
      { customer: 'Ropafadzo Masara', balanceDue: -30.00 },
      { customer: 'Kudzai Pemhiwa', balanceDue: -240.00 }
    ];

    console.log(`📊 Excel data contains ${excelBalances.length} students\n`);

    // Get database balances
    const [dbBalances] = await connection.execute(`
      SELECT 
        s.full_name as customer_name,
        sab.current_balance,
        se.id as enrollment_id,
        r.name as room_number,
        bh.name as boarding_house_name
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      JOIN student_enrollments se ON s.id = se.student_id AND sab.enrollment_id = se.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE s.deleted_at IS NULL AND sab.deleted_at IS NULL
      ORDER BY s.full_name
    `);

    console.log(`📊 Database contains ${dbBalances.length} student balances\n`);

    // Create maps for comparison
    const dbBalancesMap = new Map();
    dbBalances.forEach(row => {
      dbBalancesMap.set(row.customer_name, {
        balance: parseFloat(row.current_balance),
        enrollment_id: row.enrollment_id,
        room: row.room_number,
        boarding_house: row.boarding_house_name
      });
    });

    const excelBalancesMap = new Map();
    excelBalances.forEach(row => {
      excelBalancesMap.set(row.customer, row.balanceDue);
    });

    // Compare balances
    let matches = 0;
    let discrepancies = [];
    let notFoundInDB = [];
    let notFoundInExcel = [];

    console.log('🔍 COMPARISON RESULTS:\n');
    console.log('='.repeat(80));

    // Check Excel students against database
    excelBalances.forEach(excelEntry => {
      const dbEntry = dbBalancesMap.get(excelEntry.customer);
      if (dbEntry === undefined) {
        notFoundInDB.push(excelEntry.customer);
        console.log(`❌ NOT FOUND IN DB: ${excelEntry.customer} (Excel: ${excelEntry.balanceDue})`);
      } else {
        const dbBalance = dbEntry.balance;
        const excelBalance = excelEntry.balanceDue;
        const difference = Math.abs(dbBalance - excelBalance);
        
        if (difference <= 0.01) { // Allow for floating point precision
          matches++;
          console.log(`✅ MATCH: ${excelEntry.customer} - Excel: ${excelBalance}, DB: ${dbBalance}`);
        } else {
          discrepancies.push({
            customer: excelEntry.customer,
            excelBalance: excelBalance,
            dbBalance: dbBalance,
            difference: difference,
            room: dbEntry.room,
            boarding_house: dbEntry.boarding_house
          });
          console.log(`❌ MISMATCH: ${excelEntry.customer} - Excel: ${excelBalance}, DB: ${dbBalance} (Diff: ${difference.toFixed(2)})`);
        }
      }
    });

    // Check database students not in Excel
    dbBalances.forEach(dbEntry => {
      if (!excelBalancesMap.has(dbEntry.customer_name)) {
        notFoundInExcel.push({
          customer: dbEntry.customer_name,
          balance: dbEntry.current_balance,
          room: dbEntry.room_number,
          boarding_house: dbEntry.boarding_house_name
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY:');
    console.log(`✅ Matches: ${matches}`);
    console.log(`❌ Discrepancies: ${discrepancies.length}`);
    console.log(`❌ Not found in DB: ${notFoundInDB.length}`);
    console.log(`❌ Not found in Excel: ${notFoundInExcel.length}`);

    if (discrepancies.length > 0) {
      console.log('\n🔍 DETAILED DISCREPANCIES:');
      discrepancies.forEach(d => {
        console.log(`  ${d.customer}:`);
        console.log(`    Excel: ${d.excelBalance}, DB: ${d.dbBalance}, Diff: ${d.difference.toFixed(2)}`);
        console.log(`    Room: ${d.room}, Boarding House: ${d.boarding_house}`);
      });
    }

    if (notFoundInDB.length > 0) {
      console.log('\n❌ STUDENTS IN EXCEL BUT NOT IN DATABASE:');
      notFoundInDB.forEach(name => console.log(`  - ${name}`));
    }

    if (notFoundInExcel.length > 0) {
      console.log('\n❌ STUDENTS IN DATABASE BUT NOT IN EXCEL:');
      notFoundInExcel.forEach(entry => {
        console.log(`  - ${entry.customer} (Balance: ${entry.balance}, Room: ${entry.room}, BH: ${entry.boarding_house})`);
      });
    }

    // Summary statistics
    const excelTotalDebt = excelBalances.filter(s => s.balanceDue > 0).reduce((sum, s) => sum + s.balanceDue, 0);
    const excelTotalCredit = Math.abs(excelBalances.filter(s => s.balanceDue < 0).reduce((sum, s) => sum + s.balanceDue, 0));
    const dbTotalDebt = dbBalances.filter(s => parseFloat(s.current_balance) > 0).reduce((sum, s) => sum + parseFloat(s.current_balance), 0);
    const dbTotalCredit = Math.abs(dbBalances.filter(s => parseFloat(s.current_balance) < 0).reduce((sum, s) => sum + parseFloat(s.current_balance), 0));

    console.log('\n💰 FINANCIAL SUMMARY:');
    console.log(`Excel - Total Debt: $${excelTotalDebt.toFixed(2)}, Total Credit: $${excelTotalCredit.toFixed(2)}`);
    console.log(`DB    - Total Debt: $${dbTotalDebt.toFixed(2)}, Total Credit: $${dbTotalCredit.toFixed(2)}`);

    if (matches === excelBalances.length && notFoundInDB.length === 0) {
      console.log('\n🎉 SUCCESS: All Excel balances match the database perfectly!');
    } else {
      console.log('\n⚠️  WARNING: There are discrepancies that need to be resolved.');
    }

  } catch (error) {
    console.error('❌ Error during balance comparison:', error);
  } finally {
    await connection.end();
  }
}

compareExcelBalances();
