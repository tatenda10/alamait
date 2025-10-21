const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Finding payment transactions without journal entries...');
    
    // Find payment transactions that don't have journal entries
    const [missingJournals] = await conn.query(
      `SELECT t.*
       FROM transactions t
       LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
       WHERE t.transaction_type = 'payment' AND t.deleted_at IS NULL AND je.id IS NULL
       ORDER BY t.transaction_date`
    );
    
    console.log(`Found ${missingJournals.length} payment transactions without journal entries`);
    
    if (missingJournals.length === 0) {
      console.log('✅ All payment transactions have journal entries!');
      conn.release();
      process.exit(0);
    }
    
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
    
    console.log('\nStep 2: Creating missing journal entries...');
    let createdCount = 0;
    
    for (const payment of missingJournals) {
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
        console.log(`  Created journals for: ${payment.description} - $${payment.amount}`);
        
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error(`  Failed to create journals for: ${payment.description} - ${e.message}`);
      }
    }
    
    console.log(`\nStep 3: Recalculating account balances...`);
    await recalculateAllAccountBalances();
    
    // Verify the fix
    console.log('\nStep 4: Verifying fix...');
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
    
    console.log(`\n✅ Created ${createdCount} missing journal entries!`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Fix failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
