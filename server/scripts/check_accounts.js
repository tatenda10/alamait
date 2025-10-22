const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAccounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    const [accounts] = await connection.execute(`
      SELECT account_code, account_name, account_type, current_balance
      FROM chart_of_accounts 
      WHERE account_name LIKE '%cash%' OR account_name LIKE '%receivable%' OR account_code LIKE '1%'
      ORDER BY account_code
    `);
    
    console.log('Current accounts:');
    console.table(accounts);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkAccounts();