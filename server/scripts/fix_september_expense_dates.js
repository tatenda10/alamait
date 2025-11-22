require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function fixSeptemberExpenseDates() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('FIXING SEPTEMBER 30 EXPENSE JOURNAL ENTRIES TO OCTOBER 1');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    await connection.beginTransaction();

    // 1. Find all expense journal entries with September 30 dates
    console.log('1️⃣  Finding expense journal entries with September 30 dates...');
    const [septemberExpenses] = await connection.query(`
      SELECT 
        je.id as journal_entry_id,
        je.transaction_id,
        je.amount,
        je.created_at as journal_created_at,
        t.id as transaction_id,
        t.transaction_date,
        t.reference,
        t.description,
        coa.code as account_code,
        coa.name as account_name,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND DATE(t.transaction_date) = '2025-09-30'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, je.id
    `);

    console.log(`   Found ${septemberExpenses.length} expense journal entries on September 30, 2025\n`);

    if (septemberExpenses.length === 0) {
      console.log('✅ No expense entries found on September 30. Nothing to fix.');
      await connection.rollback();
      return;
    }

    // Show what we found
    console.log('   Entries to be updated:');
    let totalAmount = 0;
    septemberExpenses.forEach((exp, idx) => {
      totalAmount += parseFloat(exp.amount);
      console.log(`   ${idx + 1}. JE ${exp.journal_entry_id} | Txn ${exp.transaction_id} | ${exp.account_code} (${exp.account_name})`);
      console.log(`      Amount: ${formatCurrency(exp.amount)} | ${exp.boarding_house_name || 'N/A'}`);
      console.log(`      Description: ${exp.description || 'N/A'}`);
      console.log(`      Current Date: ${exp.transaction_date}`);
      console.log('');
    });
    console.log(`   Total amount: ${formatCurrency(totalAmount)}\n`);

    // 2. Get unique transaction IDs
    const uniqueTransactionIds = [...new Set(septemberExpenses.map(e => e.transaction_id))];
    console.log(`2️⃣  Found ${uniqueTransactionIds.length} unique transactions to update\n`);

    // 3. Update transaction dates to October 1, 2025
    console.log('3️⃣  Updating transaction dates to October 1, 2025...');
    const [updateTransactionsResult] = await connection.query(`
      UPDATE transactions t
      SET t.transaction_date = '2025-10-01 00:00:00'
      WHERE t.id IN (?)
        AND DATE(t.transaction_date) = '2025-09-30'
        AND t.deleted_at IS NULL
    `, [uniqueTransactionIds]);

    console.log(`   ✅ Updated ${updateTransactionsResult.affectedRows} transactions to 2025-10-01\n`);

    // 4. Update journal entry created_at dates to match transaction dates (preserving time)
    console.log('4️⃣  Updating journal entry created_at dates to match transaction dates...');
    const [updateJournalsResult] = await connection.query(`
      UPDATE journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      SET je.created_at = CONCAT(DATE(t.transaction_date), ' ', TIME(je.created_at))
      WHERE je.entry_type = 'debit'
        AND je.transaction_id IN (?)
        AND DATE(t.transaction_date) = '2025-10-01'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [uniqueTransactionIds]);

    console.log(`   ✅ Updated ${updateJournalsResult.affectedRows} journal entries to match October 1 dates\n`);

    // 5. Verify the updates
    console.log('5️⃣  Verifying updates...');
    const [verifyExpenses] = await connection.query(`
      SELECT 
        je.id as journal_entry_id,
        je.transaction_id,
        DATE(t.transaction_date) as transaction_date,
        DATE(je.created_at) as journal_date,
        je.amount,
        coa.name as account_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND je.transaction_id IN (?)
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, je.id
    `, [uniqueTransactionIds]);

    const october1Count = verifyExpenses.filter(e => e.transaction_date === '2025-10-01').length;
    const september30Count = verifyExpenses.filter(e => e.transaction_date === '2025-09-30').length;

    console.log(`   Total entries checked: ${verifyExpenses.length}`);
    console.log(`   October 1 entries: ${october1Count}`);
    console.log(`   September 30 entries: ${september30Count}`);

    if (september30Count > 0) {
      console.log(`   ⚠️  Warning: ${september30Count} entries still have September 30 dates!`);
    }

    // Commit the transaction
    await connection.commit();
    console.log('\n✅ All updates committed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (connection) {
      await connection.rollback();
      console.log('❌ Transaction rolled back');
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// Run the script
fixSeptemberExpenseDates()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

