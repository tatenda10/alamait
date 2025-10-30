const mysql = require('mysql2/promise');
require('dotenv').config();

async function findPettyCashTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== SEARCHING FOR PETTY CASH TABLES ===\n');

    const [tables] = await connection.query("SHOW TABLES LIKE '%petty%'");
    console.log('Tables found:', tables.length);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log('  -', tableName);
    });

    // Check if there's a petty_cash_users table
    console.log('\n=== CHECKING petty_cash_users TABLE ===\n');
    try {
      const [data] = await connection.query('SELECT * FROM petty_cash_users');
      console.log('Found', data.length, 'rows in petty_cash_users');
      data.forEach(row => {
        console.log(row);
      });
    } catch (error) {
      console.log('petty_cash_users table does not exist or error:', error.message);
    }

    // Also show all petty cash related data
    console.log('\n=== ALL PETTY CASH ACCOUNTS ===\n');
    const [accounts] = await connection.query(`
      SELECT 
        pca.id,
        pca.petty_cash_user_id,
        u.username,
        pca.current_balance,
        pca.boarding_house_id,
        pca.deleted_at
      FROM petty_cash_accounts pca
      LEFT JOIN users u ON pca.petty_cash_user_id = u.id
      ORDER BY pca.id
    `);

    console.log('Total accounts:', accounts.length);
    accounts.forEach(acc => {
      console.log(`ID: ${acc.id} | User: ${acc.username || 'NULL'} (${acc.petty_cash_user_id}) | Balance: $${acc.current_balance} | Deleted: ${acc.deleted_at ? 'YES' : 'NO'}`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

findPettyCashTables();

