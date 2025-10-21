const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Restoring soft-deleted payment transactions...');
    
    // Restore soft-deleted payment transactions
    const [restoreResult] = await conn.query(
      `UPDATE transactions 
       SET deleted_at = NULL 
       WHERE transaction_type = 'payment' 
         AND deleted_at IS NOT NULL`
    );
    
    console.log(`✅ Restored ${restoreResult.affectedRows} payment transactions`);
    
    // Restore soft-deleted journal entries for payment transactions
    const [restoreJournals] = await conn.query(
      `UPDATE journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       SET je.deleted_at = NULL
       WHERE t.transaction_type = 'payment' 
         AND je.deleted_at IS NOT NULL`
    );
    
    console.log(`✅ Restored ${restoreJournals.affectedRows} payment journal entries`);
    
    console.log('\nStep 2: Updating payment transaction dates to September 2025...');
    
    // Update payment transaction dates to September 2025
    const [updateDates] = await conn.query(
      `UPDATE transactions 
       SET transaction_date = '2025-09-01'
       WHERE transaction_type = 'payment'`
    );
    
    console.log(`✅ Updated ${updateDates.affectedRows} payment transaction dates to September 2025`);
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    console.log('\nStep 4: Verifying student payments...');
    
    // Check payment transactions in September 2025
    const [septPayments] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.status
      FROM transactions t
      WHERE t.transaction_type = 'payment'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date`
    );
    
    console.log(`September 2025 payment transactions: ${septPayments.length}`);
    
    if (septPayments.length > 0) {
      const totalPayments = septPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      console.log(`Total payment amount: $${totalPayments.toFixed(2)}`);
      
      console.log('Sample payments:');
      septPayments.slice(0, 5).forEach(tx => {
        console.log(`  ${tx.transaction_date}: ${tx.description} - $${tx.amount}`);
      });
    }
    
    // Check journal entries for payment transactions
    const [paymentJournals] = await conn.query(
      `SELECT 
        je.transaction_id,
        je.entry_type,
        je.amount,
        coa.code,
        coa.name,
        t.transaction_date
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_type = 'payment'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date
      LIMIT 10`
    );
    
    console.log(`\nPayment journal entries in September: ${paymentJournals.length}`);
    if (paymentJournals.length > 0) {
      paymentJournals.slice(0, 5).forEach(je => {
        console.log(`  ${je.transaction_date}: ${je.entry_type} $${je.amount} - ${je.code} (${je.name})`);
      });
    }
    
    console.log('\n✅ Student payment transactions restored and updated!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Restoration failed:', e);
    conn.release();
    process.exit(1);
  }
}

main();
