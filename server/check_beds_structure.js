const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBedsStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking beds table structure...');
    
    // Check table structure
    const [structure] = await connection.execute(`
      DESCRIBE beds
    `);
    
    console.log('📋 beds table structure:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check sample data
    const [sampleData] = await connection.execute(`
      SELECT * FROM beds LIMIT 3
    `);
    
    console.log('\n📊 Sample beds data:');
    console.log(JSON.stringify(sampleData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkBedsStructure();
