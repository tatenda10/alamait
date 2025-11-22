require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function checkSeptemberExpenseJournals() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('CHECKING FOR SEPTEMBER EXPENSE JOURNAL ENTRIES');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // 1. Find all expense journal entries in September 2025
    console.log('1️⃣  Finding expense journal entries in September 2025...');
    const [septemberExpenses] = await connection.query(`
      SELECT 
        je.id as journal_entry_id,
        je.transaction_id,
        je.entry_type,
        je.amount,
        je.created_at as journal_created_at,
        t.id as transaction_id,
        t.transaction_type,
        t.transaction_date,
        t.reference,
        t.description as transaction_description,
        t.status,
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        bh.id as boarding_house_id,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, je.id
    `);

    console.log(`   Found ${septemberExpenses.length} expense journal entries in September 2025\n`);

    if (septemberExpenses.length === 0) {
      console.log('✅ No expense journal entries found in September 2025');
      return;
    }

    // 2. Group by date and show summary
    console.log('2️⃣  Summary by date:');
    const dateGroups = {};
    let totalAmount = 0;

    septemberExpenses.forEach(exp => {
      const date = exp.transaction_date;
      if (!dateGroups[date]) {
        dateGroups[date] = {
          count: 0,
          amount: 0,
          entries: []
        };
      }
      dateGroups[date].count++;
      dateGroups[date].amount += parseFloat(exp.amount);
      dateGroups[date].entries.push(exp);
      totalAmount += parseFloat(exp.amount);
    });

    Object.keys(dateGroups).sort().forEach(date => {
      const group = dateGroups[date];
      console.log(`   ${date}: ${group.count} entries, Total: ${formatCurrency(group.amount)}`);
    });

    console.log(`\n   Total September Expenses: ${formatCurrency(totalAmount)}\n`);

    // 3. Check for entries that might be incorrectly dated (especially September 30)
    console.log('3️⃣  Checking for potentially misdated entries (September 30)...');
    const [sept30Expenses] = await connection.query(`
      SELECT 
        je.id as journal_entry_id,
        je.transaction_id,
        je.amount,
        je.created_at as journal_created_at,
        t.transaction_date,
        t.reference,
        t.description,
        coa.name as account_name,
        coa.code as account_code,
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

    console.log(`   Found ${sept30Expenses.length} expense entries on September 30, 2025\n`);

    if (sept30Expenses.length > 0) {
      console.log('   Sample entries (first 10):');
      sept30Expenses.slice(0, 10).forEach((exp, idx) => {
        console.log(`   ${idx + 1}. JE ${exp.journal_entry_id} | Txn ${exp.transaction_id} | ${exp.account_code} (${exp.account_name})`);
        console.log(`      Amount: ${formatCurrency(exp.amount)} | ${exp.boarding_house_name || 'N/A'}`);
        console.log(`      Description: ${exp.description || 'N/A'}`);
        console.log(`      Reference: ${exp.reference || 'N/A'}`);
        console.log(`      Transaction Date: ${exp.transaction_date}`);
        console.log(`      Journal Created At: ${exp.journal_created_at}`);
        console.log('');
      });

      const sept30Total = sept30Expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      console.log(`   Total September 30 expenses: ${formatCurrency(sept30Total)}\n`);
    }

    // 4. Check for expense entries where journal_created_at differs from transaction_date
    console.log('4️⃣  Checking for date mismatches (journal_created_at vs transaction_date)...');
    const [mismatchedDates] = await connection.query(`
      SELECT 
        je.id as journal_entry_id,
        je.transaction_id,
        je.amount,
        DATE(je.created_at) as journal_date,
        DATE(t.transaction_date) as transaction_date,
        t.reference,
        t.description,
        coa.name as account_name,
        coa.code as account_code,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND DATE(je.created_at) != DATE(t.transaction_date)
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, je.id
      LIMIT 20
    `);

    console.log(`   Found ${mismatchedDates.length} entries with date mismatches\n`);

    if (mismatchedDates.length > 0) {
      console.log('   Sample mismatched entries:');
      mismatchedDates.slice(0, 10).forEach((exp, idx) => {
        console.log(`   ${idx + 1}. JE ${exp.journal_entry_id} | Txn ${exp.transaction_id}`);
        console.log(`      Transaction Date: ${exp.transaction_date}`);
        console.log(`      Journal Created At: ${exp.journal_date}`);
        console.log(`      Account: ${exp.account_code} (${exp.account_name})`);
        console.log(`      Amount: ${formatCurrency(exp.amount)}`);
        console.log('');
      });
    }

    // 5. Check for expenses by account type
    console.log('5️⃣  Expense breakdown by account:');
    const [expenseByAccount] = await connection.query(`
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        COUNT(DISTINCT je.id) as entry_count,
        COUNT(DISTINCT t.id) as transaction_count,
        SUM(je.amount) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY total_amount DESC
    `);

    console.log(`   Found expenses across ${expenseByAccount.length} expense accounts:\n`);
    expenseByAccount.forEach((acc, idx) => {
      console.log(`   ${idx + 1}. ${acc.account_code} - ${acc.account_name}`);
      console.log(`      Entries: ${acc.entry_count} | Transactions: ${acc.transaction_count} | Total: ${formatCurrency(acc.total_amount)}`);
    });

    // 6. Check for expenses by boarding house
    console.log('\n6️⃣  Expense breakdown by boarding house:');
    const [expenseByHouse] = await connection.query(`
      SELECT 
        bh.id as boarding_house_id,
        bh.name as boarding_house_name,
        COUNT(DISTINCT je.id) as entry_count,
        COUNT(DISTINCT t.id) as transaction_count,
        SUM(je.amount) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY bh.id, bh.name
      ORDER BY total_amount DESC
    `);

    console.log(`   Found expenses across ${expenseByHouse.length} boarding houses:\n`);
    expenseByHouse.forEach((house, idx) => {
      console.log(`   ${idx + 1}. ${house.boarding_house_name || 'N/A'}`);
      console.log(`      Entries: ${house.entry_count} | Transactions: ${house.transaction_count} | Total: ${formatCurrency(house.total_amount)}`);
    });

    // 7. Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total September Expense Journal Entries: ${septemberExpenses.length}`);
    console.log(`Total September Expense Amount: ${formatCurrency(totalAmount)}`);
    console.log(`September 30 Entries: ${sept30Expenses.length} (${formatCurrency(sept30Expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0))})`);
    console.log(`Date Mismatches: ${mismatchedDates.length}`);
    console.log(`Expense Accounts: ${expenseByAccount.length}`);
    console.log(`Boarding Houses: ${expenseByHouse.length}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
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
checkSeptemberExpenseJournals()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

