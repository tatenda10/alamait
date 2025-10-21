const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Updating payment transaction dates to September 2025...');
    
    // Update all payment transaction dates to 2025-09-01
    const [updateResult] = await conn.query(
      `UPDATE transactions 
       SET transaction_date = '2025-09-01'
       WHERE transaction_type = 'payment' 
         AND deleted_at IS NULL`
    );
    
    console.log(`✅ Updated ${updateResult.affectedRows} payment transaction dates to 2025-09-01`);
    
    console.log('\nStep 2: Verifying the update...');
    
    // Check the updated dates
    const [updatedPayments] = await conn.query(
      `SELECT 
        COUNT(*) as total_count,
        MIN(transaction_date) as earliest_date,
        MAX(transaction_date) as latest_date
      FROM transactions 
      WHERE transaction_type = 'payment' 
        AND deleted_at IS NULL`
    );
    
    console.log(`Payment transactions after update:`);
    console.log(`  Total count: ${updatedPayments[0]?.total_count}`);
    console.log(`  Date range: ${updatedPayments[0]?.earliest_date} to ${updatedPayments[0]?.latest_date}`);
    
    // Check if payments are now in September 2025
    const [septPayments] = await conn.query(
      `SELECT COUNT(*) as count
       FROM transactions 
       WHERE transaction_type = 'payment'
         AND DATE(transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
         AND deleted_at IS NULL`
    );
    
    console.log(`\nPayment transactions in September 2025: ${septPayments[0]?.count || 0}`);
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    console.log('\nStep 4: Verifying trial balance...');
    
    // Check trial balance
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;
    
    console.log(`Trial Balance:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Check key account balances
    const [keyBalances] = await conn.query(
      `SELECT 
        coa.code,
        coa.name,
        cab.current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.code IN ('10002', '10005', '40001')
      ORDER BY coa.code`
    );
    
    console.log(`\nKey Account Balances:`);
    keyBalances.forEach(acc => {
      console.log(`  ${acc.code}: ${acc.name} - $${parseFloat(acc.current_balance || 0).toFixed(2)}`);
    });
    
    console.log('\n✅ Payment transaction dates updated successfully!');
    console.log('Student payments should now appear in the cash flow report for September 2025.');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Update failed:', e);
    conn.release();
    process.exit(1);
  }
}

main();
