const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// St Kilda Cash Ledger transactions (September 2025)
const CASH_LEDGER_TRANSACTIONS = [
  // Opening balance from August 31, 2025
  {
    date: '2025-08-31',
    type: 'opening_balance',
    description: 'Balance C/F - Cash St Kilda',
    amount: 17.08,
    debitAccount: '10002', // Cash
    creditAccount: '30004' // Opening Balance Equity
  },
  
  // Funds from Petty cash (transfers from Petty Cash to Cash)
  {
    date: '2025-09-02',
    type: 'transfer_from_petty_cash',
    description: 'Funds from Petty cash',
    amount: 500.00,
    debitAccount: '10002', // Cash (increase)
    creditAccount: '10001' // Petty Cash (decrease)
  },
  {
    date: '2025-09-02',
    type: 'transfer_from_petty_cash',
    description: 'Funds from Petty cash',
    amount: 450.00,
    debitAccount: '10002',
    creditAccount: '10001'
  },
  {
    date: '2025-09-02',
    type: 'transfer_from_petty_cash',
    description: 'Funds from Petty cash',
    amount: 90.00,
    debitAccount: '10002',
    creditAccount: '10001'
  },
  {
    date: '2025-09-02',
    type: 'transfer_from_petty_cash',
    description: 'Funds from Petty cash',
    amount: 250.00,
    debitAccount: '10002',
    creditAccount: '10001'
  },
  {
    date: '2025-09-02',
    type: 'transfer_from_petty_cash',
    description: 'Funds from Petty cash',
    amount: 265.00,
    debitAccount: '10002',
    creditAccount: '10001'
  },
  {
    date: '2025-09-17',
    type: 'transfer_from_petty_cash',
    description: 'Funds from Petty cash',
    amount: 190.00,
    debitAccount: '10002',
    creditAccount: '10001'
  },
  
  // Cash Expenses
  {
    date: '2025-09-02',
    type: 'expense',
    description: 'Security services',
    amount: 450.00,
    debitAccount: '50011', // Security Costs
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-05',
    type: 'expense',
    description: 'Funds to petty cash Entertainment',
    amount: 250.00,
    debitAccount: '50013', // Administrative Expenses (Entertainment)
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-02',
    type: 'expense',
    description: 'Water refill',
    amount: 250.00,
    debitAccount: '50002', // Utilities - Water
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Firewood',
    amount: 40.00,
    debitAccount: '50010', // House Keeping
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Gas',
    amount: 192.00,
    debitAccount: '50007', // Gas Filling
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Bin liners',
    amount: 10.00,
    debitAccount: '50009', // Sanitary
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-03',
    type: 'expense',
    description: 'Mutsvairo (cleaning)',
    amount: 4.00,
    debitAccount: '50009', // Sanitary
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-04',
    type: 'expense',
    description: 'Gas stove',
    amount: 50.00,
    debitAccount: '50001', // Repairs and Maintenance
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-04',
    type: 'expense',
    description: 'Fitting fee',
    amount: 40.00,
    debitAccount: '50001', // Repairs and Maintenance
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-10',
    type: 'expense',
    description: 'Water refill',
    amount: 250.00,
    debitAccount: '50002', // Utilities - Water
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-10',
    type: 'expense',
    description: 'Emergency water leakage',
    amount: 15.00,
    debitAccount: '50001', // Repairs and Maintenance
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-18',
    type: 'expense',
    description: 'Water refill',
    amount: 150.00,
    debitAccount: '50002', // Utilities - Water
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-18',
    type: 'expense',
    description: 'Firewood',
    amount: 40.00,
    debitAccount: '50010', // House Keeping
    creditAccount: '10002' // Cash
  }
];

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Getting St Kilda info...');
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda boarding house not found');
    }
    
    console.log(`St Kilda Boarding House ID: ${house.id}`);
    
    // Get current Cash and Petty Cash balances
    console.log('\nStep 2: Checking current balances...');
    const [[cashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    const [[pettyCashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10001'"
    );
    console.log(`Current Cash balance: $${cashBalance?.current_balance || 0}`);
    console.log(`Current Petty Cash balance: $${pettyCashBalance?.current_balance || 0}`);
    
    // Get all required COA account IDs
    console.log('\nStep 3: Getting COA account IDs...');
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
    
    console.log('\nStep 4: Processing Cash Ledger transactions...');
    let transactionCount = 0;
    let totalInflows = 0;
    let totalExpenses = 0;
    let totalTransfersFromPettyCash = 0;
    
    for (const txn of CASH_LEDGER_TRANSACTIONS) {
      await conn.beginTransaction();
      
      transactionCount++;
      const txRef = `CASH-LEDGER-${txn.date}-${transactionCount}`;
      
      console.log(`  ${txn.date}: ${txn.description} - $${txn.amount}`);
      
      // Create transaction record
      const [txResult] = await conn.query(
        `INSERT INTO transactions (
          transaction_type, boarding_house_id, reference, amount, currency, 
          description, transaction_date, created_by, created_at, status
        ) VALUES (?, ?, ?, ?, 'USD', ?, ?, 1, NOW(), 'posted')`,
        [txn.type, house.id, txRef, txn.amount, txn.description, txn.date]
      );
      const txId = txResult.insertId;
      
      // Create journal entries
      // Debit entry
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, 
          boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
        [txId, accountIds[txn.debitAccount], txn.amount, `${txn.description} - Debit`, house.id]
      );
      
      // Credit entry
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, 
          boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
        [txId, accountIds[txn.creditAccount], txn.amount, `${txn.description} - Credit`, house.id]
      );
      
      // Track totals
      if (txn.type === 'opening_balance') {
        totalInflows += txn.amount;
      } else if (txn.type === 'transfer_from_petty_cash') {
        totalTransfersFromPettyCash += txn.amount;
      } else if (txn.type === 'expense') {
        totalExpenses += txn.amount;
      }
      
      await conn.commit();
    }
    
    console.log('\nStep 5: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify final balances
    console.log('\nStep 6: Verifying final balances...');
    const [[finalCash]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    const [[finalPettyCash]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10001'"
    );
    
    console.log('\n=== Cash Ledger Import Summary ===');
    console.log(`Transactions processed: ${transactionCount}`);
    console.log(`Opening balance: $17.08`);
    console.log(`Total transfers from Petty Cash: $${totalTransfersFromPettyCash.toFixed(2)}`);
    console.log(`Total expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`\nFinal Cash balance: $${finalCash?.current_balance || 0}`);
    console.log(`Final Petty Cash balance: $${finalPettyCash?.current_balance || 0}`);
    console.log(`Expected Cash balance: $21.08`);
    console.log(`Match: ${Math.abs(parseFloat(finalCash?.current_balance || 0) - 21.08) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Cash Ledger import completed successfully!');
    
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
