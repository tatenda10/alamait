const db = require('../src/services/db');

async function analyze() {
  const conn = await db.getConnection();
  try {
    console.log('Analyzing Cash Flow Transactions...\n');
    
    // Get all transactions that affect cash accounts
    const [transactions] = await conn.query(`
      SELECT 
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
      WHERE t.deleted_at IS NULL
        AND t.status = 'posted'
        AND (coa_debit.code IN ('10001', '10002', '10003', '10004') 
             OR coa_credit.code IN ('10001', '10002', '10003', '10004'))
      ORDER BY t.transaction_date DESC
      LIMIT 20
    `);
    
    console.log(`Found ${transactions.length} cash-related transactions:\n`);
    
    let totalCashInflows = 0;
    let totalCashOutflows = 0;
    const categories = {};
    
    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount || 0);
      const isCashDebit = ['10001', '10002', '10003', '10004'].includes(txn.debit_account_code);
      const isCashCredit = ['10001', '10002', '10003', '10004'].includes(txn.credit_account_code);
      
      let category = 'Unknown';
      let isInflow = false;
      
      if (isCashDebit) {
        // Cash is debited (money coming in)
        isInflow = true;
        totalCashInflows += amount;
        
        if (txn.credit_account_code?.startsWith('4')) {
          category = 'Revenue Income';
        } else if (txn.credit_account_code?.startsWith('2')) {
          category = 'Loan/Advance';
        } else if (txn.credit_account_code?.startsWith('3')) {
          category = 'Owner Investment';
        } else if (txn.credit_account_code === '10005') {
          category = 'Accounts Receivable Collection';
        } else {
          category = 'Other Income';
        }
      } else if (isCashCredit) {
        // Cash is credited (money going out)
        isInflow = false;
        totalCashOutflows += amount;
        
        if (txn.debit_account_code?.startsWith('5')) {
          category = 'Operating Expenses';
        } else if (txn.debit_account_code?.startsWith('2')) {
          category = 'Loan Repayment';
        } else if (txn.debit_account_code?.startsWith('3')) {
          category = 'Owner Withdrawal';
        } else {
          category = 'Other Expenses';
        }
      }
      
      if (!categories[category]) {
        categories[category] = { inflows: 0, outflows: 0, count: 0 };
      }
      
      if (isInflow) {
        categories[category].inflows += amount;
      } else {
        categories[category].outflows += amount;
      }
      categories[category].count++;
      
      console.log(`${txn.transaction_type} - ${txn.reference}`);
      console.log(`  Date: ${txn.transaction_date}`);
      console.log(`  Amount: $${amount.toFixed(2)}`);
      console.log(`  Debit: ${txn.debit_account_code} - ${txn.debit_account_name}`);
      console.log(`  Credit: ${txn.credit_account_code} - ${txn.credit_account_name}`);
      console.log(`  Category: ${category} (${isInflow ? 'Inflow' : 'Outflow'})`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('CATEGORY SUMMARY:');
    for (const [category, data] of Object.entries(categories)) {
      if (data.inflows > 0 || data.outflows > 0) {
        console.log(`\n${category}:`);
        console.log(`  Inflows: $${data.inflows.toFixed(2)}`);
        console.log(`  Outflows: $${data.outflows.toFixed(2)}`);
        console.log(`  Count: ${data.count} transactions`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('TOTALS:');
    console.log(`Total Cash Inflows: $${totalCashInflows.toFixed(2)}`);
    console.log(`Total Cash Outflows: $${totalCashOutflows.toFixed(2)}`);
    console.log(`Net Cash Flow: $${(totalCashInflows - totalCashOutflows).toFixed(2)}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

analyze();


