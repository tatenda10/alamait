const db = require('../src/services/db');

async function checkPettyCashAccounts() {
  try {
    console.log('🔍 Checking existing petty cash accounts...');
    
    const [accounts] = await db.query(`
      SELECT 
        pca.id,
        pca.user_id,
        pca.boarding_house_id,
        pca.account_name,
        pca.account_code,
        pca.current_balance,
        u.username,
        bh.name as boarding_house_name
      FROM petty_cash_accounts pca 
      LEFT JOIN users u ON pca.user_id = u.id 
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id 
      WHERE pca.deleted_at IS NULL
    `);
    
    console.log(`Found ${accounts.length} existing petty cash accounts:`);
    if (accounts.length > 0) {
      console.table(accounts);
    } else {
      console.log('No petty cash accounts found.');
    }
    
    // Check users and boarding houses
    const [users] = await db.query('SELECT id, username, role FROM users WHERE deleted_at IS NULL');
    const [boardingHouses] = await db.query('SELECT id, name FROM boarding_houses WHERE deleted_at IS NULL');
    
    console.log('\nAvailable users:');
    console.table(users);
    
    console.log('\nAvailable boarding houses:');
    console.table(boardingHouses);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPettyCashAccounts();
