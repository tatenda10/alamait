const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking account balance calculation vs storage...\n');
    
    // Check how Accounts Receivable balance is calculated
    console.log('=== Accounts Receivable (10005) ===');
    const [[arBalance]] = await conn.query(`
      SELECT current_balance FROM current_account_balances WHERE account_code = '10005'
    `);
    console.log(`Stored balance: $${arBalance.current_balance}`);
    
    const [[arCalc]] = await conn.query(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code = '10005' AND je.deleted_at IS NULL
    `);
    console.log(`Calculated Debits: $${arCalc.total_debits}`);
    console.log(`Calculated Credits: $${arCalc.total_credits}`);
    console.log(`Should be (Debits - Credits): $${parseFloat(arCalc.total_debits) - parseFloat(arCalc.total_credits)}`);
    
    // Check Opening Balance Equity
    console.log('\n=== Opening Balance Equity (30004) ===');
    const [[eqBalance]] = await conn.query(`
      SELECT current_balance FROM current_account_balances WHERE account_code = '30004'
    `);
    console.log(`Stored balance: $${eqBalance.current_balance}`);
    
    const [[eqCalc]] = await conn.query(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code = '30004' AND je.deleted_at IS NULL
    `);
    console.log(`Calculated Debits: $${eqCalc.total_debits}`);
    console.log(`Calculated Credits: $${eqCalc.total_credits}`);
    console.log(`Should be (Credits - Debits): $${parseFloat(eqCalc.total_credits) - parseFloat(eqCalc.total_debits)}`);
    
    console.log('\n📊 The issue: account balances might have wrong signs in current_account_balances table');
    console.log('Solution: Recalculate using the correct formula from accountBalanceService');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();

