const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function updatePreviousBalanceDates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    const targetDate = '2025-09-30';
    console.log(`📅 Updating all previous balance transactions to date: ${targetDate}\n`);

    // Find all previous balance transactions
    const [transactions] = await connection.query(
      `SELECT id, student_id, amount, reference, description, 
              transaction_date, created_at
       FROM transactions 
       WHERE transaction_type = 'previous_balance'
         AND deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    if (transactions.length === 0) {
      console.log('ℹ️  No previous balance transactions found.');
      await connection.rollback();
      return;
    }

    console.log(`Found ${transactions.length} previous balance transaction(s):\n`);
    transactions.forEach((t, idx) => {
      console.log(`${idx + 1}. Transaction ID: ${t.id}`);
      console.log(`   Student ID: ${t.student_id}`);
      console.log(`   Amount: ${t.amount}`);
      console.log(`   Current Date: ${t.transaction_date}`);
      console.log(`   Reference: ${t.reference}\n`);
    });

    // Update transaction dates
    console.log('🔄 Updating transaction dates...\n');
    const [updateTransactions] = await connection.query(
      `UPDATE transactions 
       SET transaction_date = ?
       WHERE transaction_type = 'previous_balance'
         AND deleted_at IS NULL`,
      [targetDate]
    );

    console.log(`✅ Updated ${updateTransactions.affectedRows} transaction(s) to date: ${targetDate}\n`);

    // Get all transaction IDs that were updated
    const [updatedTransactions] = await connection.query(
      `SELECT id FROM transactions 
       WHERE transaction_type = 'previous_balance'
         AND deleted_at IS NULL`
    );

    const transactionIds = updatedTransactions.map(t => t.id);

    if (transactionIds.length === 0) {
      console.log('⚠️  No transaction IDs found to update journal entries.');
      await connection.rollback();
      return;
    }

    // Update journal entries created_at to match the transaction date
    // We'll set created_at to the target date (2025-09-30 00:00:00)
    console.log('🔄 Updating journal entries dates...\n');
    
    const placeholders = transactionIds.map(() => '?').join(',');
    const [updateJournals] = await connection.query(
      `UPDATE journal_entries 
       SET created_at = ?
       WHERE transaction_id IN (${placeholders})
         AND deleted_at IS NULL`,
      [targetDate + ' 00:00:00', ...transactionIds]
    );

    console.log(`✅ Updated ${updateJournals.affectedRows} journal entry/entries to date: ${targetDate}\n`);

    // Update student invoices dates if they exist
    console.log('🔄 Updating student invoice dates...\n');
    
    // Get student IDs from transactions
    const [studentTransactions] = await connection.query(
      `SELECT DISTINCT student_id FROM transactions 
       WHERE transaction_type = 'previous_balance'
         AND deleted_at IS NULL
         AND student_id IS NOT NULL`
    );

    const studentIds = studentTransactions.map(st => st.student_id);
    
    if (studentIds.length > 0) {
      const studentPlaceholders = studentIds.map(() => '?').join(',');
      const [updateInvoices] = await connection.query(
        `UPDATE student_invoices 
         SET invoice_date = ?
         WHERE student_id IN (${studentPlaceholders})
           AND description LIKE '%Previous balance%'
           AND deleted_at IS NULL`,
        [targetDate, ...studentIds]
      );

      console.log(`✅ Updated ${updateInvoices.affectedRows} student invoice(s) to date: ${targetDate}\n`);
    }

    // Verify the updates
    console.log('🔍 Verifying updates...\n');
    const [verifyTransactions] = await connection.query(
      `SELECT t.id, t.transaction_date, COUNT(je.id) as journal_count
       FROM transactions t
       LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
       WHERE t.transaction_type = 'previous_balance'
         AND t.deleted_at IS NULL
       GROUP BY t.id, t.transaction_date
       ORDER BY t.id`
    );

    console.log('Verification Results:\n');
    verifyTransactions.forEach(t => {
      console.log(`Transaction ID: ${t.id}`);
      console.log(`  Date: ${t.transaction_date}`);
      console.log(`  Journal Entries: ${t.journal_count}\n`);
    });

    await connection.commit();
    
    console.log('✅ Successfully updated all previous balance transactions and journal entries!\n');
    console.log('Summary:');
    console.log(`- Transactions updated: ${updateTransactions.affectedRows}`);
    console.log(`- Journal entries updated: ${updateJournals.affectedRows}`);
    console.log(`- Target date: ${targetDate}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

// Run the script
updatePreviousBalanceDates();

