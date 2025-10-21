const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// St Kilda Cash Ledger transactions (September 2025)
const CASH_LEDGER_TRANSACTIONS = [
  // Opening balance from August 31, 2025
  {
    date: '2025-08-31',
    type: 'opening_balance',
    description: 'Balance C/F - Cash St Kilda',
    amount: 2738.55,
    debitAccount: '10002', // Cash
    creditAccount: '30004' // Opening Balance Equity
  },
  
  // Cash Expenses
  {
    date: '2025-09-01',
    type: 'expense',
    description: 'Electricity',
    amount: 200.00,
    debitAccount: '50003', // Utilities - Electricity
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-01',
    type: 'expense',
    description: 'Council rates',
    amount: 100.00,
    debitAccount: '500027', // City Council Rates
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-26',
    type: 'expense',
    description: 'Alamait management fee',
    amount: 1840.00,
    debitAccount: '50013', // Administrative Expenses
    creditAccount: '10002' // Cash
  },
  {
    date: '2025-09-29',
    type: 'expense',
    description: 'Rental Balance paid as Cash',
    amount: 500.00,
    debitAccount: '50015', // Rental Premises (or use 50013 if 50015 doesn't exist)
    creditAccount: '10002' // Cash
  },
  
  // Vault Transfers
  {
    date: '2025-09-19',
    type: 'transfer_to_vault',
    description: 'Funds to Vault',
    amount: 2050.00,
    debitAccount: '10004', // CBZ Vault (increase vault)
    creditAccount: '10002' // Cash (decrease cash)
  },
  {
    date: '2025-09-26',
    type: 'transfer_from_vault',
    description: 'Funds from Vault',
    amount: 2050.00,
    debitAccount: '10002', // Cash (increase cash)
    creditAccount: '10004' // CBZ Vault (decrease vault)
  }
];

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Clearing existing cash transactions...');
    
    // Get St Kilda boarding house
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda boarding house not found');
    }
    
    console.log(`St Kilda Boarding House ID: ${house.id}`);
    
    // Soft delete existing cash-related transactions
    await conn.query(
      "UPDATE transactions SET deleted_at = NOW() WHERE boarding_house_id = ? AND transaction_type IN ('opening_balance', 'expense', 'transfer_to_vault', 'transfer_from_vault')",
      [house.id]
    );
    
    // Soft delete journal entries for cash-related transactions
    await conn.query(
      "UPDATE journal_entries SET deleted_at = NOW() WHERE boarding_house_id = ? AND account_id IN (SELECT id FROM chart_of_accounts WHERE code IN ('10002', '10004', '50003', '500027', '50013', '50015', '30004'))",
      [house.id]
    );
    
    console.log('✅ Cleared existing cash transactions');
    
    // Get current Cash and CBZ Vault balances
    console.log('\nStep 2: Checking current balances...');
    const [[cashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    const [[vaultBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10004'"
    );
    console.log(`Current Cash balance: $${cashBalance?.current_balance || 0}`);
    console.log(`Current CBZ Vault balance: $${vaultBalance?.current_balance || 0}`);
    
    // Get all required COA account IDs
    console.log('\nStep 3: Getting COA account IDs...');
    const accountIds = {};
    const codes = ['10002', '10004', '30004', '50003', '500027', '50013', '50015'];
    
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
    
    console.log('\nStep 4: Processing Cash Ledger transactions...');
    let transactionCount = 0;
    let totalExpenses = 0;
    let totalToVault = 0;
    let totalFromVault = 0;
    
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
      if (txn.type === 'expense') {
        totalExpenses += txn.amount;
      } else if (txn.type === 'transfer_to_vault') {
        totalToVault += txn.amount;
      } else if (txn.type === 'transfer_from_vault') {
        totalFromVault += txn.amount;
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
    const [[finalVault]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10004'"
    );
    
    console.log('\n=== Cash Ledger Import Summary ===');
    console.log(`Transactions processed: ${transactionCount}`);
    console.log(`Opening balance: $2,738.55`);
    console.log(`Total expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`Total transfers to Vault: $${totalToVault.toFixed(2)}`);
    console.log(`Total transfers from Vault: $${totalFromVault.toFixed(2)}`);
    console.log(`\nFinal Cash balance: $${finalCash?.current_balance || 0}`);
    console.log(`Final CBZ Vault balance: $${finalVault?.current_balance || 0}`);
    console.log(`Expected Cash balance: $2,458.55`);
    console.log(`Match: ${Math.abs(parseFloat(finalCash?.current_balance || 0) - 2458.55) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
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
