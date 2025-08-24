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

async function loadMay2025Expenses() {
  let connection;
  
  try {
    console.log('🚀 Starting May 2025 Expense Data Load...');
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const userId = 1;
    const boardingHouseId = 4;

    // Account mappings
    const accountMappings = {
      'Water Refill': '50002',
      'Firewood': '50013',
      'Security': '50011',
      'Gas Payment': '50007',
      'Council road side permit greasing': '50013',
      'Waste collection': '50019',
      'Bulbs and floodlight purchase': '50001',
      'Fitting labor': '50001',
      'M&W Rentals': '50002',
      'Electricity Purchase': '50003',
      'Alamait Management Fee': '50013',
      'January Funds Handed Over': '50013'
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

    let [cbzVaultAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
      ['10004']
    );

    // May 2025 data
    const expenses = [
      { date: '2025-05-14', description: 'January Funds Handed Over', amount: 73.00, category: 'January Funds Handed Over' },
      { date: '2025-05-02', description: 'Water Refill', amount: 250.00, category: 'Water Refill' },
      { date: '2025-05-03', description: 'Firewood', amount: 30.00, category: 'Firewood' },
      { date: '2025-05-08', description: 'Security (guards men)', amount: 450.00, category: 'Security' },
      { date: '2025-05-06', description: 'Water Refill', amount: 200.00, category: 'Water Refill' },
      { date: '2025-05-09', description: 'Gas Payment', amount: 192.00, category: 'Gas Payment' },
      { date: '2025-05-09', description: 'Council road side permit greasing', amount: 50.00, category: 'Council road side permit greasing' },
      { date: '2025-05-15', description: 'Water Refill', amount: 150.00, category: 'Water Refill' },
      { date: '2025-05-15', description: 'Firewood', amount: 30.00, category: 'Firewood' },
      { date: '2025-05-15', description: 'Waste collection', amount: 30.00, category: 'Waste collection' },
      { date: '2025-05-19', description: 'Bulbs and floodlight purchase', amount: 42.00, category: 'Bulbs and floodlight purchase' },
      { date: '2025-05-19', description: 'Fitting labor', amount: 8.00, category: 'Fitting labor' },
      { date: '2025-05-20', description: 'Water Refill', amount: 150.00, category: 'Water Refill' },
      { date: '2025-05-27', description: 'M&W Rentals', amount: 2000.00, category: 'M&W Rentals' },
      { date: '2025-05-28', description: 'Electricity Purchase ($100.00+ $4.00 charge)', amount: 104.00, category: 'Electricity Purchase' },
      { date: '2025-05-31', description: 'Alamait Management Fee', amount: 3420.00, category: 'Alamait Management Fee' }
    ];

    const pettyCashFunding = [
      { date: '2025-05-02', amount: 280.00, description: 'Petty Cash funding' },
      { date: '2025-05-06', amount: 700.00, description: 'Petty Cash funding' },
      { date: '2025-05-14', amount: 210.00, description: 'Petty Cash funding' }
    ];

    const pettyCashWithdrawals = [
      { date: '2025-05-02', amount: 920.00, description: 'Rentals submitted to vault' },
      { date: '2025-05-05', amount: 456.00, description: 'Rentals submitted to vault' },
      { date: '2025-05-05', amount: 4050.00, description: 'Rental submitted to vault' },
      { date: '2025-05-07', amount: 2610.00, description: 'Rentals submitted to vault' },
      { date: '2025-05-08', amount: 1101.00, description: 'Rentals submitted to vault' },
      { date: '2025-05-09', amount: 448.00, description: 'Rental submitted to vault' },
      { date: '2025-05-14', amount: 595.00, description: 'Rental submitted to vault' },
      { date: '2025-05-16', amount: 840.00, description: 'Rental submitted to vault' },
      { date: '2025-05-20', amount: 783.00, description: 'Rental submitted to vault' },
      { date: '2025-05-21', amount: 80.00, description: 'Rental submitted to vault' },
      { date: '2025-05-30', amount: 110.00, description: 'rentals submitted to vault' }
    ];

    const vaultTransfers = [
      { date: '2025-05-06', amount: 7000.00, description: 'Funds to CBZ Vault' }
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
      `, [expense.date, expense.amount, expense.description, expense.amount, expense.amount, 'petty_cash', 'full', account.id, boardingHouseId, reference, `May 2025 expense`, transactionResult.insertId, userId]);

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
      `, [boardingHouseId, 'expense', expense.amount, `Expense: ${expense.description}`, reference, `May 2025 expense`, expense.date, userId]);

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
      `, [boardingHouseId, 'cash_inflow', funding.amount, `Petty cash funding`, reference, `May 2025 petty cash funding`, funding.date, userId]);

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
      `, [boardingHouseId, 'withdrawal', withdrawal.amount, `Petty cash withdrawal`, reference, `May 2025 petty cash withdrawal`, withdrawal.date, userId]);

      console.log(`  ✅ Created petty cash withdrawal: $${withdrawal.amount}`);
    }

    // Create vault transfers
    console.log('\n🏦 Creating vault transfers...');
    for (const transfer of vaultTransfers) {
      const reference = `VTF-${transfer.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (transaction_type, transaction_date, reference, amount, currency, description, boarding_house_id, created_by, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, ['vault_transfer', transfer.date, reference, transfer.amount, 'USD', `Vault transfer`, boardingHouseId, userId, 'posted']);

      // Journal entries
      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, cbzVaultAccount[0].id, 'debit', transfer.amount, `Vault transfer`, boardingHouseId, userId]);

      await connection.execute(`
        INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
      `, [transactionResult.insertId, vaultAccount[0].id, 'credit', transfer.amount, `Vault transfer`, boardingHouseId, userId]);

      console.log(`  ✅ Created vault transfer: $${transfer.amount}`);
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
    console.log('\n🎉 May 2025 expense data load completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  loadMay2025Expenses()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { loadMay2025Expenses };
