const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateTransactionsPettyCashUserId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Updating transactions with petty_cash_user_id...');
    
    // Get all transactions that have user_id but no petty_cash_user_id
    const [transactions] = await connection.execute(`
      SELECT id, user_id, boarding_house_id 
      FROM petty_cash_transactions 
      WHERE user_id IS NOT NULL AND petty_cash_user_id IS NULL
    `);
    
    console.log(`Found ${transactions.length} transactions to update`);
    
    if (transactions.length > 0) {
      // Update each transaction
      for (const transaction of transactions) {
        // Find the corresponding petty_cash_user_id
        const [pettyCashUsers] = await connection.execute(`
          SELECT id FROM petty_cash_users 
          WHERE id = ? AND boarding_house_id = ?
        `, [transaction.user_id, transaction.boarding_house_id]);
        
        if (pettyCashUsers.length > 0) {
          await connection.execute(`
            UPDATE petty_cash_transactions 
            SET petty_cash_user_id = ? 
            WHERE id = ?
          `, [pettyCashUsers[0].id, transaction.id]);
          
          console.log(`✅ Updated transaction ${transaction.id} with petty_cash_user_id ${pettyCashUsers[0].id}`);
        } else {
          console.log(`⚠️ No petty cash user found for transaction ${transaction.id}`);
        }
      }
    }
    
    // Final check
    const [finalCheck] = await connection.execute(`
      SELECT COUNT(*) as total, 
             COUNT(petty_cash_user_id) as with_petty_cash_user_id
      FROM petty_cash_transactions
    `);
    
    console.log('\n📊 Final status:');
    console.table(finalCheck);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

updateTransactionsPettyCashUserId();
