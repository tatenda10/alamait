const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Removing incorrect payment transactions...');
    
    // Soft-delete all payment transactions
    const [deleteTransactions] = await conn.query(
      `UPDATE transactions 
       SET deleted_at = NOW() 
       WHERE transaction_type = 'payment'`
    );
    
    console.log(`✅ Soft-deleted ${deleteTransactions.affectedRows} payment transactions`);
    
    // Soft-delete all journal entries for payment transactions
    const [deleteJournals] = await conn.query(
      `UPDATE journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       SET je.deleted_at = NOW()
       WHERE t.transaction_type = 'payment'`
    );
    
    console.log(`✅ Soft-deleted ${deleteJournals.affectedRows} payment journal entries`);
    
    // Soft-delete student_payments records
    const [deleteStudentPayments] = await conn.query(
      `UPDATE student_payments 
       SET deleted_at = NOW() 
       WHERE deleted_at IS NULL`
    );
    
    console.log(`✅ Soft-deleted ${deleteStudentPayments.affectedRows} student payment records`);
    
    console.log('\nStep 2: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    console.log('\nStep 3: Verifying trial balance...');
    
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
    
    console.log('\n✅ Incorrect payment transactions removed!');
    console.log('Now ready to import the correct payments totaling $14,093.00');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Removal failed:', e);
    conn.release();
    process.exit(1);
  }
}

main();
