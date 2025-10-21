const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking Marko\'s petty cash account...');
    
    // Get Marko's user ID and petty cash account
    const [[user]] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    const [[pettyCashAcct]] = await conn.query(
      "SELECT * FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL",
      [user.id, house.id]
    );
    
    console.log('Current Petty Cash Account:', pettyCashAcct);
    
    // Get existing transactions
    const [transactions] = await conn.query(
      "SELECT * FROM petty_cash_transactions WHERE user_id = ? AND boarding_house_id = ? ORDER BY transaction_date",
      [user.id, house.id]
    );
    
    console.log(`\nExisting transactions: ${transactions.length}`);
    transactions.forEach(t => {
      console.log(`${t.transaction_date}: ${t.description} - $${t.amount} (${t.transaction_type})`);
    });
    
    // Get journal entries for petty cash
    const [journalEntries] = await conn.query(
      `SELECT je.*, coa.code, coa.name as account_name 
       FROM journal_entries je 
       JOIN chart_of_accounts coa ON je.account_id = coa.id 
       WHERE je.account_id = ? AND je.deleted_at IS NULL 
       ORDER BY je.created_at`,
      [pettyCashAcct.id]
    );
    
    console.log(`\nJournal entries for Petty Cash: ${journalEntries.length}`);
    journalEntries.forEach(je => {
      console.log(`${je.created_at}: ${je.entry_type} $${je.amount} - ${je.account_name} (${je.description})`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
