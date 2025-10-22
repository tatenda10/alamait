const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPettyCashAPI() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Testing petty cash API query...');
    
    // Simulate the exact query from the controller
    const userId = 1; // mako's user ID
    const boardingHouseId = 4; // St Kilda
    
    console.log(`Testing for user ID: ${userId}, boarding house ID: ${boardingHouseId}`);
    
    // Get current petty cash balance for the specific user
    const [balanceResult] = await connection.execute(
      `SELECT 
        COALESCE(current_balance, 0) as current_balance,
        COALESCE(beginning_balance, 0) as beginning_balance,
        COALESCE(total_inflows, 0) as total_inflows,
        COALESCE(total_outflows, 0) as total_outflows,
        account_name,
        account_code,
        status
       FROM petty_cash_accounts 
       WHERE petty_cash_user_id = ? AND boarding_house_id = ?`,
      [userId, boardingHouseId]
    );
    
    console.log('\n📊 Balance result:');
    console.table(balanceResult);
    
    // Get recent transactions
    const [transactionsResult] = await connection.execute(
      `SELECT 
        id,
        transaction_type,
        amount,
        description,
        reference_number,
        transaction_date,
        notes,
        created_at
       FROM petty_cash_transactions 
       WHERE petty_cash_user_id = ? 
       ORDER BY transaction_date DESC, id DESC 
       LIMIT 50`,
      [userId]
    );
    
    console.log('\n📝 Transactions result:');
    console.log(`Found ${transactionsResult.length} transactions`);
    if (transactionsResult.length > 0) {
      console.table(transactionsResult.slice(0, 5)); // Show first 5
    }
    
    // Simulate the response that would be sent to frontend
    let accountData = {
      current_balance: 0,
      beginning_balance: 0,
      total_inflows: 0,
      total_outflows: 0,
      account_name: `Petty Cash - mako`,
      account_code: `PC-001`,
      status: 'active'
    };

    if (balanceResult.length > 0) {
      accountData = balanceResult[0];
    }
    
    console.log('\n🎯 Final account data that would be sent to frontend:');
    console.table([accountData]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testPettyCashAPI();
