require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function fixMissingOctoberJournalDates() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('FIXING MISSING OCTOBER JOURNAL ENTRY DATES');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    await connection.beginTransaction();

    // 1. Find the 2 invoices without transactions
    console.log('1️⃣  Finding invoices without transactions...');
    const [missingInvoices] = await connection.query(`
      SELECT 
        si.id as invoice_id,
        si.invoice_date,
        si.amount,
        si.description,
        si.reference_number,
        se.boarding_house_id,
        s.full_name as student_name
      FROM student_invoices si
      JOIN student_enrollments se ON si.enrollment_id = se.id
      JOIN students s ON si.student_id = s.id
      WHERE DATE(si.invoice_date) = '2025-10-01'
        AND si.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM transactions t
          WHERE t.deleted_at IS NULL
            AND (
              (t.reference = si.reference_number AND si.reference_number IS NOT NULL)
              OR t.description LIKE CONCAT('%', si.reference_number, '%')
              OR t.description LIKE CONCAT('%', s.full_name, '%')
            )
        )
      ORDER BY si.id
    `);

    console.log(`   Found ${missingInvoices.length} invoices without transactions`);
    if (missingInvoices.length === 0) {
      console.log('   ✅ All invoices have transactions. Nothing to fix.');
      await connection.rollback();
      return;
    }

    missingInvoices.forEach((inv, idx) => {
      console.log(`   ${idx + 1}. Invoice ID ${inv.invoice_id} | ${inv.student_name} | $${inv.amount}`);
    });
    console.log('');

    // 2. Find ALL revenue journal entries that need date updates
    // Look for entries where transaction_date is Oct 1 but created_at might still be Sept 30
    console.log('2️⃣  Finding revenue journal entries that need date updates...');
    
    const [journalEntries] = await connection.query(`
      SELECT DISTINCT
        je.id as journal_entry_id,
        je.transaction_id,
        je.account_id,
        je.entry_type,
        je.amount,
        je.created_at,
        je.boarding_house_id,
        t.transaction_date,
        t.description as transaction_description,
        t.reference as transaction_reference,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND DATE(t.transaction_date) = '2025-10-01'
        AND DATE(je.created_at) != '2025-10-01'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.entry_type = 'credit'
      ORDER BY je.id
    `);

    console.log(`   Found ${journalEntries.length} revenue journal entries with September 30 dates`);
    
    const totalAmount = journalEntries.reduce((sum, je) => sum + parseFloat(je.amount || 0), 0);
    console.log(`   Total amount: $${totalAmount.toFixed(2)}`);
    console.log(`   Expected missing: $380.00 (from 2 invoices)`);
    console.log('');
    
    if (journalEntries.length > 0) {
      console.log('   Sample entries:');
      journalEntries.slice(0, 5).forEach((je, idx) => {
        console.log(`     ${idx + 1}. JE ${je.journal_entry_id} | Txn ${je.transaction_id} | $${je.amount}`);
        console.log(`        ${je.transaction_description?.substring(0, 60)}...`);
      });
      if (journalEntries.length > 5) {
        console.log(`     ... and ${journalEntries.length - 5} more`);
      }
      console.log('');
    }

    // 3. Update ALL revenue journal entries and their transactions to October 1st
    console.log('3️⃣  Updating ALL revenue journal entries and transactions to October 1st...');
    
    const journalEntryIds = journalEntries.map(je => je.journal_entry_id);
    const transactionIds = [...new Set(journalEntries.map(je => je.transaction_id))];

    if (journalEntryIds.length > 0) {
      // Update transaction dates first
      if (transactionIds.length > 0) {
        const [txUpdate] = await connection.query(`
          UPDATE transactions
          SET transaction_date = '2025-10-01'
          WHERE id IN (?)
            AND DATE(transaction_date) = '2025-09-30'
            AND deleted_at IS NULL
        `, [transactionIds]);

        console.log(`   ✅ Updated ${txUpdate.affectedRows} transactions to 2025-10-01`);
      }

      // Update journal entry created_at dates - update all entries for these transactions
      const [jeUpdate] = await connection.query(`
        UPDATE journal_entries je
        JOIN transactions t ON je.transaction_id = t.id
        SET je.created_at = CONCAT('2025-10-01', ' ', TIME(je.created_at))
        WHERE je.transaction_id IN (?)
          AND DATE(t.transaction_date) = '2025-10-01'
          AND je.deleted_at IS NULL
          AND t.deleted_at IS NULL
      `, [transactionIds]);

      console.log(`   ✅ Updated ${jeUpdate.affectedRows} journal entries to 2025-10-01`);
      console.log('');
    } else {
      console.log('   ⚠️  No journal entries found to update');
      console.log('');
    }

    // 4. Verify
    console.log('4️⃣  Verifying updates...');
    const [verification] = await connection.query(`
      SELECT 
        COUNT(CASE WHEN DATE(je.created_at) = '2025-10-01' THEN 1 END) as october_1_entries,
        COUNT(CASE WHEN DATE(je.created_at) = '2025-09-30' THEN 1 END) as september_30_entries,
        COUNT(*) as total_entries
      FROM journal_entries je
      WHERE je.id IN (?)
        AND je.deleted_at IS NULL
    `, [journalEntryIds.length > 0 ? journalEntryIds : [0]]);

    console.log(`   Total entries checked: ${verification[0].total_entries}`);
    console.log(`   October 1 entries: ${verification[0].october_1_entries}`);
    console.log(`   September 30 entries: ${verification[0].september_30_entries}`);
    console.log('');

    if (verification[0].september_30_entries === 0) {
      console.log('✅ All updates committed successfully!\n');
      await connection.commit();
    } else {
      console.log('⚠️  Some entries still have September 30 dates');
      await connection.rollback();
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    if (connection) {
      await connection.rollback();
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    console.log('🔌 Database connection closed.');
  }
}

fixMissingOctoberJournalDates()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

