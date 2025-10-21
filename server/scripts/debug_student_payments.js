const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Debugging student payment transactions...');
    
    // Check all payment transactions
    const [paymentTransactions] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.status,
        t.deleted_at
      FROM transactions t
      WHERE t.transaction_type = 'payment'
      ORDER BY t.transaction_date DESC
      LIMIT 10`
    );
    
    console.log(`\nPayment transactions found: ${paymentTransactions.length}`);
    paymentTransactions.forEach(tx => {
      console.log(`  ${tx.transaction_date}: ${tx.description} - $${tx.amount} (Status: ${tx.status}, Deleted: ${tx.deleted_at ? 'YES' : 'NO'})`);
    });
    
    // Check journal entries for payment transactions
    const [paymentJournals] = await conn.query(
      `SELECT 
        je.transaction_id,
        je.entry_type,
        je.amount,
        coa.code,
        coa.name,
        t.transaction_date,
        t.transaction_type
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_type = 'payment'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date DESC
      LIMIT 10`
    );
    
    console.log(`\nPayment journal entries: ${paymentJournals.length}`);
    paymentJournals.forEach(je => {
      console.log(`  ${je.transaction_date}: ${je.entry_type} $${je.amount} - ${je.code} (${je.name})`);
    });
    
    // Check specifically for September 2025 payment transactions
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
    
    console.log(`\nSeptember 2025 payment transactions: ${septPayments.length}`);
    if (septPayments.length > 0) {
      septPayments.slice(0, 5).forEach(tx => {
        console.log(`  ${tx.transaction_date}: ${tx.description} - $${tx.amount}`);
      });
    }
    
    // Check for any transactions with Cash account (10002) in September
    const [cashTransactions] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        je.entry_type,
        coa.code,
        coa.name
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND coa.code = '10002'
        AND t.deleted_at IS NULL
        AND je.deleted_at IS NULL
      ORDER BY t.transaction_date
      LIMIT 10`
    );
    
    console.log(`\nCash account (10002) transactions in September: ${cashTransactions.length}`);
    if (cashTransactions.length > 0) {
      cashTransactions.slice(0, 5).forEach(tx => {
        console.log(`  ${tx.transaction_date}: ${tx.entry_type} $${tx.amount} - ${tx.description}`);
      });
    }
    
    // Check student_payments table
    const [studentPayments] = await conn.query(
      `SELECT 
        sp.student_id,
        sp.amount,
        sp.payment_date,
        sp.payment_method,
        sp.status,
        s.full_name,
        t.transaction_id,
        t.transaction_date
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      LEFT JOIN transactions t ON sp.transaction_id = t.id
      WHERE DATE(sp.payment_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND sp.deleted_at IS NULL
      ORDER BY sp.payment_date
      LIMIT 10`
    );
    
    console.log(`\nStudent payments in September: ${studentPayments.length}`);
    if (studentPayments.length > 0) {
      studentPayments.slice(0, 5).forEach(sp => {
        console.log(`  ${sp.payment_date}: ${sp.full_name} - $${sp.amount} (Method: ${sp.payment_method}, Status: ${sp.status})`);
        console.log(`    Transaction ID: ${sp.transaction_id}, Transaction Date: ${sp.transaction_date}`);
      });
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