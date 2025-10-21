const db = require('../src/services/db');

async function deleteOrphaned() {
  const conn = await db.getConnection();
  try {
    console.log('Deleting orphaned journal entry...\n');
    
    // First, let's see the details of the orphaned entry
    const [[orphaned]] = await conn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.entry_type,
        je.amount,
        je.account_id,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      LEFT JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.id = 683
    `);
    
    if (orphaned) {
      console.log('Orphaned entry details:');
      console.log(`  ID: ${orphaned.id}`);
      console.log(`  Transaction ID: ${orphaned.transaction_id}`);
      console.log(`  Type: ${orphaned.entry_type}`);
      console.log(`  Amount: $${orphaned.amount}`);
      console.log(`  Account: ${orphaned.account_code} - ${orphaned.account_name}`);
      console.log('');
      
      // Delete the orphaned entry
      await conn.query(
        'UPDATE journal_entries SET deleted_at = NOW() WHERE id = ?',
        [orphaned.id]
      );
      
      console.log('✅ Deleted orphaned journal entry #683');
      
      // Recalculate balances
      console.log('\nRecalculating account balances...');
      const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');
      await recalculateAllAccountBalances();
      
      console.log('✅ Recalculated all account balances');
      
    } else {
      console.log('Orphaned entry not found.');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

deleteOrphaned();

