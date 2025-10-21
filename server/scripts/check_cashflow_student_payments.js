const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking cash flow student payments for September 2025...');
    
    // Get cash account IDs
    const [cashAccounts] = await conn.query(
      `SELECT id, code, name FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')
       AND type = 'Asset' AND deleted_at IS NULL`
    );
    
    const cashAccountIds = cashAccounts.map(acc => acc.id);
    console.log('Cash account IDs:', cashAccountIds);
    
    // Get all transactions with their journal entries for September 2025
    const [transactions] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.name as credit_account_name
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
        AND (je_debit.account_id IN (${cashAccountIds.map(() => '?').join(',')}) 
             OR je_credit.account_id IN (${cashAccountIds.map(() => '?').join(',')}))
      ORDER BY t.transaction_date`,
      [...cashAccountIds, ...cashAccountIds]
    );
    
    console.log(`\nFound ${transactions.length} cash-related transactions in September 2025`);
    
    // Check for student payment transactions
    const studentPayments = transactions.filter(tx => 
      tx.transaction_type === 'payment' && 
      cashAccountIds.includes(tx.debit_account_id) &&
      tx.credit_account_code === '10005'
    );
    
    console.log(`\nStudent payment transactions: ${studentPayments.length}`);
    
    if (studentPayments.length > 0) {
      console.log('Sample student payments:');
      studentPayments.slice(0, 5).forEach(payment => {
        console.log(`  ${payment.transaction_date}: ${payment.description} - $${payment.amount} (Debit: ${payment.debit_account_name}, Credit: ${payment.credit_account_name})`);
      });
      
      const totalStudentPayments = studentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      console.log(`\nTotal student payments: $${totalStudentPayments.toFixed(2)}`);
    } else {
      console.log('❌ No student payment transactions found!');
    }
    
    // Check for any transactions with Accounts Receivable (10005)
    const arTransactions = transactions.filter(tx => 
      tx.debit_account_code === '10005' || tx.credit_account_code === '10005'
    );
    
    console.log(`\nAccounts Receivable transactions: ${arTransactions.length}`);
    
    if (arTransactions.length > 0) {
      console.log('Sample AR transactions:');
      arTransactions.slice(0, 5).forEach(tx => {
        console.log(`  ${tx.transaction_date}: ${tx.description} - $${tx.amount} (${tx.transaction_type})`);
      });
    }
    
    // Check for cash inflows (when cash is debited)
    const cashInflows = transactions.filter(tx => 
      cashAccountIds.includes(tx.debit_account_id) && 
      !cashAccountIds.includes(tx.credit_account_id)
    );
    
    console.log(`\nCash inflow transactions: ${cashInflows.length}`);
    
    if (cashInflows.length > 0) {
      console.log('Sample cash inflows:');
      cashInflows.slice(0, 5).forEach(inflow => {
        console.log(`  ${inflow.transaction_date}: ${inflow.description} - $${inflow.amount} (Credit: ${inflow.credit_account_name})`);
      });
      
      const totalInflows = cashInflows.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      console.log(`\nTotal cash inflows: $${totalInflows.toFixed(2)}`);
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
