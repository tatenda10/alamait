const db = require('../src/services/db');

async function checkTableStructure() {
  const conn = await db.getConnection();
  try {
    console.log('Checking current_account_balances table structure...');
    
    const [rows] = await conn.query('DESCRIBE current_account_balances');
    console.log('current_account_balances structure:');
    rows.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\nChecking users table structure...');
    const [userRows] = await conn.query('DESCRIBE users');
    console.log('users structure:');
    userRows.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkTableStructure();
