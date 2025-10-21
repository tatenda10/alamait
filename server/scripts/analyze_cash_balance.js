const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Analyzing Cash balance components...');
    
    // Get all Cash journal entries
    const [allCashJournals] = await conn.query(
      `SELECT je.*, t.transaction_type, t.description as transaction_desc, coa.code, coa.name as account_name
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10002' AND je.deleted_at IS NULL
       ORDER BY je.created_at`
    );
    
    console.log(`Total Cash journal entries: ${allCashJournals.length}`);
    
    let totalDebits = 0;
    let totalCredits = 0;
    let paymentDebits = 0;
    let openingBalance = 0;
    let vaultTransfers = 0;
    let expenses = 0;
    
    allCashJournals.forEach(je => {
      const amount = parseFloat(je.amount);
      if (je.entry_type === 'debit') {
        totalDebits += amount;
        if (je.transaction_type === 'payment') {
          paymentDebits += amount;
        } else if (je.transaction_desc.includes('Balance C/F')) {
          openingBalance += amount;
        } else if (je.transaction_desc.includes('Vault')) {
          vaultTransfers += amount;
        }
      } else {
        totalCredits += amount;
        if (je.transaction_type === 'expense') {
          expenses += amount;
        } else if (je.transaction_desc.includes('Vault')) {
          vaultTransfers += amount;
        }
      }
    });
    
    console.log(`\nCash Balance Breakdown:`);
    console.log(`Total debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total credits: $${totalCredits.toFixed(2)}`);
    console.log(`Net balance: $${(totalDebits - totalCredits).toFixed(2)}`);
    console.log(`\nComponents:`);
    console.log(`  Payment debits: $${paymentDebits.toFixed(2)}`);
    console.log(`  Opening balance: $${openingBalance.toFixed(2)}`);
    console.log(`  Vault transfers: $${vaultTransfers.toFixed(2)}`);
    console.log(`  Expenses: $${expenses.toFixed(2)}`);
    
    // Check if there are multiple entries for the same payment
    const [paymentCounts] = await conn.query(
      `SELECT t.id, t.description, COUNT(je.id) as entry_count, SUM(je.amount) as total_amount
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE t.transaction_type = 'payment' AND coa.code = '10002' AND je.entry_type = 'debit' AND je.deleted_at IS NULL
       GROUP BY t.id, t.description
       HAVING COUNT(je.id) > 1 OR SUM(je.amount) != t.amount
       ORDER BY entry_count DESC
       LIMIT 10`
    );
    
    if (paymentCounts.length > 0) {
      console.log(`\nProblematic payment entries:`);
      paymentCounts.forEach(pc => {
        console.log(`  ${pc.description}: ${pc.entry_count} entries, total $${pc.total_amount}`);
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
