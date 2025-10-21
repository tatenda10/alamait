const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Checking petty cash expenses...');
    
    // Check if there are any petty cash expense transactions
    const [expenseTransactions] = await conn.query(
      `SELECT t.*, je.amount, je.entry_type
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10001' AND t.transaction_type = 'expense' AND t.deleted_at IS NULL`
    );
    
    console.log(`Petty cash expense transactions: ${expenseTransactions.length}`);
    
    if (expenseTransactions.length === 0) {
      console.log('No petty cash expense transactions found. Need to recreate them.');
      
      // Get Marko's user ID and petty cash account
      const [[user]] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
      const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
      
      if (!user || !house) {
        throw new Error('User or boarding house not found');
      }
      
      console.log(`User ID: ${user.id}, Boarding House ID: ${house.id}`);
      
      // Get required COA account IDs
      const accountIds = {};
      const codes = ['10001', '50011', '50013', '50002', '50010', '50007', '50009', '50001'];
      
      for (const code of codes) {
        const [[account]] = await conn.query(
          "SELECT id, name FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL",
          [code]
        );
        if (!account) throw new Error(`Account ${code} not found in COA`);
        accountIds[code] = account.id;
        console.log(`  ${code}: ${account.name} (ID: ${account.id})`);
      }
      
      console.log('\nStep 2: Recreating petty cash expenses...');
      
      // Petty cash expenses from the ledger
      const expenses = [
        { date: '2025-09-02', description: 'Security services', amount: 450.00, expenseAccount: '50011' },
        { date: '2025-09-05', description: 'Funds to petty cash Entertainment', amount: 250.00, expenseAccount: '50013' },
        { date: '2025-09-02', description: 'Water refill', amount: 250.00, expenseAccount: '50002' },
        { date: '2025-09-03', description: 'Firewood', amount: 40.00, expenseAccount: '50010' },
        { date: '2025-09-03', description: 'Gas', amount: 192.00, expenseAccount: '50007' },
        { date: '2025-09-03', description: 'Bin liners', amount: 10.00, expenseAccount: '50009' },
        { date: '2025-09-03', description: 'Mutsvairo (cleaning)', amount: 4.00, expenseAccount: '50009' },
        { date: '2025-09-04', description: 'Gas stove', amount: 50.00, expenseAccount: '50001' },
        { date: '2025-09-04', description: 'Fitting fee', amount: 40.00, expenseAccount: '50001' },
        { date: '2025-09-10', description: 'Water refill', amount: 250.00, expenseAccount: '50002' },
        { date: '2025-09-10', description: 'Emergency water leakage', amount: 15.00, expenseAccount: '50001' },
        { date: '2025-09-18', description: 'Water refill', amount: 150.00, expenseAccount: '50002' },
        { date: '2025-09-18', description: 'Firewood', amount: 40.00, expenseAccount: '50010' }
      ];
      
      let totalExpenses = 0;
      
      for (const expense of expenses) {
        await conn.beginTransaction();
        
        const txRef = `PC-EXPENSE-${expense.date}-${Date.now()}`;
        
        console.log(`  ${expense.date}: ${expense.description} - $${expense.amount}`);
        
        // Create transaction record
        const [txResult] = await conn.query(
          `INSERT INTO transactions (
            transaction_type, boarding_house_id, reference, amount, currency, 
            description, transaction_date, created_by, created_at, status
          ) VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, NOW(), 'posted')`,
          ['expense', house.id, txRef, expense.amount, expense.description, expense.date, user.id]
        );
        const txId = txResult.insertId;
        
        // Create journal entries
        // Debit expense account, Credit petty cash
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
          [txId, accountIds[expense.expenseAccount], expense.amount, `${expense.description} - Debit`, house.id, user.id]
        );
        
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
          [txId, accountIds['10001'], expense.amount, `${expense.description} - Credit`, house.id, user.id]
        );
        
        totalExpenses += expense.amount;
        await conn.commit();
      }
      
      console.log(`\n✅ Created ${expenses.length} petty cash expense transactions`);
      console.log(`Total expenses: $${totalExpenses.toFixed(2)}`);
      
      console.log('\nStep 3: Recalculating account balances...');
      await recalculateAllAccountBalances();
      
      // Verify the fix
      console.log('\nStep 4: Verifying petty cash balance...');
      const [[finalPettyCashBalance]] = await conn.query(
        "SELECT current_balance FROM current_account_balances WHERE account_code = '10001'"
      );
      
      console.log(`Final Petty Cash balance: $${finalPettyCashBalance?.current_balance || 0}`);
      console.log(`Expected: $21.08`);
      console.log(`Match: ${Math.abs(parseFloat(finalPettyCashBalance?.current_balance || 0) - 21.08) < 0.01 ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log('Petty cash expense transactions already exist.');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Restoration failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
