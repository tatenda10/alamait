const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking student payment transaction dates...\n');
    
    // Get student payment transactions with their dates
    const [payments] = await conn.query(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.transaction_date,
        t.description,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_credit.code as credit_account_code
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE t.transaction_type = 'payment'
        AND t.deleted_at IS NULL
        AND coa_credit.code = '10005'  -- Credit to Accounts Receivable
        AND coa_debit.code IN ('10001', '10002', '10003', '10004')  -- Debit to cash accounts
      ORDER BY t.transaction_date DESC
      LIMIT 10
    `);
    
    console.log(`Found ${payments.length} student payment transactions:\n`);
    
    payments.forEach(payment => {
      console.log(`${payment.reference} - $${payment.amount} (${payment.transaction_date})`);
      console.log(`  Debit: ${payment.debit_account_code} | Credit: ${payment.credit_account_code}`);
      console.log(`  Description: ${payment.description}`);
      console.log('');
    });
    
    // Check date ranges
    const [dateRange] = await conn.query(`
      SELECT 
        MIN(transaction_date) as earliest_date,
        MAX(transaction_date) as latest_date,
        COUNT(*) as total_count
      FROM transactions 
      WHERE transaction_type = 'payment' 
        AND deleted_at IS NULL
    `);
    
    console.log('Student payment date range:');
    console.log(`  Earliest: ${dateRange[0].earliest_date}`);
    console.log(`  Latest: ${dateRange[0].latest_date}`);
    console.log(`  Total payments: ${dateRange[0].total_count}`);
    
    // Check what dates we're analyzing in the cash flow
    console.log('\nCash flow analysis date range:');
    console.log('  Current analysis: All transactions (no date filter)');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();


