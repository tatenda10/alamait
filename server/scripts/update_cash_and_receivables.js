const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCashAndReceivables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Starting cash and receivables update...');
    
    // First, let's see the current balances
    console.log('\n📊 Current account balances:');
    const [currentBalances] = await connection.execute(`
      SELECT account_code, account_name, account_type, current_balance
      FROM current_account_balances 
      WHERE account_code IN ('10002', '10005')
      ORDER BY account_code
    `);
    
    console.table(currentBalances);
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Update Cash account (account_code 10002)
      console.log('\n💰 Updating Cash balance to $2,458.55...');
      await connection.execute(
        'UPDATE current_account_balances SET current_balance = ? WHERE account_code = ?',
        [2458.55, '10002']
      );
      console.log('✅ Cash balance updated');
      
      // Update Accounts Receivable to -$3,053 (credit balance)
      console.log('\n📋 Updating Accounts Receivable to -$3,053 (credit)...');
      await connection.execute(
        'UPDATE current_account_balances SET current_balance = ? WHERE account_code = ?',
        [-3053, '10005']
      );
      console.log('✅ Accounts Receivable updated to credit balance');
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 Updates completed successfully!');
      
      // Show final balances
      console.log('\n📊 Final account balances:');
      const [finalBalances] = await connection.execute(`
        SELECT account_code, account_name, account_type, current_balance
        FROM current_account_balances 
        WHERE account_code IN ('10002', '10005')
        ORDER BY account_code
      `);
      
      console.table(finalBalances);
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error during update, transaction rolled back:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run the update
updateCashAndReceivables();
