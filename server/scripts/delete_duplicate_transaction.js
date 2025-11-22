require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function deleteDuplicateTransaction() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('DELETING DUPLICATE TRANSACTION');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    const transactionIdToDelete = 416; // Anita Gwenda duplicate

    // First, verify the transaction exists and get details
    console.log(`1️⃣  Verifying transaction ${transactionIdToDelete}...\n`);
    
    const [transaction] = await connection.query(`
      SELECT 
        t.id,
        t.transaction_date,
        t.description,
        t.reference,
        t.amount,
        COUNT(je.id) as journal_entry_count
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
      WHERE t.id = ?
        AND t.deleted_at IS NULL
      GROUP BY t.id
    `, [transactionIdToDelete]);

    if (transaction.length === 0) {
      console.log(`   ❌ Transaction ${transactionIdToDelete} not found or already deleted.\n`);
      return;
    }

    const tx = transaction[0];
    console.log(`   Transaction Details:`);
    console.log(`     ID: ${tx.id}`);
    console.log(`     Date: ${tx.transaction_date}`);
    console.log(`     Description: ${tx.description || 'N/A'}`);
    console.log(`     Reference: ${tx.reference || 'N/A'}`);
    console.log(`     Amount: $${parseFloat(tx.amount || 0).toFixed(2)}`);
    console.log(`     Journal Entries: ${tx.journal_entry_count}`);
    console.log('');

    // Get journal entries for this transaction
    const [journalEntries] = await connection.query(`
      SELECT 
        je.id,
        je.entry_type,
        je.amount,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.transaction_id = ?
        AND je.deleted_at IS NULL
      ORDER BY je.entry_type DESC
    `, [transactionIdToDelete]);

    console.log(`2️⃣  Journal Entries to be deleted:\n`);
    journalEntries.forEach(je => {
      console.log(`     ${je.entry_type.toUpperCase()}: ${je.account_code} (${je.account_name}) - $${parseFloat(je.amount).toFixed(2)}`);
    });
    console.log('');

    // Confirm deletion
    console.log('3️⃣  Proceeding with deletion...\n');
    
    await connection.beginTransaction();

    try {
      // Soft delete journal entries
      const [deleteJeResult] = await connection.query(`
        UPDATE journal_entries
        SET deleted_at = NOW()
        WHERE transaction_id = ?
          AND deleted_at IS NULL
      `, [transactionIdToDelete]);

      console.log(`   ✅ Soft deleted ${deleteJeResult.affectedRows} journal entries`);

      // Soft delete transaction
      const [deleteTxResult] = await connection.query(`
        UPDATE transactions
        SET deleted_at = NOW()
        WHERE id = ?
          AND deleted_at IS NULL
      `, [transactionIdToDelete]);

      console.log(`   ✅ Soft deleted transaction ${transactionIdToDelete}`);

      // Verify deletion
      const [verify] = await connection.query(`
        SELECT COUNT(*) as count
        FROM transactions
        WHERE id = ? AND deleted_at IS NULL
      `, [transactionIdToDelete]);

      if (verify[0].count === 0) {
        await connection.commit();
        console.log('');
        console.log('✅ Transaction successfully deleted!');
        console.log('');
        console.log('   Note: This was a soft delete (deleted_at timestamp set).');
        console.log('   The transaction and journal entries are still in the database');
        console.log('   but will not appear in reports or queries.');
      } else {
        await connection.rollback();
        console.log('❌ Deletion verification failed. Rolling back.');
      }

    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ Deletion Complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in deleteDuplicateTransaction:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

deleteDuplicateTransaction();

