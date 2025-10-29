require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPaymentTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check student_payments table
    const [studentPayments] = await connection.execute(`
      SELECT COUNT(*) as count FROM student_payments WHERE deleted_at IS NULL
    `);
    console.log('student_payments table:', studentPayments[0].count, 'records');

    // Check transactions table for payment types
    const [paymentTransactions] = await connection.execute(`
      SELECT transaction_type, COUNT(*) as count 
      FROM transactions 
      WHERE deleted_at IS NULL 
      GROUP BY transaction_type
    `);
    console.log('\ntransactions table by type:');
    paymentTransactions.forEach(row => {
      console.log(`  ${row.transaction_type}: ${row.count}`);
    });

    // Sample from student_payments if any exist
    if (studentPayments[0].count > 0) {
      const [sample] = await connection.execute(`
        SELECT * FROM student_payments WHERE deleted_at IS NULL LIMIT 5
      `);
      console.log('\nSample student_payments records:');
      console.log(sample);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPaymentTables();

