require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPaymentTypes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get sample transactions with 'payment' type
    const [paymentTxns] = await connection.execute(`
      SELECT * FROM transactions 
      WHERE transaction_type = 'payment' 
        AND deleted_at IS NULL 
      LIMIT 5
    `);
    
    console.log('Sample "payment" type transactions:');
    console.log(paymentTxns);
    console.log('\n');

    // Check all transaction types with student_id
    const [allTypes] = await connection.execute(`
      SELECT transaction_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM transactions 
      WHERE student_id IS NOT NULL
        AND deleted_at IS NULL 
      GROUP BY transaction_type
      ORDER BY count DESC
    `);
    
    console.log('Transaction types with student_id:');
    allTypes.forEach(row => {
      console.log(`  ${row.transaction_type}: ${row.count} records, $${parseFloat(row.total_amount).toFixed(2)}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPaymentTypes();

