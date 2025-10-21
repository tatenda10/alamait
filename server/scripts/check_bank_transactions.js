const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking Bank account transactions...');
    
    // Get current Bank balance
    const [[bankBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10003'"
    );
    console.log(`Current Bank balance: $${bankBalance?.current_balance || 0}`);
    
    // Get all transactions affecting Bank account
    const [transactions] = await conn.query(
      `SELECT t.*, je.entry_type, je.amount as je_amount, coa.code, coa.name as account_name
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10003' AND t.deleted_at IS NULL AND je.deleted_at IS NULL
       ORDER BY t.transaction_date, t.created_at`
    );
    
    console.log(`\nTransactions affecting Bank account: ${transactions.length}`);
    transactions.forEach(t => {
      console.log(`${t.transaction_date}: ${t.description} - ${t.entry_type} $${t.je_amount} (${t.account_name})`);
    });
    
    // Get journal entries for Bank account
    const [journalEntries] = await conn.query(
      `SELECT je.*, coa.code, coa.name as account_name, t.description as transaction_desc
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10003' AND je.deleted_at IS NULL
       ORDER BY je.created_at`
    );
    
    console.log(`\nJournal entries for Bank: ${journalEntries.length}`);
    let totalDebits = 0;
    let totalCredits = 0;
    journalEntries.forEach(je => {
      if (je.entry_type === 'debit') totalDebits += parseFloat(je.amount);
      if (je.entry_type === 'credit') totalCredits += parseFloat(je.amount);
      console.log(`${je.created_at}: ${je.entry_type} $${je.amount} - ${je.account_name} (${je.transaction_desc})`);
    });
    
    console.log(`\nTotal debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total credits: $${totalCredits.toFixed(2)}`);
    console.log(`Net balance: $${(totalDebits - totalCredits).toFixed(2)}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
