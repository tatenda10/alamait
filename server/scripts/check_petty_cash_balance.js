const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking Petty Cash account balance...');
    
    // Get petty cash account balance
    const [[pettyCashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10001'"
    );
    console.log(`Current Petty Cash balance: $${pettyCashBalance?.current_balance || 0}`);
    
    // Get all journal entries for petty cash
    const [pettyCashJournals] = await conn.query(
      `SELECT je.*, t.transaction_type, t.description as transaction_desc, coa.code, coa.name as account_name
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10001' AND je.deleted_at IS NULL
       ORDER BY je.created_at`
    );
    
    console.log(`\nPetty Cash journal entries: ${pettyCashJournals.length}`);
    
    let totalDebits = 0;
    let totalCredits = 0;
    
    pettyCashJournals.forEach(je => {
      const amount = parseFloat(je.amount);
      if (je.entry_type === 'debit') {
        totalDebits += amount;
      } else {
        totalCredits += amount;
      }
      console.log(`${je.created_at}: ${je.entry_type} $${je.amount} - ${je.account_name} (${je.transaction_desc})`);
    });
    
    console.log(`\nPetty Cash Journal Summary:`);
    console.log(`Total debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total credits: $${totalCredits.toFixed(2)}`);
    console.log(`Net balance: $${(totalDebits - totalCredits).toFixed(2)}`);
    console.log(`Stored balance: $${parseFloat(pettyCashBalance?.current_balance || 0).toFixed(2)}`);
    console.log(`Match: ${Math.abs((totalDebits - totalCredits) - parseFloat(pettyCashBalance?.current_balance || 0)) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Check if there are any duplicate petty cash transactions
    const [duplicateTransactions] = await conn.query(
      `SELECT t.id, t.description, t.created_at, COUNT(je.id) as journal_count
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10001' AND je.entry_type = 'debit' AND je.deleted_at IS NULL AND t.deleted_at IS NULL
       GROUP BY t.id, t.description, t.created_at
       HAVING COUNT(je.id) > 1
       ORDER BY t.created_at`
    );
    
    if (duplicateTransactions.length > 0) {
      console.log(`\nDuplicate petty cash transactions: ${duplicateTransactions.length}`);
      duplicateTransactions.forEach(dup => {
        console.log(`  ${dup.description}: ${dup.journal_count} entries (${dup.created_at})`);
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
