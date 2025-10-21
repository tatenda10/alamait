const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Checking soft-deleted payment journal entries...');
    
    // Check soft-deleted journal entries
    const [deletedJournals] = await conn.query(
      `SELECT COUNT(*) as count, SUM(je.amount) as total_amount
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10002' AND je.deleted_at IS NOT NULL AND t.transaction_type = 'payment'`
    );
    
    console.log(`Soft-deleted payment journal entries: ${deletedJournals[0]?.count || 0}`);
    console.log(`Total amount: $${deletedJournals[0]?.total_amount || 0}`);
    
    if (deletedJournals[0]?.count === 0) {
      console.log('✅ No soft-deleted journal entries found!');
      conn.release();
      process.exit(0);
    }
    
    console.log('\nStep 2: Restoring soft-deleted payment journal entries...');
    
    // Restore soft-deleted journal entries for payment transactions
    const [restoreResult] = await conn.query(
      `UPDATE journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       SET je.deleted_at = NULL
       WHERE coa.code = '10002' AND je.deleted_at IS NOT NULL AND t.transaction_type = 'payment'`
    );
    
    console.log(`✅ Restored ${restoreResult.affectedRows} journal entries`);
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify the fix
    console.log('\nStep 4: Verifying fix...');
    const [cashJournalEntries] = await conn.query(
      `SELECT SUM(je.amount) as total_cash_debits
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10002' AND t.transaction_type = 'payment' AND je.entry_type = 'debit' AND je.deleted_at IS NULL`
    );
    
    const totalCashDebits = parseFloat(cashJournalEntries[0]?.total_cash_debits || 0);
    console.log(`Total Cash debits from payments: $${totalCashDebits.toFixed(2)}`);
    console.log(`Expected: $14,093.00`);
    console.log(`Match: ${Math.abs(totalCashDebits - 14093) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Check final cash balance
    const [[finalCashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    console.log(`\nFinal Cash balance: $${finalCashBalance?.current_balance || 0}`);
    
    console.log('\n✅ Payment journal entries restored successfully!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Restore failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
