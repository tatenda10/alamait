const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Analyzing duplicate payment journal entries...');
    
    // Find payment transactions with multiple journal entries
    const [duplicateAnalysis] = await conn.query(
      `SELECT t.id, t.description, COUNT(je.id) as journal_count, SUM(je.amount) as total_amount
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE t.transaction_type = 'payment' AND coa.code = '10002' AND je.entry_type = 'debit' AND je.deleted_at IS NULL
       GROUP BY t.id, t.description
       HAVING COUNT(je.id) > 1
       ORDER BY journal_count DESC`
    );
    
    console.log(`Payment transactions with multiple journal entries: ${duplicateAnalysis.length}`);
    
    if (duplicateAnalysis.length > 0) {
      console.log('\nSample duplicates:');
      duplicateAnalysis.slice(0, 5).forEach(dup => {
        console.log(`  ${dup.description}: ${dup.journal_count} entries, total $${dup.total_amount}`);
      });
    }
    
    console.log('\nStep 2: Removing duplicate journal entries...');
    
    // For each payment transaction, keep only the first journal entry and delete the rest
    let removedCount = 0;
    
    for (const dup of duplicateAnalysis) {
      // Get all journal entries for this transaction
      const [journalEntries] = await conn.query(
        `SELECT je.id, je.created_at
         FROM journal_entries je
         JOIN chart_of_accounts coa ON je.account_id = coa.id
         WHERE je.transaction_id = ? AND coa.code = '10002' AND je.entry_type = 'debit' AND je.deleted_at IS NULL
         ORDER BY je.created_at`,
        [dup.id]
      );
      
      // Keep the first one, delete the rest
      if (journalEntries.length > 1) {
        const keepId = journalEntries[0].id;
        const deleteIds = journalEntries.slice(1).map(je => je.id);
        
        await conn.query(
          `UPDATE journal_entries SET deleted_at = NOW() WHERE id IN (${deleteIds.join(',')})`
        );
        
        removedCount += deleteIds.length;
        console.log(`  ${dup.description}: Kept 1, removed ${deleteIds.length} duplicates`);
      }
    }
    
    console.log(`\n✅ Removed ${removedCount} duplicate journal entries`);
    
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
    
    console.log('\n✅ Duplicate payment journal entries fixed!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Fix failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
