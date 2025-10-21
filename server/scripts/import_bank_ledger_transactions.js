const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// St Kilda Bank Account transactions (August-September 2025)
const BANK_LEDGER_TRANSACTIONS = [
  // Opening balance (from previous balance)
  {
    date: '2025-08-31',
    type: 'opening_balance',
    description: 'Opening balance - Bank St Kilda',
    amount: 1281.35,
    debitAccount: '10003', // CBZ Bank Account
    creditAccount: '30004' // Opening Balance Equity
  },
  
  // Rentals Received (transfers from Cash to Bank)
  {
    date: '2025-08-30',
    type: 'cash_to_bank',
    description: 'Rentals Received',
    amount: 156.00,
    debitAccount: '10003', // CBZ Bank Account
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-04',
    type: 'cash_to_bank',
    description: 'Rentals Received',
    amount: 540.00,
    debitAccount: '10003',
    creditAccount: '10002'
  },
  {
    date: '2025-09-25',
    type: 'cash_to_bank',
    description: 'Rentals Received',
    amount: 187.00,
    debitAccount: '10003',
    creditAccount: '10002'
  },
  {
    date: '2025-09-25',
    type: 'cash_to_bank',
    description: 'Rentals Received',
    amount: 180.00,
    debitAccount: '10003',
    creditAccount: '10002'
  },
  
  // Bank Expenses
  {
    date: '2025-09-02',
    type: 'expense',
    description: 'Wifi',
    amount: 100.00,
    debitAccount: '50004', // Utilities - Internet
    creditAccount: '10003' // CBZ Bank Account
  },
  {
    date: '2025-09-02',
    type: 'expense',
    description: 'Bank Charges',
    amount: 4.00,
    debitAccount: '50013', // Administrative Expenses
    creditAccount: '10003' // CBZ Bank Account
  },
  {
    date: '2025-09-26',
    type: 'expense',
    description: 'Alamait Management Fee',
    amount: 590.00,
    debitAccount: '50013', // Administrative Expenses
    creditAccount: '10003' // CBZ Bank Account
  },
  
  // Rentals Paid (expense for our rentals)
  {
    date: '2025-09-26',
    type: 'expense',
    description: 'Rentals Paid (Meadow and Willow)',
    amount: 1500.00,
    debitAccount: '50015', // Rental Premises (or use 50013 if 50015 doesn't exist)
    creditAccount: '10003' // CBZ Bank Account
  }
];

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Getting St Kilda info...');
    
    // Get St Kilda boarding house
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda boarding house not found');
    }
    
    console.log(`St Kilda Boarding House ID: ${house.id}`);
    
    // Get current Bank balance
    console.log('\nStep 2: Checking current Bank balance...');
    const [[bankBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10003'"
    );
    console.log(`Current Bank balance: $${bankBalance?.current_balance || 0}`);
    
    // Get all required COA account IDs
    console.log('\nStep 3: Getting COA account IDs...');
    const accountIds = {};
    const codes = ['10002', '10003', '30004', '50004', '50013', '50015'];
    
    for (const code of codes) {
      const [[account]] = await conn.query(
        "SELECT id, name FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL",
        [code]
      );
      if (!account) {
        if (code === '50015') {
          console.log(`  ${code}: Rental Premises not found, will use Administrative Expenses (50013)`);
          accountIds[code] = accountIds['50013']; // Use 50013 as fallback
        } else {
          throw new Error(`Account ${code} not found in COA`);
        }
      } else {
        accountIds[code] = account.id;
        console.log(`  ${code}: ${account.name} (ID: ${account.id})`);
      }
    }
    
    console.log('\nStep 4: Processing Bank Ledger transactions...');
    let transactionCount = 0;
    let totalInflows = 0;
    let totalExpenses = 0;
    let totalRentalPayments = 0;
    
    for (const txn of BANK_LEDGER_TRANSACTIONS) {
      await conn.beginTransaction();
      
      transactionCount++;
      const txRef = `BANK-LEDGER-${txn.date}-${transactionCount}`;
      
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
      if (txn.type === 'opening_balance' || txn.type === 'cash_to_bank') {
        totalInflows += txn.amount;
      } else if (txn.type === 'expense') {
        totalExpenses += txn.amount;
      } else if (txn.type === 'expense' && txn.description.includes('Rentals Paid')) {
        totalRentalPayments += txn.amount;
      }
      
      await conn.commit();
    }
    
    console.log('\nStep 5: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify final balances
    console.log('\nStep 6: Verifying final balances...');
    const [[finalBank]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10003'"
    );
    const [[finalCash]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    
    console.log('\n=== Bank Ledger Import Summary ===');
    console.log(`Transactions processed: ${transactionCount}`);
    console.log(`Opening balance: $1,281.35`);
    console.log(`Total inflows: $${totalInflows.toFixed(2)}`);
    console.log(`Total expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`Total rental payments: $${totalRentalPayments.toFixed(2)}`);
    console.log(`\nFinal Bank balance: $${finalBank?.current_balance || 0}`);
    console.log(`Final Cash balance: $${finalCash?.current_balance || 0}`);
    console.log(`Expected Bank balance: $150.35`);
    console.log(`Match: ${Math.abs(parseFloat(finalBank?.current_balance || 0) - 150.35) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Bank Ledger import completed successfully!');
    
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
