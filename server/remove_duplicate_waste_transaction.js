const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeDuplicateTransaction() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();
    
    console.log('\n=== REMOVING DUPLICATE WASTE MANAGEMENT TRANSACTION ===\n');

    const transactionId = 1454;

    console.log(`Removing transaction ID: ${transactionId}`);
    console.log('This transaction has journal entries with $0.00 amounts\n');

    // 1. First delete the expense record (has FK to transaction)
    const [deleteExpense] = await connection.query(
      'DELETE FROM expenses WHERE transaction_id = ?',
      [transactionId]
    );
    
    if (deleteExpense.affectedRows > 0) {
      console.log(`✅ Deleted ${deleteExpense.affectedRows} expense record(s)`);
    }

    // 2. Delete the journal entries
    const [deleteJournals] = await connection.query(
      'DELETE FROM journal_entries WHERE transaction_id = ?',
      [transactionId]
    );
    console.log(`✅ Deleted ${deleteJournals.affectedRows} journal entries`);

    // 3. Finally delete the transaction
    const [deleteTransaction] = await connection.query(
      'DELETE FROM transactions WHERE id = ?',
      [transactionId]
    );
    console.log(`✅ Deleted transaction ID ${transactionId}`);

    await connection.commit();
    
    console.log('\n✅ DUPLICATE TRANSACTION REMOVED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log('- Removed transaction 1454 (Waste collection with $0 journals)');
    console.log('- Kept transaction 1458 (Petty Cash Expense: Waste collection with $30)');
    console.log('- Cash flow expenses should now be: $2,212.60\n');

    await connection.end();
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

removeDuplicateTransaction();

