const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTransactionTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    const [tables] = await connection.execute("SHOW TABLES LIKE '%transaction%'");
    console.log('Transaction-related tables:');
    console.table(tables);
    
    if (tables.length > 0) {
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`\nStructure of ${tableName}:`);
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        console.table(columns);
      }
    }
    
    // Also check for any tables that might contain journal entries
    const [allTables] = await connection.execute("SHOW TABLES");
    const relevantTables = allTables.filter(table => {
      const tableName = Object.values(table)[0];
      return tableName.includes('journal') || tableName.includes('entry') || tableName.includes('transaction');
    });
    
    console.log('\nAll relevant tables:');
    console.table(relevantTables);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkTransactionTables();
