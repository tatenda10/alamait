const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking Student Payment Transactions...\n');
    
    // Check what payment transactions exist
    const [payments] = await conn.query(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.boarding_house_id,
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
      WHERE t.transaction_type = 'payment'
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date DESC
      LIMIT 10
    `);
    
    console.log(`Found ${payments.length} payment transactions:\n`);
    
    payments.forEach(payment => {
      console.log(`Payment ID: ${payment.id}`);
      console.log(`  Reference: ${payment.reference}`);
      console.log(`  Amount: $${payment.amount}`);
      console.log(`  Date: ${payment.transaction_date}`);
      console.log(`  Description: ${payment.description}`);
      console.log(`  Debit: ${payment.debit_account_code} - ${payment.debit_account_name}`);
      console.log(`  Credit: ${payment.credit_account_code} - ${payment.credit_account_name}`);
      console.log('');
    });
    
    // Check student account balances
    console.log('Student Account Balances:\n');
    const [studentBalances] = await conn.query(`
      SELECT 
        s.full_name,
        s.student_number,
        sab.current_balance,
        sab.updated_at
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      WHERE sab.current_balance != 0
      ORDER BY sab.current_balance DESC
      LIMIT 10
    `);
    
    studentBalances.forEach(student => {
      console.log(`${student.full_name} (${student.student_number}): $${student.current_balance}`);
    });
    
    // Check Accounts Receivable balance
    console.log('\nAccounts Receivable Balance:');
    const [[arBalance]] = await conn.query(`
      SELECT current_balance FROM current_account_balances WHERE account_code = '10005'
    `);
    console.log(`AR Balance: $${arBalance?.current_balance || 0}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();


