const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// Marko's St Kilda Petty Cash Ledger transactions (September 2025)
const PETTY_CASH_LEDGER_TRANSACTIONS = [
  // Opening balance from August 31, 2025
  {
    date: '2025-08-31',
    type: 'opening_balance',
    description: 'Balance C/F - Marko petty cash St Kilda',
    amount: 17.08,
    debitAccount: '10001', // Petty Cash
    creditAccount: '30004' // Opening Balance Equity
  },
  
  // Cash Inflows (Cash → Petty Cash) - "Funds from Petty cash" in the ledger
  {
    date: '2025-09-02',
    type: 'cash_inflow',
    description: 'Funds from Cash to Petty cash',
    amount: 500.00,
    debitAccount: '10001', // Petty Cash (increase)
    creditAccount: '10002' // Cash (decrease)
  },
  {
    date: '2025-09-02',
    type: 'cash_inflow',
    description: 'Funds from Cash to Petty cash',
    amount: 450.00,
    debitAccount: '10001',
    creditAccount: '10002'
  },
  {
    date: '2025-09-02',
    type: 'cash_inflow',
    description: 'Funds from Cash to Petty cash',
    amount: 90.00,
    debitAccount: '10001',
    creditAccount: '10002'
  },
  {
    date: '2025-09-02',
    type: 'cash_inflow',
    description: 'Funds from Cash to Petty cash',
    amount: 250.00,
    debitAccount: '10001',
    creditAccount: '10002'
  },
  {
    date: '2025-09-02',
    type: 'cash_inflow',
    description: 'Funds from Cash to Petty cash',
    amount: 265.00,
    debitAccount: '10001',
    creditAccount: '10002'
  },
  {
    date: '2025-09-17',
    type: 'cash_inflow',
    description: 'Funds from Cash to Petty cash',
    amount: 190.00,
    debitAccount: '10001',
    creditAccount: '10002'
  },
  
  // Petty Cash Expenses
  {
    date: '2025-09-02',
    type: 'expense',
    description: 'Security services',
    amount: 450.00,
    debitAccount: '50011', // Security Costs
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-05',
    type: 'expense',
    description: 'Funds to petty cash Entertainment',
    amount: 250.00,
    debitAccount: '50013', // Administrative Expenses (Entertainment)
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-02',
    type: 'expense',
    description: 'Water refill',
    amount: 250.00,
    debitAccount: '50002', // Utilities - Water
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Firewood',
    amount: 40.00,
    debitAccount: '50010', // House Keeping
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Gas',
    amount: 192.00,
    debitAccount: '50007', // Gas Filling
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Bin liners',
    amount: 10.00,
    debitAccount: '50009', // Sanitary
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Mutsvairo (cleaning)',
    amount: 4.00,
    debitAccount: '50009', // Sanitary
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-04',
    type: 'expense',
    description: 'Gas stove',
    amount: 50.00,
    debitAccount: '50001', // Repairs and Maintenance
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-04',
    type: 'expense',
    description: 'Fitting fee',
    amount: 40.00,
    debitAccount: '50001', // Repairs and Maintenance
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-10',
    type: 'expense',
    description: 'Water refill',
    amount: 250.00,
    debitAccount: '50002', // Utilities - Water
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-10',
    type: 'expense',
    description: 'Emergency water leakage',
    amount: 15.00,
    debitAccount: '50001', // Repairs and Maintenance
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-18',
    type: 'expense',
    description: 'Water refill',
    amount: 150.00,
    debitAccount: '50002', // Utilities - Water
    creditAccount: '10001' // Petty Cash
  },
  {
    date: '2025-09-18',
    type: 'expense',
    description: 'Firewood',
    amount: 40.00,
    debitAccount: '50010', // House Keeping
    creditAccount: '10001' // Petty Cash
  }
];

async function main() {
  const conn = await db.getConnection();
  try {
    // Get Marko's user ID and petty cash account
    console.log('Step 1: Getting Marko and St Kilda info...');
    const [[user]] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    const [[pettyCashAcct]] = await conn.query(
      "SELECT id FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL",
      [user.id, house.id]
    );
    
    if (!user || !house || !pettyCashAcct) {
      throw new Error('User, boarding house, or petty cash account not found');
    }
    
    console.log(`User ID: ${user.id}, Boarding House ID: ${house.id}, Petty Cash Account ID: ${pettyCashAcct.id}`);
    
    // Get all required COA account IDs
    console.log('\nStep 2: Getting COA account IDs...');
    const accountIds = {};
    const codes = ['10001', '10002', '30004', '50001', '50002', '50007', '50009', '50010', '50011', '50013'];
    
    for (const code of codes) {
      const [[account]] = await conn.query(
        "SELECT id, name FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL",
        [code]
      );
      if (!account) throw new Error(`Account ${code} not found in COA`);
      accountIds[code] = account.id;
      console.log(`  ${code}: ${account.name} (ID: ${account.id})`);
    }
    
    console.log('\nStep 3: Processing Petty Cash Ledger transactions...');
    let totalInflows = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    
    for (const txn of PETTY_CASH_LEDGER_TRANSACTIONS) {
      await conn.beginTransaction();
      
      transactionCount++;
      const txRef = `PC-LEDGER-${txn.date}-${transactionCount}`;
      
      console.log(`  ${txn.date}: ${txn.description} - $${txn.amount}`);
      
      // Create transaction record
      const [txResult] = await conn.query(
        `INSERT INTO transactions (
          transaction_type, boarding_house_id, reference, amount, currency, 
          description, transaction_date, created_by, created_at, status
        ) VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, NOW(), 'posted')`,
        [txn.type, house.id, txRef, txn.amount, txn.description, txn.date, user.id]
      );
      const txId = txResult.insertId;
      
      // Create journal entries
      // Debit entry
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, 
          boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
        [txId, accountIds[txn.debitAccount], txn.amount, `${txn.description} - Debit`, house.id, user.id]
      );
      
      // Credit entry
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, 
          boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
        [txId, accountIds[txn.creditAccount], txn.amount, `${txn.description} - Credit`, house.id, user.id]
      );
      
      // Create petty cash transaction record
      const pettyCashTxType = txn.type === 'opening_balance' ? 'beginning_balance' : txn.type;
      await conn.query(
        `INSERT INTO petty_cash_transactions (
          user_id, boarding_house_id, transaction_type, amount, description, 
          reference_number, transaction_date, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [user.id, house.id, pettyCashTxType, txn.amount, txn.description, txRef, txn.date, user.id]
      );
      
      // Update petty cash account balance
      if (txn.type === 'opening_balance' || txn.type === 'cash_inflow') {
        totalInflows += txn.amount;
        await conn.query(
          `UPDATE petty_cash_accounts 
           SET current_balance = current_balance + ?,
               total_inflows = total_inflows + ?,
               ${txn.type === 'opening_balance' ? 'beginning_balance = beginning_balance + ?,' : ''}
               updated_at = NOW()
           WHERE id = ?`,
          txn.type === 'opening_balance' 
            ? [txn.amount, txn.amount, txn.amount, pettyCashAcct.id]
            : [txn.amount, txn.amount, pettyCashAcct.id]
        );
      } else if (txn.type === 'expense') {
        totalExpenses += txn.amount;
        await conn.query(
          `UPDATE petty_cash_accounts 
           SET current_balance = current_balance - ?,
               total_outflows = total_outflows + ?,
               updated_at = NOW()
           WHERE id = ?`,
          [txn.amount, txn.amount, pettyCashAcct.id]
        );
      }
      
      await conn.commit();
    }
    
    console.log('\nStep 4: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify final balance
    console.log('\nStep 5: Verifying petty cash balance...');
    const [[finalBalance]] = await conn.query(
      "SELECT current_balance, beginning_balance, total_inflows, total_outflows FROM petty_cash_accounts WHERE id = ?",
      [pettyCashAcct.id]
    );
    
    console.log('\n=== Petty Cash Ledger Import Summary ===');
    console.log(`Transactions processed: ${transactionCount}`);
    console.log(`Opening balance: $${finalBalance.beginning_balance}`);
    console.log(`Total inflows: $${finalBalance.total_inflows}`);
    console.log(`Total outflows: $${finalBalance.total_outflows}`);
    console.log(`Final balance: $${finalBalance.current_balance}`);
    console.log(`Expected balance: $21.08`);
    console.log(`Match: ${parseFloat(finalBalance.current_balance) === 21.08 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Petty Cash Ledger import completed successfully!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Import failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
