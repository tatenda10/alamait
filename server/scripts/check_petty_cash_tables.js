const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPettyCashTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    const [tables] = await connection.execute("SHOW TABLES LIKE '%petty%'");
    console.log('Petty cash related tables:');
    console.table(tables);
    
    // Check if there are any balance-related tables
    const [balanceTables] = await connection.execute("SHOW TABLES LIKE '%balance%'");
    console.log('\nBalance related tables:');
    console.table(balanceTables);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkPettyCashTables();
