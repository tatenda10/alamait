const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMakoBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Checking mako\'s balance...');
    
    // Check petty cash accounts
    console.log('\n📊 Petty Cash Accounts:');
    const [pettyCashAccounts] = await connection.execute(`
      SELECT pca.id, pca.account_name, pca.account_code, pca.current_balance, pcu.username, bh.name as boarding_house_name
      FROM petty_cash_accounts pca
      LEFT JOIN petty_cash_users pcu ON pca.petty_cash_user_id = pcu.id
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pca.deleted_at IS NULL
      ORDER BY pca.created_at DESC
    `);
    
    console.table(pettyCashAccounts);
    
    // Check petty cash users
    console.log('\n👤 Petty Cash Users:');
    const [pettyCashUsers] = await connection.execute(`
      SELECT id, username, boarding_house_id, created_at
      FROM petty_cash_users
      WHERE username = 'mako'
    `);
    
    console.table(pettyCashUsers);
    
    // Check petty cash balances
    console.log('\n💰 Petty Cash Balances:');
    const [pettyCashBalances] = await connection.execute(`
      SELECT pcb.*, pcu.username, pca.account_name
      FROM petty_cash_balances pcb
      LEFT JOIN petty_cash_users pcu ON pcb.petty_cash_user_id = pcu.id
      LEFT JOIN petty_cash_accounts pca ON pca.petty_cash_user_id = pcu.id
      WHERE pcu.username = 'mako'
    `);
    
    console.table(pettyCashBalances);
    
    // Check if there are any transactions for mako
    console.log('\n📝 Petty Cash Transactions:');
    const [transactions] = await connection.execute(`
      SELECT pct.*, pcu.username
      FROM petty_cash_transactions pct
      LEFT JOIN petty_cash_users pcu ON pct.petty_cash_user_id = pcu.id
      WHERE pcu.username = 'mako'
      ORDER BY pct.created_at DESC
    `);
    
    console.table(transactions);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkMakoBalance();
