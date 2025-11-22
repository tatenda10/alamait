require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function checkNovemberExpenses() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('CHECKING FOR EXPENSES CREATED IN NOVEMBER 2025');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Find expenses created in November 2025 (by journal_created_at or expense.created_at)
    console.log('1️⃣  Finding expenses created in November 2025...');
    
    // Check by journal entry created_at
    const [novemberJournals] = await connection.query(`
      SELECT 
        je.id as journal_entry_id,
        je.transaction_id,
        je.amount,
        je.created_at as journal_created_at,
        t.id as transaction_id,
        t.transaction_date,
        t.reference,
        t.description as transaction_description,
        t.status,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        bh.name as boarding_house_name,
        e.id as expense_id,
        e.expense_date,
        e.description as expense_description,
        e.reference_number as expense_reference
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      LEFT JOIN expenses e ON e.transaction_id = t.id
      WHERE je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND DATE_FORMAT(je.created_at, '%Y-%m') = '2025-11'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY je.created_at, je.id
    `);

    console.log(`   Found ${novemberJournals.length} expense journal entries created in November 2025\n`);

    if (novemberJournals.length === 0) {
      console.log('✅ No expense entries found created in November 2025');
    } else {
      console.log('   Details:');
      let totalAmount = 0;
      novemberJournals.forEach((exp, idx) => {
        totalAmount += parseFloat(exp.amount);
        console.log(`\n   ${idx + 1}. Journal Entry ${exp.journal_entry_id} | Transaction ${exp.transaction_id}`);
        console.log(`      Account: ${exp.account_code} (${exp.account_name})`);
        console.log(`      Amount: ${formatCurrency(exp.amount)}`);
        console.log(`      Boarding House: ${exp.boarding_house_name || 'N/A'}`);
        console.log(`      Transaction Date: ${exp.transaction_date}`);
        console.log(`      Journal Created At: ${exp.journal_created_at}`);
        console.log(`      Description: ${exp.transaction_description || exp.expense_description || 'N/A'}`);
        console.log(`      Reference: ${exp.reference || exp.expense_reference || 'N/A'}`);
        if (exp.expense_id) {
          console.log(`      Expense ID: ${exp.expense_id} | Expense Date: ${exp.expense_date}`);
        }
      });
      console.log(`\n   Total November Expenses: ${formatCurrency(totalAmount)}\n`);
    }

    // Also check expenses table directly
    console.log('2️⃣  Finding expenses from expenses table created in November 2025...');
    const [novemberExpenses] = await connection.query(`
      SELECT 
        e.id as expense_id,
        e.expense_date,
        e.amount,
        e.description,
        e.reference_number,
        e.payment_method,
        e.payment_status,
        e.created_at as expense_created_at,
        t.id as transaction_id,
        t.transaction_date,
        t.reference as transaction_reference,
        coa.code as account_code,
        coa.name as account_name,
        bh.name as boarding_house_name
      FROM expenses e
      LEFT JOIN transactions t ON e.transaction_id = t.id
      LEFT JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      WHERE DATE_FORMAT(e.created_at, '%Y-%m') = '2025-11'
        AND e.deleted_at IS NULL
      ORDER BY e.created_at, e.id
    `);

    console.log(`   Found ${novemberExpenses.length} expense records created in November 2025\n`);

    if (novemberExpenses.length > 0) {
      console.log('   Details:');
      let totalAmount = 0;
      novemberExpenses.forEach((exp, idx) => {
        totalAmount += parseFloat(exp.amount);
        console.log(`\n   ${idx + 1}. Expense ID ${exp.expense_id}`);
        console.log(`      Amount: ${formatCurrency(exp.amount)}`);
        console.log(`      Expense Date: ${exp.expense_date}`);
        console.log(`      Created At: ${exp.expense_created_at}`);
        console.log(`      Description: ${exp.description || 'N/A'}`);
        console.log(`      Reference: ${exp.reference_number || 'N/A'}`);
        console.log(`      Account: ${exp.account_code || 'N/A'} (${exp.account_name || 'N/A'})`);
        console.log(`      Boarding House: ${exp.boarding_house_name || 'N/A'}`);
        console.log(`      Payment Method: ${exp.payment_method || 'N/A'}`);
        if (exp.transaction_id) {
          console.log(`      Transaction ID: ${exp.transaction_id} | Transaction Date: ${exp.transaction_date}`);
        }
      });
      console.log(`\n   Total November Expenses (from expenses table): ${formatCurrency(totalAmount)}\n`);
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Expense Journal Entries Created in November: ${novemberJournals.length}`);
    console.log(`Expense Records Created in November: ${novemberExpenses.length}`);
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
checkNovemberExpenses()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

