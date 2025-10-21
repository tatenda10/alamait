const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Finding the source of the remaining $1,745.00 imbalance...');
    
    // Check journal entries totals
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const journalDifference = totalDebits - totalCredits;
    
    console.log(`Journal Entries:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${journalDifference.toFixed(2)}`);
    
    // Check for any remaining orphaned entries
    const [orphanedCount] = await conn.query(
      `SELECT COUNT(*) as count
       FROM journal_entries je
       LEFT JOIN transactions t ON je.transaction_id = t.id
       WHERE je.deleted_at IS NULL AND (t.id IS NULL OR t.deleted_at IS NOT NULL)`
    );
    
    console.log(`\nOrphaned journal entries: ${orphanedCount[0]?.count || 0}`);
    
    // Check for duplicate transactions
    const [duplicateTransactions] = await conn.query(
      `SELECT t.id, t.description, t.amount, t.created_at, COUNT(je.id) as journal_count
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       WHERE t.deleted_at IS NULL AND je.deleted_at IS NULL
       GROUP BY t.id, t.description, t.amount, t.created_at
       HAVING COUNT(je.id) > 2
       ORDER BY t.created_at DESC
       LIMIT 10`
    );
    
    console.log(`\nTransactions with more than 2 journal entries: ${duplicateTransactions.length}`);
    if (duplicateTransactions.length > 0) {
      console.log('Sample duplicates:');
      duplicateTransactions.slice(0, 5).forEach(dup => {
        console.log(`  ${dup.description}: $${dup.amount} (${dup.journal_count} entries) - ${dup.created_at}`);
      });
    }
    
    // Check for transactions with unbalanced journal entries
    const [unbalancedTransactions] = await conn.query(
      `SELECT t.id, t.description, t.amount, t.created_at,
              SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
              SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       WHERE t.deleted_at IS NULL AND je.deleted_at IS NULL
       GROUP BY t.id, t.description, t.amount, t.created_at
       HAVING ABS(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
                  SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END)) > 0.01
       ORDER BY ABS(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
                    SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END)) DESC
       LIMIT 10`
    );
    
    console.log(`\nTransactions with unbalanced journal entries: ${unbalancedTransactions.length}`);
    if (unbalancedTransactions.length > 0) {
      console.log('Sample unbalanced transactions:');
      unbalancedTransactions.slice(0, 5).forEach(unb => {
        const diff = parseFloat(unb.total_debits) - parseFloat(unb.total_credits);
        console.log(`  ${unb.description}: $${unb.amount} (Debits: $${unb.total_debits}, Credits: $${unb.total_credits}, Diff: $${diff.toFixed(2)}) - ${unb.created_at}`);
      });
    }
    
    // Check if there are any transactions with exactly $1,745.00
    const [exactAmount] = await conn.query(
      `SELECT t.id, t.description, t.amount, t.transaction_type, t.created_at
       FROM transactions t
       WHERE t.deleted_at IS NULL AND ABS(t.amount - 1745.00) < 0.01`
    );
    
    console.log(`\nTransactions with amount $1,745.00: ${exactAmount.length}`);
    if (exactAmount.length > 0) {
      exactAmount.forEach(tx => {
        console.log(`  ${tx.transaction_type}: ${tx.description} - $${tx.amount} (${tx.created_at})`);
      });
    }
    
    // Check for any large individual journal entries
    const [largeEntries] = await conn.query(
      `SELECT je.id, je.amount, je.entry_type, je.description, t.transaction_type, t.description as tx_desc
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE je.deleted_at IS NULL AND t.deleted_at IS NULL AND je.amount > 1000
       ORDER BY je.amount DESC
       LIMIT 10`
    );
    
    console.log(`\nLarge journal entries (>$1000): ${largeEntries.length}`);
    if (largeEntries.length > 0) {
      largeEntries.forEach(entry => {
        console.log(`  ${entry.entry_type} $${entry.amount} - ${entry.description} (${entry.tx_desc})`);
      });
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
