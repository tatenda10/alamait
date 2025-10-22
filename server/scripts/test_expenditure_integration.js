const db = require('../src/services/db');

async function testExpenditureIntegration() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Testing expenditure integration...');
    
    // Check if journal entries exist for expenditure request 3
    const [journalEntries] = await conn.query(`
      SELECT je.*, t.transaction_type, t.reference, t.description as transaction_description
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.reference LIKE 'EXP-REQ-3%'
      ORDER BY je.id
    `);
    
    console.log('Journal Entries for EXP-REQ-3:');
    console.table(journalEntries);
    
    // Check if expense record exists
    const [expenses] = await conn.query(`
      SELECT e.*, t.transaction_type, t.reference
      FROM expenses e
      JOIN transactions t ON e.transaction_id = t.id
      WHERE t.reference LIKE 'EXP-REQ-3%'
    `);
    
    console.log('Expense Records for EXP-REQ-3:');
    console.table(expenses);
    
    // Check if transaction exists
    const [transactions] = await conn.query(`
      SELECT * FROM transactions 
      WHERE reference LIKE 'EXP-REQ-3%'
    `);
    
    console.log('Transactions for EXP-REQ-3:');
    console.table(transactions);
    
    // Check expenditure request status
    const [expenditureRequests] = await conn.query(`
      SELECT * FROM expenditure_requests WHERE id = 3
    `);
    
    console.log('Expenditure Request 3:');
    console.table(expenditureRequests);
    
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    conn.release();
    process.exit(1);
  }
}

testExpenditureIntegration();
