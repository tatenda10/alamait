const db = require('../src/services/db');

async function checkSetup() {
  const conn = await db.getConnection();
  try {
    // Check petty cash tables
    console.log('=== Checking Petty Cash Tables ===');
    const [tables] = await conn.query("SHOW TABLES LIKE '%petty%'");
    console.log('Petty cash tables:', tables);
    
    // Check if petty_cash_accounts has user_id column
    const [columns] = await conn.query("SHOW COLUMNS FROM petty_cash_accounts");
    console.log('\nPetty Cash Accounts columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    // Check users
    console.log('\n=== Checking Users ===');
    const [users] = await conn.query("SELECT id, username, role FROM users WHERE deleted_at IS NULL");
    console.log('Users:', users);
    
    // Check boarding houses
    console.log('\n=== Checking Boarding Houses ===');
    const [houses] = await conn.query("SELECT id, name FROM boarding_houses WHERE deleted_at IS NULL");
    console.log('Boarding Houses:', houses);
    
    // Check petty cash accounts
    console.log('\n=== Checking Existing Petty Cash Accounts ===');
    const [accounts] = await conn.query("SELECT * FROM petty_cash_accounts WHERE deleted_at IS NULL");
    console.log('Petty Cash Accounts:', accounts);
    
    // Check Chart of Accounts for Petty Cash
    console.log('\n=== Checking COA for Petty Cash ===');
    const [coaAccounts] = await conn.query("SELECT id, code, name, type FROM chart_of_accounts WHERE code LIKE '1000%' AND deleted_at IS NULL");
    console.log('Petty Cash COA accounts:', coaAccounts);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkSetup();

