const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking for orphaned journal entries...\n');
    
    // Check for journal entries without valid transactions
    const [orphaned] = await conn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.entry_type,
        je.amount,
        je.account_id,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      LEFT JOIN transactions t ON je.transaction_id = t.id
      LEFT JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL 
      AND (t.id IS NULL OR t.deleted_at IS NOT NULL)
    `);
    
    if (orphaned.length > 0) {
      console.log(`Found ${orphaned.length} orphaned journal entries:\n`);
      orphaned.forEach(entry => {
        console.log(`JE ID: ${entry.id} | Txn ID: ${entry.transaction_id} | Type: ${entry.entry_type}`);
        console.log(`  Amount: $${entry.amount} | Account: ${entry.account_code} - ${entry.account_name}`);
        console.log('');
      });
    } else {
      console.log('No orphaned journal entries found.');
    }
    
    // Check for transactions without journal entries
    const [noJournals] = await conn.query(`
      SELECT 
        t.id,
        t.reference,
        t.transaction_type,
        t.description,
        t.amount
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
      GROUP BY t.id
      HAVING COUNT(je.id) = 0
    `);
    
    if (noJournals.length > 0) {
      console.log(`\nFound ${noJournals.length} transactions without journal entries:\n`);
      noJournals.forEach(txn => {
        console.log(`Txn ID: ${txn.id} | Ref: ${txn.reference} | Type: ${txn.transaction_type}`);
        console.log(`  Amount: $${txn.amount} | Description: ${txn.description}`);
        console.log('');
      });
    } else {
      console.log('\nNo transactions without journal entries found.');
    }
    
    // Check for journal entries with invalid account references
    const [invalidAccounts] = await conn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.account_id,
        je.entry_type,
        je.amount
      FROM journal_entries je
      LEFT JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL 
      AND coa.id IS NULL
    `);
    
    if (invalidAccounts.length > 0) {
      console.log(`\nFound ${invalidAccounts.length} journal entries with invalid account references:\n`);
      invalidAccounts.forEach(entry => {
        console.log(`JE ID: ${entry.id} | Txn ID: ${entry.transaction_id} | Account ID: ${entry.account_id}`);
        console.log(`  Type: ${entry.entry_type} | Amount: $${entry.amount}`);
        console.log('');
      });
    } else {
      console.log('\nNo journal entries with invalid account references found.');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();

