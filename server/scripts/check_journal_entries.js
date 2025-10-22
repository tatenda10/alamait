const db = require('../src/services/db');

async function checkJournalEntries() {
  try {
    console.log('🔍 Checking journal entries for transaction 214 (EXP-REQ-3)...');
    
    // Check journal entries for transaction 214
    const [journalEntries] = await db.query(`
      SELECT 
        je.*,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        t.reference,
        t.description as transaction_description
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE je.transaction_id = 214
      ORDER BY je.id
    `);
    
    console.log('Journal Entries for Transaction 214:');
    console.table(journalEntries);
    
    // Check if the transaction exists
    const [transactions] = await db.query(`
      SELECT * FROM transactions WHERE id = 214
    `);
    
    console.log('Transaction 214:');
    console.table(transactions);
    
    // Check expenditure request status
    const [expenditureRequests] = await db.query(`
      SELECT id, title, status, amount FROM expenditure_requests WHERE id = 3
    `);
    
    console.log('Expenditure Request 3:');
    console.table(expenditureRequests);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkJournalEntries();
