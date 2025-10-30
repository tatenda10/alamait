const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkWasteManagementJournals() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== CHECKING WASTE MANAGEMENT TRANSACTIONS ===\n');

    // Get both waste management transactions
    const transactionIds = [1454, 1458];

    for (const txnId of transactionIds) {
      const [transaction] = await connection.query(
        'SELECT * FROM transactions WHERE id = ?',
        [txnId]
      );

      if (transaction.length > 0) {
        const txn = transaction[0];
        console.log(`Transaction ID: ${txn.id}`);
        console.log(`Date: ${txn.transaction_date}`);
        console.log(`Amount: $${txn.amount}`);
        console.log(`Description: ${txn.description}`);
        console.log(`Type: ${txn.transaction_type}`);

        // Get journal entries for this transaction
        const [journals] = await connection.query(
          `SELECT 
            je.id,
            je.entry_type,
            je.amount,
            coa.code,
            coa.name
          FROM journal_entries je
          JOIN chart_of_accounts coa ON je.account_id = coa.id
          WHERE je.transaction_id = ?`,
          [txnId]
        );

        console.log(`Journal Entries: ${journals.length}`);
        if (journals.length > 0) {
          journals.forEach(je => {
            console.log(`  - ${je.entry_type.toUpperCase()}: ${je.code} - ${je.name} | $${je.amount}`);
          });
        } else {
          console.log('  ⚠️  NO JOURNAL ENTRIES FOUND!');
        }
        console.log('='.repeat(80));
        console.log('');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

checkWasteManagementJournals();

