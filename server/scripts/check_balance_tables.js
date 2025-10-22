const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBalanceTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check for balance-related tables
    const [tables] = await connection.execute("SHOW TABLES LIKE '%balance%'");
    console.log('Balance-related tables:');
    console.table(tables);
    
    if (tables.length > 0) {
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`\nStructure of ${tableName}:`);
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        console.table(columns);
        
        console.log(`\nSample data from ${tableName}:`);
        const [data] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
        console.table(data);
      }
    }
    
    // Also check for account_balances specifically
    try {
      const [accountBalances] = await connection.execute('SELECT * FROM account_balances LIMIT 5');
      console.log('\nAccount balances:');
      console.table(accountBalances);
    } catch (error) {
      console.log('No account_balances table found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkBalanceTables();
