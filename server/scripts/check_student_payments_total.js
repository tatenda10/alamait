const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking student payments total...');
    
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
    console.log(`Expected: $14,093.00`);
    console.log(`Match: ${Math.abs(studentPaymentTotal - 14093) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Get current Cash balance
    const [[cashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    console.log(`\nCurrent Cash balance: $${cashBalance?.current_balance || 0}`);
    
    // Calculate expected balance
    const expectedBalance = studentPaymentTotal - 2640; // Subtract cash ledger expenses
    console.log(`Expected Cash balance (student payments - cash expenses): $${expectedBalance.toFixed(2)}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
