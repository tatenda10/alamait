const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Finding orphaned journal entries...');
    
    // Find orphaned journal entries
    const [orphanedEntries] = await conn.query(
      `SELECT je.id, je.transaction_id, je.amount, je.entry_type, je.description
       FROM journal_entries je
       LEFT JOIN transactions t ON je.transaction_id = t.id
       WHERE je.deleted_at IS NULL AND (t.id IS NULL OR t.deleted_at IS NOT NULL)`
    );
    
    console.log(`Found ${orphanedEntries.length} orphaned journal entries`);
    
    if (orphanedEntries.length === 0) {
      console.log('✅ No orphaned journal entries found!');
      conn.release();
      process.exit(0);
    }
    
    console.log('\nOrphaned entries:');
    let totalOrphanedAmount = 0;
    orphanedEntries.forEach(entry => {
      totalOrphanedAmount += parseFloat(entry.amount);
      console.log(`  ID ${entry.id}: ${entry.entry_type} $${entry.amount} - ${entry.description}`);
    });
    
    console.log(`\nTotal orphaned amount: $${totalOrphanedAmount.toFixed(2)}`);
    
    console.log('\nStep 2: Removing orphaned journal entries...');
    
    // Soft delete orphaned journal entries
    const orphanedIds = orphanedEntries.map(entry => entry.id);
    const [deleteResult] = await conn.query(
      `UPDATE journal_entries SET deleted_at = NOW() WHERE id IN (${orphanedIds.join(',')})`
    );
    
    console.log(`✅ Soft-deleted ${deleteResult.affectedRows} orphaned journal entries`);
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    console.log('\nStep 4: Verifying balance...');
    
    // Check journal entries totals again
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;
    
    console.log(`Journal Entries Totals:`);
    console.log(`Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`Difference: $${difference.toFixed(2)}`);
    console.log(`Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Orphaned journal entries cleaned up!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Cleanup failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
