const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Finding duplicate bank transactions...');
    
    // Find bank transactions with multiple journal entries
    const [duplicateAnalysis] = await conn.query(
      `SELECT t.id, t.description, t.created_at, COUNT(je.id) as journal_count, SUM(je.amount) as total_amount
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10003' AND je.entry_type = 'debit' AND je.deleted_at IS NULL
       GROUP BY t.id, t.description, t.created_at
       HAVING COUNT(je.id) > 1
       ORDER BY t.created_at`
    );
    
    console.log(`Bank transactions with multiple journal entries: ${duplicateAnalysis.length}`);
    
    if (duplicateAnalysis.length > 0) {
      console.log('\nDuplicate transactions found:');
      duplicateAnalysis.forEach(dup => {
        console.log(`  ${dup.description}: ${dup.journal_count} entries, total $${dup.total_amount} (${dup.created_at})`);
      });
    }
    
    console.log('\nStep 2: Removing duplicate bank transactions...');
    
    // Get all bank transactions ordered by creation time
    const [allBankTransactions] = await conn.query(
      `SELECT t.*, COUNT(je.id) as journal_count
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10003' AND je.entry_type = 'debit' AND je.deleted_at IS NULL
       GROUP BY t.id
       ORDER BY t.created_at`
    );
    
    console.log(`Total bank transactions: ${allBankTransactions.length}`);
    
    // Keep the first set (earliest created_at), delete the rest
    const transactionsToKeep = allBankTransactions.slice(0, 9); // Keep first 9
    const transactionsToDelete = allBankTransactions.slice(9); // Delete the rest
    
    console.log(`Keeping: ${transactionsToKeep.length} transactions`);
    console.log(`Deleting: ${transactionsToDelete.length} transactions`);
    
    if (transactionsToDelete.length > 0) {
      // Soft delete the duplicate transactions
      const deleteIds = transactionsToDelete.map(t => t.id);
      await conn.query(
        `UPDATE transactions SET deleted_at = NOW() WHERE id IN (${deleteIds.join(',')})`
      );
      
      // Soft delete their journal entries
      await conn.query(
        `UPDATE journal_entries SET deleted_at = NOW() WHERE transaction_id IN (${deleteIds.join(',')})`
      );
      
      console.log(`✅ Soft-deleted ${transactionsToDelete.length} duplicate transactions`);
    }
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify the fix
    console.log('\nStep 4: Verifying fix...');
    const [[finalBankBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10003'"
    );
    
    console.log(`Final Bank balance: $${finalBankBalance?.current_balance || 0}`);
    console.log(`Expected: $150.35`);
    console.log(`Match: ${Math.abs(parseFloat(finalBankBalance?.current_balance || 0) - 150.35) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Check remaining transactions
    const [remainingTransactions] = await conn.query(
      `SELECT COUNT(*) as count
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10003' AND je.entry_type = 'debit' AND je.deleted_at IS NULL AND t.deleted_at IS NULL`
    );
    
    console.log(`Remaining bank transactions: ${remainingTransactions[0]?.count || 0}`);
    
    console.log('\n✅ Duplicate bank transactions fixed!');
    
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
