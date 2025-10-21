const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Detailed analysis of payment journal entries...');
    
    // Check all journal entries for Cash account
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
    let nonPaymentDebits = 0;
    
    allCashJournals.forEach(je => {
      const amount = parseFloat(je.amount);
      if (je.entry_type === 'debit') {
        totalDebits += amount;
        if (je.transaction_type === 'payment') {
          paymentDebits += amount;
        } else {
          nonPaymentDebits += amount;
        }
      } else {
        totalCredits += amount;
      }
    });
    
    console.log(`\nCash Journal Summary:`);
    console.log(`Total debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total credits: $${totalCredits.toFixed(2)}`);
    console.log(`Payment debits: $${paymentDebits.toFixed(2)}`);
    console.log(`Non-payment debits: $${nonPaymentDebits.toFixed(2)}`);
    console.log(`Net balance: $${(totalDebits - totalCredits).toFixed(2)}`);
    
    // Check if there are any payment transactions with different transaction types
    const [paymentTypes] = await conn.query(
      `SELECT DISTINCT t.transaction_type, COUNT(*) as count
       FROM transactions t
       WHERE t.description LIKE '%Payment from%' AND t.deleted_at IS NULL
       GROUP BY t.transaction_type`
    );
    
    console.log(`\nPayment transaction types:`);
    paymentTypes.forEach(pt => {
      console.log(`  ${pt.transaction_type}: ${pt.count} transactions`);
    });
    
    // Check for any soft-deleted journal entries
    const [deletedJournals] = await conn.query(
      `SELECT COUNT(*) as count
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10002' AND je.deleted_at IS NOT NULL AND t.transaction_type = 'payment'`
    );
    
    console.log(`\nSoft-deleted payment journal entries: ${deletedJournals[0]?.count || 0}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
