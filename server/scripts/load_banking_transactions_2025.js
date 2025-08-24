const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'alamait',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function loadBankingTransactions2025() {
  let connection;
  
  try {
    console.log('🚀 Starting Banking Transactions 2025 Data Load...');
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const userId = 1;
    const boardingHouseId = 4;

    // Account mappings
    const accountMappings = {
      'Bank Charges': '50013', // Administrative Expenses
      'M&W Rentals': '50002', // Utilities - Water
      'Wifi Payment': '50008', // Communication Cost
      'Sanitary Payment': '50009', // Sanitary
      'Security Payment': '50011', // Security Costs
      'April Sanitary Payment': '50009', // Sanitary
      'Additional Electricity': '50003', // Utilities - Electricity
      'Insurance': '50013', // Administrative Expenses
      'Electricity': '50003', // Utilities - Electricity
      'Charges': '50013' // Administrative Expenses
    };

    // Get expense accounts
    const expenseAccounts = {};
    for (const [expenseName, accountCode] of Object.entries(accountMappings)) {
      let [account] = await connection.execute(
        'SELECT id, name FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        [accountCode]
      );
      if (account.length === 0) {
        throw new Error(`Account with code ${accountCode} not found`);
      }
      expenseAccounts[expenseName] = { id: account[0].id, name: account[0].name, code: accountCode };
    }

    // Get chart accounts
    let [bankAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10003'] // CBZ Bank Account
    );
    
    let [pettyCashChartAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10001'] // Petty Cash
    );

    let [otherIncomeAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['40002'] // Other Income
    );

    // Banking transactions data (excluding "Rentals Received")
    const expenses = [
      // March 2025
      { date: '2025-03-11', description: 'Bank Charges', amount: 80.50, category: 'Bank Charges' },
      { date: '2025-03-24', description: 'M&W Rentals', amount: 2000.00, category: 'M&W Rentals' },
      { date: '2025-03-24', description: 'Bank Charges', amount: 70.00, category: 'Bank Charges' },
      { date: '2025-03-27', description: 'Wifi Payment', amount: 97.88, category: 'Wifi Payment' },
      { date: '2025-03-27', description: 'Bank Charges', amount: 6.76, category: 'Bank Charges' },
      
      // April 2025
      { date: '2025-04-01', description: 'Sanitary Payment', amount: 135.00, category: 'Sanitary Payment' },
      { date: '2025-04-01', description: 'Bank Charges', amount: 4.73, category: 'Bank Charges' },
      { date: '2025-04-28', description: 'Security Payment', amount: 185.00, category: 'Security Payment' },
      { date: '2025-04-28', description: 'Wifi Payment', amount: 99.00, category: 'Wifi Payment' },
      { date: '2025-04-28', description: 'Bank Charges', amount: 5.01, category: 'Bank Charges' },
      
      // May 2025
      { date: '2025-05-02', description: 'April Sanitary Payment', amount: 90.00, category: 'April Sanitary Payment' },
      { date: '2025-05-02', description: 'Bank Charges', amount: 3.15, category: 'Bank Charges' },
      { date: '2025-05-25', description: 'Additional Electricity', amount: 25.00, category: 'Additional Electricity' },
      { date: '2025-05-25', description: 'Bank Charges', amount: 1.00, category: 'Bank Charges' },
      
      // June 2025
      { date: '2025-06-02', description: 'Wifi', amount: 99.00, category: 'Wifi Payment' },
      { date: '2025-06-02', description: 'Insurance', amount: 348.00, category: 'Insurance' },
      { date: '2025-06-02', description: 'Sanitary Payment', amount: 90.00, category: 'Sanitary Payment' },
      { date: '2025-06-02', description: 'Electricity', amount: 200.00, category: 'Electricity' },
      { date: '2025-06-02', description: 'Charges', amount: 29.48, category: 'Charges' }
    ];

    const income = [
      // March 2025
      { date: '2025-03-13', description: 'Zimnat Claim funds', amount: 1989.02, category: 'Other Income' },
      
      // May 2025
      { date: '2025-05-03', description: 'Transfer from Innbucks', amount: 0.24, category: 'Other Income' }
    ];

    const pettyCashFunding = [
      // March 2025
      { date: '2025-03-11', amount: 2300.00, description: 'Cash Withdrawal: Funds to Petty Cash' }
    ];

    // Create expenses
    console.log('\n💸 Creating banking expenses...');
    for (const expense of expenses) {
      const account = expenseAccounts[expense.category];
      const reference = `BANK-EXP-${expense.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create transaction
      let [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['expense', expense.date, reference, expense.amount, 'USD', `Banking expense: ${expense.description}`, boardingHouseId, userId, 'posted']);

      // Create expense record
      await connection.execute(`
        INSERT INTO expenses (expense_date, amount, description, total_amount, remaining_balance, payment_method, payment_status, expense_account_id, boarding_house_id, reference_number, notes, transaction_id, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [expense.date, expense.amount, expense.description, expense.amount, expense.amount, 'bank_transfer', 'full', account.id, boardingHouseId, reference, `Banking transaction 2025`, transactionResult.insertId, userId]);

      // Create journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, account.id, 'debit', expense.amount, `Banking expense: ${expense.description}`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, bankAccount[0].id, 'credit', expense.amount, `Banking expense payment: ${expense.description}`, boardingHouseId, userId]);

      console.log(`  ✅ Created banking expense: ${expense.description} - $${expense.amount}`);
    }

    // Create income
    console.log('\n💰 Creating banking income...');
    for (const incomeItem of income) {
      const reference = `BANK-INC-${incomeItem.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create transaction
      let [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['income', incomeItem.date, reference, incomeItem.amount, 'USD', `Banking income: ${incomeItem.description}`, boardingHouseId, userId, 'posted']);

      // Create journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, bankAccount[0].id, 'debit', incomeItem.amount, `Banking income: ${incomeItem.description}`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, otherIncomeAccount[0].id, 'credit', incomeItem.amount, `Banking income: ${incomeItem.description}`, boardingHouseId, userId]);

      console.log(`  ✅ Created banking income: ${incomeItem.description} - $${incomeItem.amount}`);
    }

    // Create petty cash funding
    console.log('\n💳 Creating petty cash funding from bank...');
    for (const funding of pettyCashFunding) {
      const reference = `BANK-PCF-${funding.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create transaction
      let [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['petty_cash_funding', funding.date, reference, funding.amount, 'USD', `Bank to petty cash funding`, boardingHouseId, userId, 'posted']);

      // Journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, pettyCashChartAccount[0].id, 'debit', funding.amount, `Bank to petty cash funding`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, bankAccount[0].id, 'credit', funding.amount, `Bank to petty cash funding`, boardingHouseId, userId]);

      console.log(`  ✅ Created bank to petty cash funding: $${funding.amount}`);
    }

    await connection.commit();
    console.log('\n🎉 Banking transactions 2025 data load completed successfully!');

    // Summary
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalPettyCashFunding = pettyCashFunding.reduce((sum, f) => sum + f.amount, 0);

    console.log('\n📊 Summary:');
    console.log(`  - Total expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`  - Total income: $${totalIncome.toFixed(2)}`);
    console.log(`  - Total petty cash funding: $${totalPettyCashFunding.toFixed(2)}`);
    console.log(`  - Net bank outflow: $${(totalExpenses + totalPettyCashFunding - totalIncome).toFixed(2)}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  loadBankingTransactions2025()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { loadBankingTransactions2025 };
