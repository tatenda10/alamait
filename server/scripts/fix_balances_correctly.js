const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixBalancesCorrectly() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔧 Fixing balances correctly...\n');

    // Excel data with correct interpretation:
    // Values in brackets () are negative balances (credits/overpaid)
    // All other values are positive balances (debt)
    // Students with 0 or '-' should have 0 balance
    const excelBalances = [
      { customer: 'Trypheane Chinembiri', balanceDue: 80.00 },
      { customer: 'Leona Dengu', balanceDue: -20.00 }, // Negative = credit
      { customer: 'Takudzwa Makunde', balanceDue: 180.00 },
      { customer: 'Kudzai Matare', balanceDue: 0.00 }, // 0 = no balance
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
      { customer: 'Shantell Mawarira', balanceDue: 0.00 }, // Not in DB
      { customer: 'Salina Saidi', balanceDue: 20.00 },
      { customer: 'Tinotenda Bwangangwanyo', balanceDue: 10.00 },
      { customer: 'Kimberly Nkomo', balanceDue: 0.00 },
      { customer: 'Kimberly Mutowembwa', balanceDue: 0.00 },
      { customer: 'Alicia Mutamuko', balanceDue: 0.00 },
      { customer: 'Tawana Kuwana', balanceDue: 37.00 },
      { customer: 'Bertha Majoni', balanceDue: -10.00 }, // Negative = credit
      { customer: 'Lorraine Mlambo', balanceDue: 0.00 },
      { customer: 'Tinotenda Magiga', balanceDue: 5.00 },
      { customer: 'Rumbidzai Manyaora', balanceDue: -2.00 }, // Negative = credit
      { customer: 'Precious Mashava', balanceDue: 0.00 },
      { customer: 'Tanaka Chikonyera', balanceDue: 0.00 },
      { customer: 'Nyashadzashe Chinorwiwa', balanceDue: 0.00 },
      { customer: 'Kimbely Bones', balanceDue: 35.00 },
      { customer: 'Natasha Chinho', balanceDue: 180.00 },
      { customer: 'Tadiwa', balanceDue: 0.00 },
      { customer: 'Tadiwa Mhloro', balanceDue: 100.00 },
      { customer: 'Varaidzo Tafirei', balanceDue: -70.00 }, // Negative = credit
      { customer: 'Precious Dziva', balanceDue: 133.00 },
      { customer: 'Shelter Masosonere', balanceDue: 180.00 },
      { customer: 'Munashe', balanceDue: 20.00 },
      { customer: 'Sandra Chirinda', balanceDue: 280.00 },
      { customer: 'Chantelle Gora', balanceDue: -35.00 }, // Negative = credit
      { customer: 'Shalom Gora', balanceDue: -35.00 }, // Negative = credit
      { customer: 'Ruvimbo Singe', balanceDue: 0.00 },
      { customer: 'Thelma Nzviramiri', balanceDue: 80.00 }, // Not in DB
      { customer: 'Fadzai Mhizha', balanceDue: -61.00 }, // Negative = credit
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
      { customer: 'Dion sengamai', balanceDue: -80.00 }, // Negative = credit
      { customer: 'Emma Yoradin', balanceDue: -20.00 }, // Negative = credit
      { customer: 'Ropafadzo Masara', balanceDue: -30.00 }, // Negative = credit
      { customer: 'Kudzai Pemhiwa', balanceDue: -240.00 } // Negative = credit
    ];

    // Get current database students
    const [dbStudents] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name as customer_name,
        sab.current_balance,
        se.id as enrollment_id
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      JOIN student_enrollments se ON s.id = se.student_id AND sab.enrollment_id = se.id
      WHERE s.deleted_at IS NULL AND sab.deleted_at IS NULL
      ORDER BY s.full_name
    `);

    console.log(`📊 Found ${dbStudents.length} students in database`);
    console.log(`📊 Found ${excelBalances.length} students in Excel\n`);

    // Create maps for comparison
    const dbStudentsMap = new Map();
    dbStudents.forEach(student => {
      dbStudentsMap.set(student.customer_name, {
        student_id: student.student_id,
        enrollment_id: student.enrollment_id,
        current_balance: parseFloat(student.current_balance)
      });
    });

    const excelBalancesMap = new Map();
    excelBalances.forEach(entry => {
      excelBalancesMap.set(entry.customer, entry.balanceDue);
    });

    // Handle name variations
    const nameVariations = {
      'Shantell Mawarira': 'Shantell Mavarira',
      'Thelma Nzviramiri': 'Thelma Nzvimari'
    };

    let updatedCount = 0;
    let skippedCount = 0;

    console.log('🔄 UPDATING BALANCES:');
    console.log('='.repeat(50));

    // Update balances for all students
    for (const excelEntry of excelBalances) {
      let dbStudent = dbStudentsMap.get(excelEntry.customer);
      
      // Check for name variations
      if (!dbStudent && nameVariations[excelEntry.customer]) {
        const alternativeName = nameVariations[excelEntry.customer];
        dbStudent = dbStudentsMap.get(alternativeName);
        if (dbStudent) {
          console.log(`🔄 Found name variation: ${excelEntry.customer} → ${alternativeName}`);
        }
      }
      
      if (dbStudent) {
        const newBalance = excelEntry.balanceDue;
        const oldBalance = dbStudent.current_balance;
        
        if (Math.abs(newBalance - oldBalance) > 0.01) {
          await connection.execute(
            `UPDATE student_account_balances 
             SET current_balance = ?, updated_at = NOW() 
             WHERE student_id = ? AND enrollment_id = ?`,
            [newBalance, dbStudent.student_id, dbStudent.enrollment_id]
          );
          
          console.log(`✅ ${excelEntry.customer}: ${oldBalance} → ${newBalance}`);
          updatedCount++;
        } else {
          console.log(`⏭️  ${excelEntry.customer}: ${oldBalance} (no change needed)`);
          skippedCount++;
        }
      } else {
        console.log(`❌ ${excelEntry.customer}: Not found in database`);
      }
    }

    // Count students by balance type
    const [finalBalances] = await connection.execute(`
      SELECT 
        s.full_name as customer_name,
        sab.current_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      JOIN student_enrollments se ON s.id = se.student_id AND sab.enrollment_id = se.id
      WHERE s.deleted_at IS NULL AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    const debtors = finalBalances.filter(s => parseFloat(s.current_balance) > 0);
    const creditors = finalBalances.filter(s => parseFloat(s.current_balance) < 0);
    const zeroBalances = finalBalances.filter(s => parseFloat(s.current_balance) === 0);

    console.log('\n📊 FINAL BALANCE BREAKDOWN:');
    console.log('='.repeat(50));
    console.log(`💰 Students owing money (debtors): ${debtors.length}`);
    console.log(`💳 Students with credit (creditors): ${creditors.length}`);
    console.log(`⚖️  Students with zero balance: ${zeroBalances.length}`);
    console.log(`📊 Total students: ${finalBalances.length}`);

    console.log('\n💳 STUDENTS WITH CREDIT (NEGATIVE BALANCES):');
    console.log('='.repeat(50));
    creditors.forEach(student => {
      console.log(`✅ ${student.customer_name}: ${student.current_balance}`);
    });

    console.log('\n💰 STUDENTS OWING MONEY (POSITIVE BALANCES):');
    console.log('='.repeat(50));
    debtors.forEach(student => {
      console.log(`❌ ${student.customer_name}: ${student.current_balance}`);
    });

    // Calculate totals
    const totalDebt = debtors.reduce((sum, s) => sum + parseFloat(s.current_balance), 0);
    const totalCredit = Math.abs(creditors.reduce((sum, s) => sum + parseFloat(s.current_balance), 0));

    console.log('\n📈 FINANCIAL SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updatedCount} students`);
    console.log(`⏭️  Skipped: ${skippedCount} students`);
    console.log(`💰 Total Debt: $${totalDebt.toFixed(2)}`);
    console.log(`💳 Total Credit: $${totalCredit.toFixed(2)}`);

    console.log('\n🎉 Database balances have been corrected!');

  } catch (error) {
    console.error('❌ Error updating balances:', error);
  } finally {
    await connection.end();
  }
}

fixBalancesCorrectly();
