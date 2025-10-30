const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== CHECKING BALANCES FOR TANAKA AND DION ===\n');

    const [students] = await connection.query(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        sab.current_balance,
        sab.updated_at
      FROM students s
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Tanaka%' OR s.full_name LIKE '%Dion%'
      ORDER BY s.full_name
    `);

    if (students.length === 0) {
      console.log('❌ No students found with names containing Tanaka or Dion');
    } else {
      console.log(`Found ${students.length} student(s):\n`);
      console.log('='.repeat(80));
      
      students.forEach(s => {
        console.log(`👤 Name: ${s.full_name}`);
        console.log(`   Student ID: ${s.student_id}`);
        console.log(`   Database ID: ${s.id}`);
        console.log(`   💰 Balance: $${s.current_balance || 0}`);
        console.log(`   📅 Last Updated: ${s.updated_at || 'Never'}`);
        console.log('='.repeat(80));
      });

      // Also get their recent transactions
      console.log('\n=== RECENT TRANSACTIONS (Last 5 for each) ===\n');
      
      for (const student of students) {
        const [transactions] = await connection.query(`
          SELECT 
            t.id,
            t.transaction_date,
            t.transaction_type,
            t.amount,
            t.description
          FROM transactions t
          WHERE t.student_id = ?
          ORDER BY t.transaction_date DESC, t.id DESC
          LIMIT 5
        `, [student.id]);

        console.log(`\n📋 ${student.full_name} - Recent Transactions:`);
        console.log('-'.repeat(80));
        
        if (transactions.length === 0) {
          console.log('   No transactions found');
        } else {
          transactions.forEach(t => {
            const date = new Date(t.transaction_date).toLocaleDateString();
            console.log(`   ${date} | ${t.transaction_type.padEnd(20)} | $${t.amount.padStart(8)} | ${t.description || ''}`);
          });
        }
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

checkBalances();

