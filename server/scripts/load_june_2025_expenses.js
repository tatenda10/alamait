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

async function loadJune2025Expenses() {
  let connection;
  
  try {
    console.log('🚀 Starting June 2025 Expense Data Load...');
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const userId = 1;
    const boardingHouseId = 4;

    // Account mappings
    const accountMappings = {
      'Water Refill': '50002',
      'Firewood': '50013',
      'Security': '50011',
      'Gas': '50007',
      'Cleaning supplies': '50010',
      'Waste collection': '50019',
      'Solar call out': '50001',
      'Fuel for Generator': '50007',
      'Petty cash water reimbursment': '50002'
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

    // Get petty cash account
    let [pettyCashAccount] = await connection.execute(
      'SELECT id FROM petty_cash_accounts WHERE boarding_house_id = ?',
      [boardingHouseId]
    );
    
    if (pettyCashAccount.length === 0) {
      const [result] = await connection.execute(
        `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_inflows, total_outflows, created_at)
         VALUES (?, 0, 0, 0, NOW())`,
        [boardingHouseId]
      );
      pettyCashAccount = [{ id: result.insertId }];
    }

    // Get chart accounts
    let [pettyCashChartAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10001']
    );
    
    let [vaultAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10002']
    );

    // June 2025 data
    const expenses = [
      { date: '2025-06-06', description: 'Gas', amount: 192.00, category: 'Gas' },
      { date: '2025-06-05', description: 'Security', amount: 450.00, category: 'Security' },
      { date: '2025-06-09', description: 'Cleaning supplies', amount: 70.00, category: 'Cleaning supplies' },
      { date: '2025-06-04', description: 'water refill', amount: 250.00, category: 'Water Refill' },
      { date: '2025-06-04', description: 'Firewood', amount: 40.00, category: 'Firewood' },
      { date: '2025-06-09', description: 'water refill', amount: 200.00, category: 'Water Refill' },
      { date: '2025-06-16', description: 'water refill', amount: 150.00, category: 'Water Refill' },
      { date: '2025-06-16', description: 'Firewood', amount: 40.00, category: 'Firewood' },
      { date: '2025-06-16', description: 'Waste collection', amount: 30.00, category: 'Waste collection' },
      { date: '2025-06-25', description: 'Water refill', amount: 150.00, category: 'Water Refill' },
      { date: '2025-06-23', description: 'Solar call out', amount: 50.00, category: 'Solar call out' },
      { date: '2025-06-23', description: 'Fuel for Generator', amount: 30.00, category: 'Fuel for Generator' }
    ];

    const pettyCashFunding = [
      { date: '2025-06-03', amount: 1032.00, description: 'Petty Cash funding' },
      { date: '2025-06-03', amount: 150.00, description: 'Petty cash water reimbursment' },
      { date: '2025-06-09', amount: 200.00, description: 'Petty Cash funding' },
      { date: '2025-06-16', amount: 190.00, description: 'Petty cash funding' },
      { date: '2025-06-23', amount: 240.00, description: 'Petty Cash funding' }
    ];

    const pettyCashWithdrawals = [
      { date: '2025-05-02', amount: 370.00, description: 'Rental submitted to vault' }
    ];

    // Create expenses
    console.log('\n💸 Creating expenses...');
    for (const expense of expenses) {
      const account = expenseAccounts[expense.category];
      const reference = `EXP-${expense.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create transaction
      let [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['expense', expense.date, reference, expense.amount, 'USD', `Expense: ${expense.description}`, boardingHouseId, userId, 'posted']);

      // Create expense record
      await connection.execute(`
        INSERT INTO expenses (expense_date, amount, description, total_amount, remaining_balance, payment_method, payment_status, expense_account_id, boarding_house_id, reference_number, notes, transaction_id, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [expense.date, expense.amount, expense.description, expense.amount, expense.amount, 'petty_cash', 'full', account.id, boardingHouseId, reference, `June 2025 expense`, transactionResult.insertId, userId]);

      // Create journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, account.id, 'debit', expense.amount, `Expense: ${expense.description}`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, pettyCashChartAccount[0].id, 'credit', expense.amount, `Expense payment: ${expense.description}`, boardingHouseId, userId]);

      // Create petty cash transaction
      await connection.execute(`
        INSERT INTO petty_cash_transactions (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [boardingHouseId, 'expense', expense.amount, `Expense: ${expense.description}`, reference, `June 2025 expense`, expense.date, userId]);

      console.log(`  ✅ Created expense: ${expense.description} - $${expense.amount}`);
    }

    // Create petty cash funding
    console.log('\n💰 Creating petty cash funding...');
    for (const funding of pettyCashFunding) {
      const reference = `PCF-${funding.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['petty_cash_funding', funding.date, reference, funding.amount, 'USD', `Petty cash funding`, boardingHouseId, userId, 'posted']);

      // Journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, pettyCashChartAccount[0].id, 'debit', funding.amount, `Petty cash funding`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, vaultAccount[0].id, 'credit', funding.amount, `Petty cash funding`, boardingHouseId, userId]);

      // Petty cash transaction
      await connection.execute(`
        INSERT INTO petty_cash_transactions (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [boardingHouseId, 'cash_inflow', funding.amount, `Petty cash funding`, reference, `June 2025 petty cash funding`, funding.date, userId]);

      console.log(`  ✅ Created petty cash funding: $${funding.amount}`);
    }

    // Create petty cash withdrawals
    console.log('\n💳 Creating petty cash withdrawals...');
    for (const withdrawal of pettyCashWithdrawals) {
      const reference = `PCW-${withdrawal.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['petty_cash_withdrawal', withdrawal.date, reference, withdrawal.amount, 'USD', `Petty cash withdrawal`, boardingHouseId, userId, 'posted']);

      // Journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, vaultAccount[0].id, 'debit', withdrawal.amount, `Petty cash withdrawal`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, pettyCashChartAccount[0].id, 'credit', withdrawal.amount, `Petty cash withdrawal`, boardingHouseId, userId]);

      // Petty cash transaction
      await connection.execute(`
        INSERT INTO petty_cash_transactions (boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [boardingHouseId, 'withdrawal', withdrawal.amount, `Petty cash withdrawal`, reference, `June 2025 petty cash withdrawal`, withdrawal.date, userId]);

      console.log(`  ✅ Created petty cash withdrawal: $${withdrawal.amount}`);
    }

    // Update petty cash balance
    const totalFunding = pettyCashFunding.reduce((sum, f) => sum + f.amount, 0);
    const totalWithdrawals = pettyCashWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netChange = totalFunding - totalWithdrawals - totalExpenses;
    
    await connection.execute(`
      UPDATE petty_cash_accounts 
      SET current_balance = current_balance + ?, total_inflows = total_inflows + ?, total_outflows = total_outflows + ?, updated_at = NOW()
      WHERE boarding_house_id = ?
    `, [netChange, totalFunding, totalWithdrawals + totalExpenses, boardingHouseId]);

    await connection.commit();
    console.log('\n🎉 June 2025 expense data load completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  loadJune2025Expenses()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { loadJune2025Expenses };
