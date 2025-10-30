const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkJournalEntries() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== CHECKING TANAKA MATEMATEMA JOURNAL ENTRIES ===\n');

    // Find the transaction
    const [transactions] = await connection.query(`
      SELECT * FROM transactions 
      WHERE student_id = 191
      AND transaction_type = 'monthly_invoice'
      AND transaction_date >= '2025-10-29'
      ORDER BY id DESC
      LIMIT 1
    `);

    if (transactions.length === 0) {
      console.log('❌ No transaction found');
      await connection.end();
      return;
    }

    const txn = transactions[0];
    console.log(`✅ Found transaction ID: ${txn.id}`);
    console.log(`   Amount: $${txn.amount}`);
    console.log(`   Date: ${txn.transaction_date}`);
    console.log(`   Description: ${txn.description}\n`);

    // Find ALL journal entries for this transaction
    const [journals] = await connection.query(`
      SELECT 
        je.id,
        je.entry_type,
        je.amount,
        je.description,
        coa.code,
        coa.name as account_name
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.transaction_id = ?
      ORDER BY je.id
    `, [txn.id]);

    if (journals.length === 0) {
      console.log('❌ NO JOURNAL ENTRIES FOUND FOR THIS TRANSACTION!\n');
      console.log('This is a problem - every transaction should have journal entries.');
    } else {
      console.log(`Found ${journals.length} journal entries:\n`);
      console.log('ID'.padEnd(8) + 'Type'.padEnd(10) + 'Account'.padEnd(35) + 'Amount');
      console.log('='.repeat(80));
      
      journals.forEach(je => {
        const id = je.id.toString().padEnd(8);
        const type = je.entry_type.padEnd(10);
        const account = `${je.code} - ${je.account_name}`.padEnd(35);
        const amount = `$${je.amount}`;
        console.log(`${id}${type}${account}${amount}`);
        if (je.description) {
          console.log(`        Description: ${je.description}`);
        }
      });
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

checkJournalEntries();

