const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('=== Recomputing all account balances ===');
    await recalculateAllAccountBalances();
    
    console.log('\n=== Checking Cash and CBZ Vault balances ===');
    const [accounts] = await conn.query(
      `SELECT id, code, name, type FROM chart_of_accounts 
       WHERE code IN ('10002', '10004') AND deleted_at IS NULL`
    );
    
    for (const acc of accounts) {
      const [balance] = await conn.query(
        `SELECT current_balance FROM current_account_balances WHERE account_code = ?`,
        [acc.code]
      );
      console.log(`${acc.code} - ${acc.name}: $${balance[0]?.current_balance || 0}`);
    }
    
    console.log('\n✅ Balance check complete.');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();

