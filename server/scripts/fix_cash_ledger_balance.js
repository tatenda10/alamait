const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Analyzing current Cash balance...');
    
    // Get current Cash balance
    const [[cashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    console.log(`Current Cash balance: $${cashBalance?.current_balance || 0}`);
    
    // Get student payment total
    const [studentPayments] = await conn.query(
      `SELECT SUM(je.amount) as total_student_payments
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       JOIN transactions t ON je.transaction_id = t.id
       WHERE coa.code = '10002' AND t.transaction_type = 'payment' AND je.entry_type = 'debit' AND je.deleted_at IS NULL`
    );
    
    const studentPaymentTotal = parseFloat(studentPayments[0]?.total_student_payments || 0);
    console.log(`Student payments total: $${studentPaymentTotal.toFixed(2)}`);
    
    // Calculate what the cash balance should be after student payments
    const expectedCashBalance = studentPaymentTotal - 2640; // Subtract cash ledger expenses
    console.log(`Expected Cash balance (after student payments + cash ledger): $${expectedCashBalance.toFixed(2)}`);
    
    // The difference is what we need to adjust
    const currentBalance = parseFloat(cashBalance?.current_balance || 0);
    const adjustment = expectedCashBalance - currentBalance;
    console.log(`Adjustment needed: $${adjustment.toFixed(2)}`);
    
    if (Math.abs(adjustment) > 0.01) {
      console.log('\nStep 2: Adjusting Cash balance...');
      
      // Directly update the cash balance
      await conn.query(
        "UPDATE current_account_balances SET current_balance = current_balance + ? WHERE account_code = '10002'",
        [adjustment]
      );
      
      console.log(`✅ Adjusted Cash balance by $${adjustment.toFixed(2)}`);
      
      // Verify the new balance
      const [[newBalance]] = await conn.query(
        "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
      );
      console.log(`New Cash balance: $${newBalance?.current_balance || 0}`);
      console.log(`Expected: $${expectedCashBalance.toFixed(2)}`);
      console.log(`Match: ${Math.abs(parseFloat(newBalance?.current_balance || 0) - expectedCashBalance) < 0.01 ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('✅ Cash balance is already correct!');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Adjustment failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
