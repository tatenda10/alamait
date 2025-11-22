require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function updateCorrectiveJournalDate() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('UPDATING CORRECTIVE JOURNAL ENTRY DATE');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    const transactionId = 611; // The corrective journal entry transaction ID
    const newDate = '2025-09-29';
    const newDateTime = '2025-09-29 22:00:00'; // Match the time format used in other entries

    // First, verify the transaction exists
    console.log(`1️⃣  Verifying transaction ${transactionId}...\n`);
    
    const [transaction] = await connection.query(`
      SELECT 
        t.id,
        t.transaction_date,
        t.reference,
        t.description,
        COUNT(je.id) as journal_entry_count
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
      WHERE t.id = ?
        AND t.deleted_at IS NULL
      GROUP BY t.id, t.transaction_date, t.reference, t.description
    `, [transactionId]);

    if (transaction.length === 0) {
      console.log(`   ❌ Transaction ${transactionId} not found or already deleted.\n`);
      return;
    }

    const tx = transaction[0];
    console.log(`   Transaction Details:`);
    console.log(`     ID: ${tx.id}`);
    console.log(`     Current Date: ${tx.transaction_date}`);
    console.log(`     Reference: ${tx.reference || 'N/A'}`);
    console.log(`     Description: ${tx.description || 'N/A'}`);
    console.log(`     Journal Entries: ${tx.journal_entry_count}`);
    console.log('');

    // Get journal entries
    const [journalEntries] = await connection.query(`
      SELECT 
        je.id,
        je.entry_type,
        je.amount,
        je.created_at,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.transaction_id = ?
        AND je.deleted_at IS NULL
      ORDER BY je.entry_type DESC
    `, [transactionId]);

    console.log(`2️⃣  Journal Entries to be updated:\n`);
    journalEntries.forEach(je => {
      console.log(`     ${je.entry_type.toUpperCase()}: ${je.account_code} (${je.account_name}) - $${parseFloat(je.amount).toFixed(2)}`);
      console.log(`       Current created_at: ${je.created_at}`);
    });
    console.log('');

    // Update transaction and journal entries
    console.log('3️⃣  Updating dates...\n');
    
    await connection.beginTransaction();

    try {
      // Update transaction date
      const [updateTxResult] = await connection.query(`
        UPDATE transactions
        SET transaction_date = ?
        WHERE id = ?
          AND deleted_at IS NULL
      `, [newDate, transactionId]);

      console.log(`   ✅ Updated transaction date to ${newDate}`);

      // Update journal entry created_at dates
      const [updateJeResult] = await connection.query(`
        UPDATE journal_entries
        SET created_at = ?
        WHERE transaction_id = ?
          AND deleted_at IS NULL
      `, [newDateTime, transactionId]);

      console.log(`   ✅ Updated ${updateJeResult.affectedRows} journal entry dates to ${newDateTime}`);

      // Verify updates
      const [verify] = await connection.query(`
        SELECT 
          DATE(t.transaction_date) as transaction_date,
          MIN(je.created_at) as min_je_date,
          MAX(je.created_at) as max_je_date
        FROM transactions t
        LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
        WHERE t.id = ?
        GROUP BY t.id, DATE(t.transaction_date)
      `, [transactionId]);

      if (verify.length > 0) {
        const v = verify[0];
        console.log('');
        console.log(`   Verification:`);
        console.log(`     Transaction Date: ${v.transaction_date}`);
        console.log(`     Journal Entry Dates: ${v.min_je_date} to ${v.max_je_date}`);
        
        const txDateStr = v.transaction_date ? v.transaction_date.toString().split('T')[0] : '';
        const jeDateStr = v.min_je_date ? v.min_je_date.toString().substring(0, 19) : '';
        
        if (txDateStr === newDate && jeDateStr === newDateTime) {
          await connection.commit();
          console.log('');
          console.log('✅ Transaction successfully updated!');
        } else {
          await connection.rollback();
          console.log('❌ Update verification failed. Rolling back.');
          console.log(`   Expected transaction date: ${newDate}, got: ${txDateStr}`);
          console.log(`   Expected journal entry date: ${newDateTime}, got: ${jeDateStr}`);
        }
      }

    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ Update Complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error updating corrective journal entry date:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

updateCorrectiveJournalDate();

