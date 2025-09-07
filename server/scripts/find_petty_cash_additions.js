const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function findPettyCashAdditions() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Searching for petty cash additions across all tables...\n');
    
    // Check transactions table
    console.log('📊 Checking transactions table...');
    const [transactions] = await connection.query(`
      SELECT 
        id,
        transaction_type,
        reference,
        amount,
        description,
        transaction_date,
        boarding_house_id
      FROM transactions 
      WHERE (transaction_type LIKE '%petty%' OR description LIKE '%petty%' OR description LIKE '%Petty%')
      ORDER BY transaction_date DESC
    `);
    
    if (transactions.length > 0) {
      console.log(`  Found ${transactions.length} transactions with petty cash references:`);
      transactions.forEach(tx => {
        console.log(`    - ID: ${tx.id}, Type: ${tx.transaction_type}, Amount: $${tx.amount}, Description: ${tx.description}`);
      });
    } else {
      console.log('  No petty cash transactions found in transactions table');
    }
    
         // Check expenses table
     console.log('\n📊 Checking expenses table...');
     const [expenses] = await connection.query(`
       SELECT 
         id,
         amount,
         description,
         expense_date,
         boarding_house_id,
         reference
       FROM expenses 
       WHERE (description LIKE '%petty%' OR description LIKE '%Petty%')
       ORDER BY expense_date DESC
     `);
    
    if (expenses.length > 0) {
      console.log(`  Found ${expenses.length} expenses with petty cash references:`);
      expenses.forEach(exp => {
        console.log(`    - ID: ${exp.id}, Type: ${exp.expense_type}, Amount: $${exp.amount}, Description: ${exp.description}`);
      });
    } else {
      console.log('  No petty cash expenses found in expenses table');
    }
    
    // Check journal_entries table
    console.log('\n📊 Checking journal_entries table...');
    const [journalEntries] = await connection.query(`
      SELECT 
        je.id,
        je.entry_type,
        je.amount,
        je.description,
        je.created_at,
        je.boarding_house_id,
        t.transaction_type,
        t.reference,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE (je.description LIKE '%petty%' OR je.description LIKE '%Petty%' OR coa.code = '10001')
      ORDER BY je.created_at DESC
    `);
    
    if (journalEntries.length > 0) {
      console.log(`  Found ${journalEntries.length} journal entries with petty cash references:`);
      journalEntries.forEach(je => {
        console.log(`    - ID: ${je.id}, Type: ${je.entry_type}, Amount: $${je.amount}, Account: ${je.account_code} (${je.account_name}), Description: ${je.description}`);
      });
    } else {
      console.log('  No petty cash journal entries found');
    }
    
    // Check current_account_balances for Petty Cash
    console.log('\n📊 Checking Petty Cash account balance...');
    const [pettyCashBalance] = await connection.query(`
      SELECT 
        account_code,
        account_name,
        current_balance,
        total_debits,
        total_credits,
        transaction_count
      FROM current_account_balances 
      WHERE account_code = '10001'
    `);
    
    if (pettyCashBalance.length > 0) {
      const balance = pettyCashBalance[0];
      console.log(`  Petty Cash (${balance.account_code}) current balance: $${balance.current_balance}`);
      console.log(`  Total debits: $${balance.total_debits}, Total credits: $${balance.total_credits}`);
      console.log(`  Transaction count: ${balance.transaction_count}`);
    } else {
      console.log('  No Petty Cash balance found');
    }
    
    // Check if there are any transactions that increased petty cash balance
    console.log('\n🔍 Looking for transactions that increased petty cash...');
    const [increasingTransactions] = await connection.query(`
      SELECT 
        t.id,
        t.transaction_type,
        t.amount,
        t.description,
        t.transaction_date,
        je.entry_type,
        coa.code as account_code,
        coa.name as account_name
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code = '10001' AND je.entry_type = 'debit'
      ORDER BY t.transaction_date DESC
    `);
    
    if (increasingTransactions.length > 0) {
      console.log(`  Found ${increasingTransactions.length} transactions that increased petty cash:`);
      increasingTransactions.forEach(tx => {
        console.log(`    - ID: ${tx.id}, Type: ${tx.transaction_type}, Amount: $${tx.amount}, Description: ${tx.description}`);
      });
    } else {
      console.log('  No transactions found that increased petty cash balance');
    }
    
  } catch (error) {
    console.error('❌ Error searching for petty cash additions:', error);
  } finally {
    await connection.end();
  }
}

// Run the search
findPettyCashAdditions()
  .then(() => {
    console.log('\n🎉 Search completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Search failed:', error);
    process.exit(1);
  });
