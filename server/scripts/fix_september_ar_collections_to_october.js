require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function fixSeptemberARCollectionsToOctober() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('FIXING SEPTEMBER ACCOUNTS RECEIVABLE COLLECTIONS TO OCTOBER 1');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Find the specific transactions that are Accounts Receivable collections in September
    // Transactions: 470, 473, 475, 482, 487, 501, 511
    const transactionIds = [470, 473, 475, 482, 487, 501, 511];

    console.log('1️⃣  Finding transactions to update...');
    const [transactions] = await connection.query(
      `SELECT 
        t.id,
        t.transaction_date,
        t.description,
        t.reference,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.name as credit_account_name
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE t.id IN (?)
        AND t.deleted_at IS NULL
        AND je_debit.deleted_at IS NULL
        AND je_credit.deleted_at IS NULL
      ORDER BY t.id`,
      [transactionIds]
    );

    console.log(`   Found ${transactions.length} transactions to check\n`);

    if (transactions.length === 0) {
      console.log('   ⚠️  No transactions found with those IDs. They may have already been updated or deleted.');
      return;
    }

    // Filter to only those that are Accounts Receivable collections (credit to 10005) in September
    const transactionsToFix = transactions.filter(t => {
      const isSeptember = t.transaction_date.startsWith('2025-09');
      const isARCollection = t.credit_account_code === '10005' && 
                            (t.debit_account_code === '10001' || t.debit_account_code === '10002' || 
                             t.debit_account_code === '10003' || t.debit_account_code === '10004');
      return isSeptember && isARCollection;
    });

    console.log(`2️⃣  Found ${transactionsToFix.length} Accounts Receivable collections in September to fix\n`);

    if (transactionsToFix.length === 0) {
      console.log('   ✅ No September AR collections found. All transactions may already be in October.');
      return;
    }

    console.log('   Transactions to update:');
    transactionsToFix.forEach((tx, index) => {
      console.log(`   ${index + 1}. Txn ${tx.id} | Date: ${tx.transaction_date} | ${tx.debit_account_code} -> ${tx.credit_account_code} | ${tx.description || tx.reference || 'N/A'}`);
    });
    console.log('');

    // Start transaction
    await connection.beginTransaction();

    // Update transaction dates to October 1, 2025
    console.log('3️⃣  Updating transaction dates to October 1, 2025...');
    const transactionIdsToUpdate = transactionsToFix.map(t => t.id);
    
    // Get the time component from each transaction to preserve it
    for (const tx of transactionsToFix) {
      const originalDate = new Date(tx.transaction_date);
      const timeComponent = originalDate.toTimeString().split(' ')[0]; // HH:MM:SS
      const newDate = `2025-10-01 ${timeComponent}`;

      await connection.query(
        `UPDATE transactions 
         SET transaction_date = ?
         WHERE id = ?`,
        [newDate, tx.id]
      );

      console.log(`   ✅ Updated transaction ${tx.id} from ${tx.transaction_date} to ${newDate}`);
    }
    console.log('');

    // Update journal entry created_at dates to match
    console.log('4️⃣  Updating journal entry created_at dates to match...');
    for (const tx of transactionsToFix) {
      const originalDate = new Date(tx.transaction_date);
      const timeComponent = originalDate.toTimeString().split(' ')[0]; // HH:MM:SS
      const newDate = `2025-10-01 ${timeComponent}`;

      // Update both debit and credit journal entries
      const [debitEntries] = await connection.query(
        `SELECT id, created_at FROM journal_entries 
         WHERE transaction_id = ? AND entry_type = 'debit' AND deleted_at IS NULL`,
        [tx.id]
      );

      const [creditEntries] = await connection.query(
        `SELECT id, created_at FROM journal_entries 
         WHERE transaction_id = ? AND entry_type = 'credit' AND deleted_at IS NULL`,
        [tx.id]
      );

      for (const entry of [...debitEntries, ...creditEntries]) {
        const entryTime = new Date(entry.created_at).toTimeString().split(' ')[0];
        const newEntryDate = `2025-10-01 ${entryTime}`;

        await connection.query(
          `UPDATE journal_entries 
           SET created_at = ?
           WHERE id = ?`,
          [newEntryDate, entry.id]
        );
      }

      console.log(`   ✅ Updated journal entries for transaction ${tx.id}`);
    }
    console.log('');

    // Verify updates
    console.log('5️⃣  Verifying updates...');
    const [verifiedTransactions] = await connection.query(
      `SELECT 
        t.id,
        t.transaction_date,
        DATE_FORMAT(t.transaction_date, '%Y-%m') as month_key
      FROM transactions t
      WHERE t.id IN (?)
        AND t.deleted_at IS NULL
      ORDER BY t.id`,
      [transactionIdsToUpdate]
    );

    let octoberCount = 0;
    let septemberCount = 0;
    verifiedTransactions.forEach(tx => {
      if (tx.month_key === '2025-10') {
        octoberCount++;
      } else if (tx.month_key === '2025-09') {
        septemberCount++;
      }
    });

    console.log(`   Total transactions checked: ${verifiedTransactions.length}`);
    console.log(`   October 2025: ${octoberCount}`);
    console.log(`   September 2025: ${septemberCount}`);
    console.log('');

    if (septemberCount === 0 && octoberCount === transactionsToFix.length) {
      await connection.commit();
      console.log('✅ All updates committed successfully!');
    } else {
      await connection.rollback();
      console.log('❌ Verification failed. Rolling back changes.');
    }

  } catch (error) {
    console.error('❌ Error in fixSeptemberARCollectionsToOctober:', error);
    if (connection) await connection.rollback();
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
    console.log('✅ Script completed successfully!');
  }
}

fixSeptemberARCollectionsToOctober();

