const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Clearing all payment journal entries...');
    
    // Soft delete all journal entries for payment transactions
    const [deleteResult] = await conn.query(
      `UPDATE journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       SET je.deleted_at = NOW()
       WHERE t.transaction_type = 'payment' AND je.deleted_at IS NULL`
    );
    
    console.log(`✅ Soft-deleted ${deleteResult.affectedRows} payment journal entries`);
    
    console.log('\nStep 2: Getting payment transactions...');
    
    // Get all payment transactions
    const [payments] = await conn.query(
      `SELECT * FROM transactions 
       WHERE transaction_type = 'payment' AND deleted_at IS NULL 
       ORDER BY transaction_date`
    );
    
    console.log(`Found ${payments.length} payment transactions`);
    
    // Get Cash and Accounts Receivable account IDs
    const [[cashAccount]] = await conn.query(
      "SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL"
    );
    const [[arAccount]] = await conn.query(
      "SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL"
    );
    
    if (!cashAccount || !arAccount) {
      throw new Error('Cash or Accounts Receivable account not found');
    }
    
    console.log(`Cash Account ID: ${cashAccount.id}`);
    console.log(`AR Account ID: ${arAccount.id}`);
    
    console.log('\nStep 3: Recreating payment journal entries...');
    
    let createdCount = 0;
    let totalAmount = 0;
    
    for (const payment of payments) {
      await conn.beginTransaction();
      
      try {
        // Create journal entry: Debit Cash, Credit Accounts Receivable
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
          [payment.id, cashAccount.id, payment.amount, `Payment from ${payment.description} - Debit`, payment.boarding_house_id]
        );
        
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
          [payment.id, arAccount.id, payment.amount, `Payment from ${payment.description} - Credit`, payment.boarding_house_id]
        );
        
        createdCount++;
        totalAmount += parseFloat(payment.amount);
        
        if (createdCount % 20 === 0) {
          console.log(`  Created ${createdCount}/${payments.length} payment journal entries...`);
        }
        
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error(`  Failed to create journals for: ${payment.description} - ${e.message}`);
      }
    }
    
    console.log(`\n✅ Created ${createdCount} payment journal entries`);
    console.log(`Total payment amount: $${totalAmount.toFixed(2)}`);
    
    console.log('\nStep 4: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify the fix
    console.log('\nStep 5: Verifying fix...');
    const [cashJournalEntries] = await conn.query(
      `SELECT SUM(je.amount) as total_cash_debits
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10002' AND t.transaction_type = 'payment' AND je.entry_type = 'debit' AND je.deleted_at IS NULL`
    );
    
    const totalCashDebits = parseFloat(cashJournalEntries[0]?.total_cash_debits || 0);
    console.log(`Total Cash debits from payments: $${totalCashDebits.toFixed(2)}`);
    console.log(`Expected: $14,093.00`);
    console.log(`Match: ${Math.abs(totalCashDebits - 14093) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Check final cash balance
    const [[finalCashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    console.log(`\nFinal Cash balance: $${finalCashBalance?.current_balance || 0}`);
    
    console.log('\n✅ Payment journal entries recreated successfully!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Recreation failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
