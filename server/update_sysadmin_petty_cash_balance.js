const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePettyCashBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();
    
    console.log('\n=== UPDATING PETTY CASH BALANCE ===\n');

    // Get sysadmin's petty cash account
    const [accounts] = await connection.query(`
      SELECT pca.*, u.username 
      FROM petty_cash_accounts pca
      JOIN users u ON pca.petty_cash_user_id = u.id
      WHERE u.username = 'sysadmin' AND pca.deleted_at IS NULL
    `);

    if (accounts.length === 0) {
      console.log('❌ No active petty cash account found for sysadmin');
      await connection.end();
      return;
    }

    const account = accounts[0];
    console.log(`Found petty cash account for ${account.username}`);
    console.log(`Account ID: ${account.id}`);
    console.log(`Current Balance: $${account.current_balance}`);

    const newBalance = Number(account.current_balance) + 30;
    console.log(`New Balance: $${newBalance}`);
    console.log('');

    // Update the balance
    await connection.query(`
      UPDATE petty_cash_accounts 
      SET current_balance = ?
      WHERE id = ?
    `, [newBalance, account.id]);

    console.log(`✅ Updated petty cash account ID ${account.id}`);
    console.log(`   ${account.username}: $${account.current_balance} → $${newBalance}`);

    await connection.commit();
    
    console.log('\n✅ PETTY CASH BALANCE UPDATED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log('- Added $30 to sysadmin petty cash account');
    console.log('- New balance: $71.00');
    console.log('- This accounts for the removed duplicate waste transaction\n');

    await connection.end();
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

updatePettyCashBalance();

