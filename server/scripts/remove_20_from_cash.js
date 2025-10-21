const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function fix() {
  const conn = await db.getConnection();
  try {
    console.log('Removing $20 from Cash account balance...\n');
    
    // Get current cash balance
    const [[currentBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    
    console.log(`Current Cash balance: $${currentBalance?.current_balance || 0}`);
    
    // Update cash balance
    await conn.query(
      `UPDATE current_account_balances 
       SET current_balance = current_balance - 20.00,
           updated_at = NOW()
       WHERE account_code = '10002'`
    );
    
    console.log('✅ Subtracted $20 from Cash balance');
    
    // Check final balance
    const [[cashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    
    console.log(`New Cash balance: $${cashBalance?.current_balance || 0}`);
    
    console.log('\n✅ Correction completed successfully!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

fix();

