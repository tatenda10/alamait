const db = require('../src/services/db');

async function find() {
  const conn = await db.getConnection();
  try {
    console.log('Finding the $20 journal entry imbalance...\n');
    
    // Get all transactions and their journal entry totals
    const [transactions] = await conn.query(`
      SELECT 
        t.id,
        t.reference,
        t.transaction_type,
        t.description,
        t.amount as transaction_amount,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as difference,
        COUNT(je.id) as journal_count
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
      GROUP BY t.id
      ORDER BY ABS(difference) DESC
      LIMIT 20
    `);
    
    console.log('Transactions with largest imbalances:\n');
    transactions.forEach(txn => {
      const diff = parseFloat(txn.difference);
      if (Math.abs(diff) > 0.01) {
        console.log(`ID: ${txn.id} | Ref: ${txn.reference}`);
        console.log(`  Type: ${txn.transaction_type} | Amount: $${txn.transaction_amount}`);
        console.log(`  Description: ${txn.description}`);
        console.log(`  Debits: $${parseFloat(txn.total_debits || 0).toFixed(2)} | Credits: $${parseFloat(txn.total_credits || 0).toFixed(2)}`);
        console.log(`  Difference: $${diff.toFixed(2)} | Journal Count: ${txn.journal_count}`);
        console.log('');
      }
    });
    
    // Check if there are any transactions with exactly $20 difference
    const [exact20] = await conn.query(`
      SELECT 
        t.id,
        t.reference,
        t.transaction_type,
        t.description,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
      GROUP BY t.id
      HAVING ABS(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
                 SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END)) = 20
    `);
    
    if (exact20.length > 0) {
      console.log('\nFound transactions with exactly $20 difference:\n');
      exact20.forEach(txn => {
        console.log(`ID: ${txn.id} | Ref: ${txn.reference}`);
        console.log(`  Type: ${txn.transaction_type}`);
        console.log(`  Description: ${txn.description}`);
        console.log(`  Debits: $${parseFloat(txn.total_debits || 0).toFixed(2)} | Credits: $${parseFloat(txn.total_credits || 0).toFixed(2)}`);
        console.log('');
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

find();

