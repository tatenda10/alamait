const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupPettyCashAccounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Starting petty cash accounts cleanup...');
    
    // First, let's see what accounts we have
    console.log('\n📊 Current petty cash accounts:');
    const [accounts] = await connection.execute(`
      SELECT pca.id, pca.account_name, pca.account_code, pca.current_balance, pcu.username, bh.name as boarding_house_name
      FROM petty_cash_accounts pca
      LEFT JOIN petty_cash_users pcu ON pca.petty_cash_user_id = pcu.id
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pca.deleted_at IS NULL
      ORDER BY pca.created_at DESC
    `);
    
    console.table(accounts);
    
    // Find the mako account
    const makoAccount = accounts.find(acc => acc.username === 'mako');
    if (!makoAccount) {
      console.log('❌ Mako account not found!');
      return;
    }
    
    console.log(`\n✅ Found mako account: ID ${makoAccount.id}, Balance: $${makoAccount.current_balance}`);
    
    // Calculate total balance from other accounts
    const otherAccounts = accounts.filter(acc => acc.id !== makoAccount.id);
    const totalBalanceToTransfer = otherAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
    
    console.log(`\n💰 Total balance to transfer: $${totalBalanceToTransfer.toFixed(2)}`);
    console.log(`📝 Accounts to delete: ${otherAccounts.length}`);
    
    if (otherAccounts.length === 0) {
      console.log('✅ No other accounts to delete.');
      return;
    }
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Update mako account balance
      const newBalance = parseFloat(makoAccount.current_balance || 0) + totalBalanceToTransfer;
      await connection.execute(
        'UPDATE petty_cash_accounts SET current_balance = ? WHERE id = ?',
        [newBalance, makoAccount.id]
      );
      
      console.log(`✅ Updated mako account balance to $${newBalance.toFixed(2)}`);
      
      // Delete other accounts (soft delete)
      const accountIdsToDelete = otherAccounts.map(acc => acc.id);
      if (accountIdsToDelete.length > 0) {
        const placeholders = accountIdsToDelete.map(() => '?').join(',');
        await connection.execute(
          `UPDATE petty_cash_accounts SET deleted_at = NOW() WHERE id IN (${placeholders})`,
          accountIdsToDelete
        );
        console.log(`✅ Soft deleted ${accountIdsToDelete.length} accounts`);
      }
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 Cleanup completed successfully!');
      
      // Show final state
      console.log('\n📊 Final petty cash accounts:');
      const [finalAccounts] = await connection.execute(`
        SELECT pca.id, pca.account_name, pca.account_code, pca.current_balance, pcu.username, bh.name as boarding_house_name
        FROM petty_cash_accounts pca
        LEFT JOIN petty_cash_users pcu ON pca.petty_cash_user_id = pcu.id
        LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
        WHERE pca.deleted_at IS NULL
        ORDER BY pca.created_at DESC
      `);
      
      console.table(finalAccounts);
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error during cleanup, transaction rolled back:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run the cleanup
cleanupPettyCashAccounts();
