const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'alamait',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function loadApril2025Expenses() {
  let connection;
  
  try {
    console.log('🚀 Starting April 2025 Expense Data Load...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('---');

    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Start transaction
    await connection.beginTransaction();
    console.log('💾 Started database transaction');

    const userId = 1; // Default user ID
    const boardingHouseId = 4; // St Kilda boarding house

    // Step 1: Get account IDs for expense categories
    console.log('\n🏦 Step 1: Getting account IDs...');
    
         const accountMappings = {
       'Waste Collection': '50019', // Waste Management
       'Water': '50002', // Utilities - Water
       'Cleaning Supplies': '50010', // House Keeping
       'Firewood': '50013', // Administrative Expenses
       'Binliners': '50019', // Waste Management
       'Gas': '50007', // Gas Filling
       'Maintenance': '50001', // Repairs and Maintenance
       'Landscape': '50013', // Administrative Expenses
       'Electricity': '50003', // Utilities - Electricity
       'Council Rates': '50013', // Administrative Expenses
       'Bank Charges': '50013', // Administrative Expenses
       'Sanitary Disposal': '50009', // Sanitary
       'M&W': '50002', // Utilities - Water
       'Management Fee': '50013', // Administrative Expenses
       'Wi-Fi': '50008', // Communication Cost
       'Security': '50011' // Security Costs
     };

     // Get expense accounts from global chart_of_accounts
     const expenseAccounts = {};
     for (const [expenseName, accountCode] of Object.entries(accountMappings)) {
       let [account] = await connection.execute(
         'SELECT id, name FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
         [accountCode]
       );
       
       if (account.length === 0) {
         throw new Error(`Account with code ${accountCode} not found in global chart of accounts`);
       } else {
         expenseAccounts[expenseName] = { id: account[0].id, name: account[0].name, code: accountCode };
         console.log(`✅ Found expense account: ${account[0].name} (${accountCode})`);
       }
     }

    // Get petty cash account
    let [pettyCashAccount] = await connection.execute(
      'SELECT id FROM petty_cash_accounts WHERE boarding_house_id = ?',
      [boardingHouseId]
    );
    
    if (pettyCashAccount.length === 0) {
      // Create petty cash account if it doesn't exist
      const [result] = await connection.execute(
        `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_inflows, total_outflows, created_at)
         VALUES (?, 0, 0, 0, NOW())`,
        [boardingHouseId]
      );
      pettyCashAccount = [{ id: result.insertId }];
      console.log(`✅ Created petty cash account for boarding house ${boardingHouseId}`);
    }

              // Get petty cash chart of accounts entry from global chart_of_accounts
     let [pettyCashChartAccount] = await connection.execute(
       'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
       ['10001'] // Petty Cash account code
     );
     
     if (pettyCashChartAccount.length === 0) {
       throw new Error('Petty Cash account (10001) not found in global chart of accounts');
     } else {
       console.log(`✅ Found petty cash chart account: Petty Cash (${pettyCashChartAccount[0].id})`);
     }

     // Get vault account (Cash account) from global chart_of_accounts
     let [vaultAccount] = await connection.execute(
       'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
       ['10002'] // Cash account
     );

     if (vaultAccount.length === 0) {
       throw new Error('Cash account (10002) not found in global chart of accounts');
     } else {
       console.log(`✅ Found vault account: Cash (${vaultAccount[0].id})`);
     }

    // Step 2: Define April 2025 expense data
    console.log('\n📋 Step 2: Processing April 2025 expense data...');

    // Expenses from Payment Cr column
    const expenses = [
      { date: '2025-04-02', description: 'Waste collection', amount: 30.00, category: 'Waste Collection' },
      { date: '2025-04-04', description: 'Water refill', amount: 250.00, category: 'Water' },
      { date: '2025-04-08', description: 'Water refill', amount: 150.00, category: 'Water' },
      { date: '2025-04-08', description: 'Firewood', amount: 30.00, category: 'Firewood' },
      { date: '2025-04-11', description: 'Cleaning supplies', amount: 55.00, category: 'Cleaning Supplies' },
      { date: '2025-04-14', description: 'Binliners', amount: 10.00, category: 'Binliners' },
      { date: '2025-04-15', description: 'Water refill', amount: 150.00, category: 'Water' },
      { date: '2025-04-15', description: 'Gas', amount: 192.00, category: 'Gas' },
      { date: '2025-04-15', description: 'Firewood', amount: 30.00, category: 'Firewood' },
      { date: '2025-04-22', description: 'Water refill', amount: 150.00, category: 'Water' },
      { date: '2025-04-28', description: 'Fixing leaking water tank', amount: 35.00, category: 'Maintenance' },
      { date: '2025-04-28', description: 'Black polythene paper', amount: 35.00, category: 'Cleaning Supplies' },
      { date: '2025-04-25', description: 'Landscape stones +transport', amount: 20.00, category: 'Landscape' }
    ];

    // Petty Cash Funding (from Receipt Dr column)
    const pettyCashFunding = [
      { date: '2025-04-02', amount: 250.00, description: 'Petty Cash funding' },
      { date: '2025-04-08', amount: 240.00, description: 'Petty Cash funding' },
      { date: '2025-04-14', amount: 380.00, description: 'Petty Cash funding' },
      { date: '2025-04-22', amount: 190.00, description: 'Petty Cash funding' }
    ];

    // Petty Cash Withdrawals (Rental submitted entries)
    const pettyCashWithdrawals = [
      { date: '2025-04-02', amount: 3455.00, description: 'Rental submitted to vault' },
      { date: '2025-04-03', amount: 750.00, description: 'Rental submitted to vault' },
      { date: '2025-04-04', amount: 920.00, description: 'Rental submitted to vault' },
      { date: '2025-04-07', amount: 1690.00, description: 'Rental submitted to vault' },
      { date: '2025-04-11', amount: 1450.00, description: 'Rental submitted to vault' },
      { date: '2025-04-14', amount: 190.00, description: 'Rental submitted to vault' },
      { date: '2025-04-30', amount: 940.00, description: 'Rental submitted to vault' }
    ];

    // Step 3: Create expenses
    console.log('\n💸 Step 3: Creating expenses...');
    for (const expense of expenses) {
      const account = expenseAccounts[expense.category];
      const reference = `EXP-${expense.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      console.log(`\n  Processing expense: ${expense.description} - $${expense.amount} (${expense.category})`);
      
             // Create transaction FIRST
       console.log(`    Step 3.1: Creating transaction record...`);
       let transactionResult;
       try {
         [transactionResult] = await connection.execute(`
           INSERT INTO transactions (
             transaction_type,
             transaction_date,
             reference,
             amount,
             currency,
             description,
             boarding_house_id,
             created_by,
             created_at,
             status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
         `, [
           'expense',
           expense.date,
           reference,
           expense.amount,
           'USD',
           `Expense: ${expense.description} - ${expense.category}`,
           boardingHouseId,
           userId,
           'posted'
         ]);
         console.log(`    ✅ Transaction created with ID: ${transactionResult.insertId}`);
       } catch (error) {
         console.error(`    ❌ Failed to create transaction:`, error.message);
         throw error;
       }

       // Create expense record with transaction_id
       console.log(`    Step 3.2: Creating expense record...`);
       try {
         const [expenseResult] = await connection.execute(`
           INSERT INTO expenses (
             expense_date,
             amount,
             description,
             total_amount,
             remaining_balance,
             payment_method,
             payment_status,
             expense_account_id,
             boarding_house_id,
             reference_number,
             notes,
             transaction_id,
             created_by,
             created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         `, [
           expense.date,
           expense.amount,
           expense.description,
           expense.amount,
           expense.amount, // Initially, remaining balance equals total amount
           'petty_cash',
           'full',
           account.id,
           boardingHouseId,
           reference,
           `April 2025 expense - ${expense.category}`,
           transactionResult.insertId, // Use the transaction ID we just created
           userId
         ]);
        console.log(`    ✅ Expense record created with ID: ${expenseResult.insertId}`);
      } catch (error) {
        console.error(`    ❌ Failed to create expense record:`, error.message);
        throw error;
      }

      console.log(`  ✅ Created expense: ${expense.description} - $${expense.amount} (${expense.category})`);

      // Create journal entries
      // Debit: Expense account
      console.log(`    Step 3.3: Creating journal entry (debit expense account)...`);
      console.log(`      Transaction ID: ${transactionResult.insertId}, Account ID: ${account.id}, Amount: ${expense.amount}`);
      
      try {
        await connection.execute(`
          INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
        `, [
          transactionResult.insertId,
          account.id,
          'debit',
          expense.amount,
          `Expense: ${expense.description}`,
          boardingHouseId,
          userId
        ]);
        console.log(`    ✅ Journal entry (debit) created successfully`);
      } catch (error) {
        console.error(`    ❌ Failed to create journal entry (debit):`, error.message);
        throw error;
      }

      // Credit: Petty Cash account
      console.log(`    Step 3.4: Creating journal entry (credit petty cash account)...`);
      console.log(`      Petty Cash Account ID: ${pettyCashChartAccount[0].id}, Amount: ${expense.amount}`);
      
      try {
        await connection.execute(`
          INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
        `, [
          transactionResult.insertId,
          pettyCashChartAccount[0].id,
          'credit',
          expense.amount,
          `Expense payment: ${expense.description}`,
          boardingHouseId,
          userId
        ]);
        console.log(`    ✅ Journal entry (credit) created successfully`);
      } catch (error) {
        console.error(`    ❌ Failed to create journal entry (credit):`, error.message);
        throw error;
      }

      // Create petty cash transaction (outflow)
      console.log(`    Step 3.5: Creating petty cash transaction...`);
      console.log(`      Amount: ${expense.amount}, Type: expense`);
      
      try {
        await connection.execute(`
          INSERT INTO petty_cash_transactions (
            boarding_house_id,
            transaction_type,
            amount,
            description,
            reference_number,
            notes,
            transaction_date,
            created_by,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          boardingHouseId,
          'expense',
          expense.amount,
          `Expense: ${expense.description}`,
          reference,
          `April 2025 expense - ${expense.category}`,
          expense.date,
          userId
        ]);
        console.log(`    ✅ Petty cash transaction created successfully`);
      } catch (error) {
        console.error(`    ❌ Failed to create petty cash transaction:`, error.message);
        throw error;
      }
    }

    // Step 4: Create petty cash funding transactions
    console.log('\n💰 Step 4: Creating petty cash funding transactions...');
    for (const funding of pettyCashFunding) {
      const reference = `PCF-${funding.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create transaction
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (
          transaction_type,
          transaction_date,
          reference,
          amount,
          currency,
          description,
          boarding_house_id,
          created_by,
          created_at,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        'petty_cash_funding',
        funding.date,
        reference,
        funding.amount,
        'USD',
        `Petty cash funding: ${funding.description}`,
        boardingHouseId,
        userId,
        'posted'
      ]);

             // Create journal entries
       // Debit: Petty Cash account
               await connection.execute(`
          INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
        `, [
          transactionResult.insertId,
          pettyCashChartAccount[0].id,
          'debit',
          funding.amount,
          `Petty cash funding`,
          boardingHouseId,
          userId
        ]);

               // Credit: Vault (Cash) account
        await connection.execute(`
          INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
        `, [
          transactionResult.insertId,
          vaultAccount[0].id,
          'credit',
          funding.amount,
          `Petty cash funding`,
          boardingHouseId,
          userId
        ]);

             // Create petty cash transaction (inflow)
       await connection.execute(`
         INSERT INTO petty_cash_transactions (
           boarding_house_id,
           transaction_type,
           amount,
           description,
           reference_number,
           notes,
           transaction_date,
           created_by,
           created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       `, [
         boardingHouseId,
         'cash_inflow',
         funding.amount,
         `Petty cash funding`,
         reference,
         `April 2025 petty cash funding`,
         funding.date,
         userId
       ]);

      console.log(`  ✅ Created petty cash funding: $${funding.amount} on ${funding.date}`);
    }

    // Step 5: Create petty cash withdrawal transactions
    console.log('\n💳 Step 5: Creating petty cash withdrawal transactions...');
    for (const withdrawal of pettyCashWithdrawals) {
      const reference = `PCW-${withdrawal.date.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create transaction
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (
          transaction_type,
          transaction_date,
          reference,
          amount,
          currency,
          description,
          boarding_house_id,
          created_by,
          created_at,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        'petty_cash_withdrawal',
        withdrawal.date,
        reference,
        withdrawal.amount,
        'USD',
        `Petty cash withdrawal: ${withdrawal.description}`,
        boardingHouseId,
        userId,
        'posted'
      ]);

             // Create journal entries
               // Debit: Vault (Cash) account
        await connection.execute(`
          INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
        `, [
          transactionResult.insertId,
          vaultAccount[0].id,
          'debit',
          withdrawal.amount,
          `Petty cash withdrawal`,
          boardingHouseId,
          userId
        ]);

               // Credit: Petty Cash account
        await connection.execute(`
          INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
        `, [
          transactionResult.insertId,
          pettyCashChartAccount[0].id,
          'credit',
          withdrawal.amount,
          `Petty cash withdrawal`,
          boardingHouseId,
          userId
        ]);

      // Create petty cash transaction (outflow)
      await connection.execute(`
        INSERT INTO petty_cash_transactions (
          boarding_house_id,
          transaction_type,
          amount,
          description,
          reference_number,
          notes,
          transaction_date,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        boardingHouseId,
        'withdrawal',
        withdrawal.amount,
        `Petty cash withdrawal`,
        reference,
        `April 2025 petty cash withdrawal`,
        withdrawal.date,
        userId
      ]);

      console.log(`  ✅ Created petty cash withdrawal: $${withdrawal.amount} on ${withdrawal.date}`);
    }

    // Step 6: Update petty cash account balance
    console.log('\n💵 Step 6: Updating petty cash account balance...');
    
    const totalFunding = pettyCashFunding.reduce((sum, f) => sum + f.amount, 0);
    const totalWithdrawals = pettyCashWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const netChange = totalFunding - totalWithdrawals - totalExpenses;
    
    await connection.execute(`
      UPDATE petty_cash_accounts 
      SET 
        current_balance = current_balance + ?,
        total_inflows = total_inflows + ?,
        total_outflows = total_outflows + ?,
        updated_at = NOW()
      WHERE boarding_house_id = ?
    `, [netChange, totalFunding, totalWithdrawals + totalExpenses, boardingHouseId]);

    console.log(`✅ Updated petty cash account:`);
    console.log(`  - Total funding: $${totalFunding.toFixed(2)}`);
    console.log(`  - Total withdrawals: $${totalWithdrawals.toFixed(2)}`);
    console.log(`  - Total expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`  - Net change: $${netChange.toFixed(2)}`);

    // Step 7: Commit transaction
    console.log('\n💾 Step 7: Committing transaction...');
    await connection.commit();
    console.log('✅ Transaction committed successfully!');

    // Step 8: Verification
    console.log('\n📊 Step 8: Verification...');
    
    const [expenseCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM expenses 
      WHERE expense_date BETWEEN '2025-04-01' AND '2025-04-30'
        AND boarding_house_id = ?
    `, [boardingHouseId]);
    
    const [transactionCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE transaction_date BETWEEN '2025-04-01' AND '2025-04-30'
        AND boarding_house_id = ?
    `, [boardingHouseId]);
    
    const [pettyCashCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM petty_cash_transactions 
      WHERE transaction_date BETWEEN '2025-04-01' AND '2025-04-30'
        AND boarding_house_id = ?
    `, [boardingHouseId]);

    console.log(`✅ Created ${expenseCount[0].count} expenses`);
    console.log(`✅ Created ${transactionCount[0].count} transactions`);
    console.log(`✅ Created ${pettyCashCount[0].count} petty cash transactions`);

    console.log('\n🎉 April 2025 expense data load completed successfully!');

  } catch (error) {
    console.error('\n❌ Error occurred during April 2025 expense data load:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (connection) {
      console.log('\n🔄 Rolling back transaction...');
      await connection.rollback();
      console.log('✅ Transaction rolled back');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  loadApril2025Expenses()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { loadApril2025Expenses };
