const mysql = require('mysql2/promise');

async function testCOA() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'alamait'
    });

    console.log('Connected to database');

    // Check if table exists
    const [tables] = await connection.query('SHOW TABLES LIKE "chart_of_accounts"');
    if (tables.length === 0) {
      console.log('❌ chart_of_accounts table does not exist');
      return;
    }
    console.log('✅ chart_of_accounts table exists');

    // Check count
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM chart_of_accounts');
    console.log('📊 Total accounts:', countResult[0].count);

    // Check sample data
    const [accounts] = await connection.query('SELECT code, name, type FROM chart_of_accounts LIMIT 5');
    console.log('📋 Sample accounts:');
    accounts.forEach(account => {
      console.log(`  ${account.code} - ${account.name} (${account.type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testCOA();
