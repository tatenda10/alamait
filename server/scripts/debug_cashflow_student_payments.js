const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Debugging cash flow student payments...');
    
    // Get cash account IDs
    const [cashAccounts] = await conn.query(
      `SELECT id, code, name FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')
       AND type = 'Asset' AND deleted_at IS NULL`
    );
    
    const cashAccountIds = cashAccounts.map(acc => acc.id);
    console.log('Cash account IDs:', cashAccountIds);
    
    // Check student payment transactions in September 2025
    const [studentPayments] = await conn.query(
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
      WHERE t.transaction_type = 'payment'
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND t.deleted_at IS NULL
        AND je_debit.deleted_at IS NULL
        AND je_credit.deleted_at IS NULL
      ORDER BY t.transaction_date
      LIMIT 5`
    );
    
    console.log(`\nStudent payment transactions found: ${studentPayments.length}`);
    
    if (studentPayments.length > 0) {
      console.log('Sample student payment transactions:');
      studentPayments.forEach(tx => {
        console.log(`  Transaction ${tx.id}: ${tx.description}`);
        console.log(`    Amount: $${tx.amount}`);
        console.log(`    Date: ${tx.transaction_date}`);
        console.log(`    Debit: ${tx.debit_account_code} (${tx.debit_account_name}) - ID: ${tx.debit_account_id}`);
        console.log(`    Credit: ${tx.credit_account_code} (${tx.credit_account_name}) - ID: ${tx.credit_account_id}`);
        console.log(`    Cash account involved: ${cashAccountIds.includes(tx.debit_account_id) ? 'YES (Debit)' : 'NO'}`);
        console.log(`    AR account involved: ${tx.credit_account_code === '10005' ? 'YES' : 'NO'}`);
        console.log('');
      });
    }
    
    // Check if any student payments match the cash flow criteria
    const [matchingPayments] = await conn.query(
      `SELECT 
        t.id,
        t.description,
        t.amount,
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
        AND DATE(t.transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
        AND t.deleted_at IS NULL
        AND je_debit.deleted_at IS NULL
        AND je_credit.deleted_at IS NULL
        AND je_debit.account_id IN (${cashAccountIds.map(() => '?').join(',')})
        AND coa_credit.code = '10005'
      ORDER BY t.transaction_date
      LIMIT 5`,
      [...cashAccountIds]
    );
    
    console.log(`\nStudent payments matching cash flow criteria: ${matchingPayments.length}`);
    
    if (matchingPayments.length > 0) {
      console.log('Sample matching payments:');
      matchingPayments.forEach(tx => {
        console.log(`  ${tx.description}: $${tx.amount} (Debit: ${tx.debit_account_code}, Credit: ${tx.credit_account_code})`);
      });
    } else {
      console.log('❌ No student payments match the cash flow criteria!');
      console.log('This means either:');
      console.log('1. Cash account is not being debited in student payments');
      console.log('2. Credit account is not 10005 (Accounts Receivable)');
      console.log('3. Transaction dates are not in September 2025');
    }
    
    // Check the exact query the cash flow controller uses
    console.log('\nTesting the exact cash flow query...');
    
    const [cashflowQuery] = await conn.query(
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
        coa_debit.type as debit_account_type,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.type as credit_account_type,
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
      ORDER BY t.transaction_date
      LIMIT 10`,
      [...cashAccountIds, ...cashAccountIds]
    );
    
    console.log(`\nCash flow query results: ${cashflowQuery.length} transactions`);
    
    if (cashflowQuery.length > 0) {
      console.log('Sample cash flow transactions:');
      cashflowQuery.forEach(tx => {
        const isCashInflow = cashAccountIds.includes(tx.debit_account_id);
        const isCashOutflow = cashAccountIds.includes(tx.credit_account_id);
        console.log(`  ${tx.transaction_type}: ${tx.description} - $${tx.amount}`);
        console.log(`    Cash Inflow: ${isCashInflow ? 'YES' : 'NO'} (Debit: ${tx.debit_account_code})`);
        console.log(`    Cash Outflow: ${isCashOutflow ? 'YES' : 'NO'} (Credit: ${tx.credit_account_code})`);
        console.log(`    Credit Account: ${tx.credit_account_code} (${tx.credit_account_name})`);
        console.log('');
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
