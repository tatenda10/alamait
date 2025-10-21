const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking for duplicate payment transactions...');
    
    // Check for duplicate payment transactions
    const [duplicateTransactions] = await conn.query(
      `SELECT 
        t.description,
        t.amount,
        t.transaction_date,
        COUNT(*) as count,
        GROUP_CONCAT(t.id) as transaction_ids
      FROM transactions t
      WHERE t.transaction_type = 'payment'
        AND t.deleted_at IS NULL
      GROUP BY t.description, t.amount, t.transaction_date
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 10`
    );
    
    console.log(`Duplicate payment transactions: ${duplicateTransactions.length}`);
    if (duplicateTransactions.length > 0) {
      duplicateTransactions.forEach(dup => {
        console.log(`  ${dup.description}: $${dup.amount} (${dup.count} duplicates) - IDs: ${dup.transaction_ids}`);
      });
    }
    
    // Check total payment amount vs expected
    const [totalPayments] = await conn.query(
      `SELECT SUM(amount) as total_amount, COUNT(*) as count
       FROM transactions 
       WHERE transaction_type = 'payment' AND deleted_at IS NULL`
    );
    
    console.log(`\nTotal payment transactions: ${totalPayments[0].count}`);
    console.log(`Total payment amount: $${parseFloat(totalPayments[0].total_amount || 0).toFixed(2)}`);
    console.log(`Expected amount: $14,093.00`);
    
    // Check journal entries for payment transactions
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        COUNT(*) as count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_type = 'payment'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL`
    );
    
    console.log(`\nPayment journal entries: ${journalTotals[0].count}`);
    console.log(`Total debits: $${parseFloat(journalTotals[0].total_debits || 0).toFixed(2)}`);
    console.log(`Total credits: $${parseFloat(journalTotals[0].total_credits || 0).toFixed(2)}`);
    console.log(`Difference: $${(parseFloat(journalTotals[0].total_debits || 0) - parseFloat(journalTotals[0].total_credits || 0)).toFixed(2)}`);
    
    // Check if there are multiple journal entries per transaction
    const [multipleJournals] = await conn.query(
      `SELECT 
        t.id,
        t.description,
        t.amount,
        COUNT(je.id) as journal_count
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      WHERE t.transaction_type = 'payment'
        AND t.deleted_at IS NULL
        AND je.deleted_at IS NULL
      GROUP BY t.id, t.description, t.amount
      HAVING COUNT(je.id) > 2
      ORDER BY COUNT(je.id) DESC
      LIMIT 5`
    );
    
    console.log(`\nTransactions with more than 2 journal entries: ${multipleJournals.length}`);
    if (multipleJournals.length > 0) {
      multipleJournals.forEach(tx => {
        console.log(`  Transaction ${tx.id}: ${tx.description} - $${tx.amount} (${tx.journal_count} journal entries)`);
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
