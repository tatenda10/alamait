const mysql = require('mysql2/promise');
require('dotenv').config();

async function compareReports() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const startDate = '2025-10-01';
    const endDate = '2025-10-31';

    console.log('\n=== COMPARING CASH FLOW VS INCOME STATEMENT ===');
    console.log(`Period: ${startDate} to ${endDate}\n`);

    // 1. Get Cash Flow Expenses (expenses paid with cash accounts)
    console.log('--- CASH FLOW EXPENSES (Actual Cash Outflows) ---\n');

    const [cashAccounts] = await connection.query(`
      SELECT id, code, name FROM chart_of_accounts 
      WHERE code IN ('10001', '10002', '10003', '10004')
      AND type = 'Asset'
      AND deleted_at IS NULL
    `);

    const cashAccountIds = cashAccounts.map(acc => acc.id);
    console.log('Cash Accounts:', cashAccounts.map(a => `${a.code} - ${a.name}`).join(', '));
    console.log('');

    // Get all expense transactions where cash was credited (cash went out)
    const [cashFlowExpenses] = await connection.query(`
      SELECT 
        coa_debit.code as expense_code,
        coa_debit.name as expense_name,
        coa_credit.code as cash_account_code,
        coa_credit.name as cash_account_name,
        SUM(je_debit.amount) as total_amount,
        COUNT(DISTINCT t.id) as transaction_count
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
        AND coa_debit.type = 'Expense'
        AND je_credit.account_id IN (${cashAccountIds.map(() => '?').join(',')})
      GROUP BY coa_debit.code, coa_debit.name, coa_credit.code, coa_credit.name
      ORDER BY total_amount DESC
    `, [startDate, endDate, ...cashAccountIds]);

    let cashFlowTotal = 0;
    console.log('Expense Account'.padEnd(40) + 'Paid From'.padEnd(25) + 'Amount'.padStart(12));
    console.log('='.repeat(80));
    
    cashFlowExpenses.forEach(exp => {
      const account = `${exp.expense_code} - ${exp.expense_name}`.padEnd(40);
      const paidFrom = exp.cash_account_name.padEnd(25);
      const amountNum = Number(exp.total_amount);
      const amount = `$${amountNum.toFixed(2)}`.padStart(12);
      console.log(`${account}${paidFrom}${amount}`);
      cashFlowTotal += amountNum;
    });

    console.log('='.repeat(80));
    console.log('TOTAL CASH FLOW EXPENSES:'.padEnd(65) + `$${cashFlowTotal.toFixed(2)}`.padStart(12));
    console.log('');

    // 2. Get Income Statement Expenses (all expenses, regardless of payment method)
    console.log('\n--- INCOME STATEMENT EXPENSES (All Expenses) ---\n');

    const [incomeStmtExpenses] = await connection.query(`
      SELECT 
        coa.code,
        coa.name as account_name,
        coa.type as account_type,
        SUM(je.amount) as amount,
        COUNT(DISTINCT t.id) as transaction_count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
        AND t.status = 'posted'
        AND t.deleted_at IS NULL
        AND je.entry_type = 'debit'
        AND coa.type = 'Expense'
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY amount DESC
    `, [startDate, endDate]);

    let incomeStmtTotal = 0;
    console.log('Expense Account'.padEnd(50) + 'Transactions'.padEnd(15) + 'Amount'.padStart(12));
    console.log('='.repeat(80));
    
    incomeStmtExpenses.forEach(exp => {
      const account = `${exp.code} - ${exp.account_name}`.padEnd(50);
      const txnCount = `${exp.transaction_count}`.padEnd(15);
      const amountNum = Number(exp.amount);
      const amount = `$${amountNum.toFixed(2)}`.padStart(12);
      console.log(`${account}${txnCount}${amount}`);
      incomeStmtTotal += amountNum;
    });

    console.log('='.repeat(80));
    console.log('TOTAL INCOME STATEMENT EXPENSES:'.padEnd(65) + `$${incomeStmtTotal.toFixed(2)}`.padStart(12));
    console.log('');

    // 3. Comparison
    console.log('\n--- COMPARISON ---\n');
    console.log(`Cash Flow Expenses:         $${cashFlowTotal.toFixed(2)}`);
    console.log(`Income Statement Expenses:  $${incomeStmtTotal.toFixed(2)}`);
    console.log(`Difference:                 $${(incomeStmtTotal - cashFlowTotal).toFixed(2)}`);
    console.log('');

    if (Math.abs(incomeStmtTotal - cashFlowTotal) < 0.01) {
      console.log('✅ MATCH! All expenses were paid with cash.');
    } else {
      console.log('⚠️  MISMATCH! Some expenses were not paid with cash (likely on credit/accounts payable).');
      
      // Find expenses that are in income statement but not in cash flow
      console.log('\n--- EXPENSES NOT PAID WITH CASH ---\n');
      
      const [nonCashExpenses] = await connection.query(`
        SELECT 
          coa_debit.code as expense_code,
          coa_debit.name as expense_name,
          coa_credit.code as liability_code,
          coa_credit.name as liability_name,
          SUM(je_debit.amount) as total_amount,
          COUNT(DISTINCT t.id) as transaction_count
        FROM transactions t
        JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
        JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
        JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
        JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
        WHERE DATE(t.transaction_date) BETWEEN ? AND ?
          AND t.deleted_at IS NULL
          AND t.status = 'posted'
          AND coa_debit.type = 'Expense'
          AND je_credit.account_id NOT IN (${cashAccountIds.map(() => '?').join(',')})
        GROUP BY coa_debit.code, coa_debit.name, coa_credit.code, coa_credit.name
        ORDER BY total_amount DESC
      `, [startDate, endDate, ...cashAccountIds]);

      if (nonCashExpenses.length > 0) {
        console.log('Expense Account'.padEnd(40) + 'Credited To'.padEnd(25) + 'Amount'.padStart(12));
        console.log('='.repeat(80));
        
        let nonCashTotal = 0;
        nonCashExpenses.forEach(exp => {
          const account = `${exp.expense_code} - ${exp.expense_name}`.padEnd(40);
          const creditedTo = `${exp.liability_code} - ${exp.liability_name}`.padEnd(25);
          const amountNum = Number(exp.total_amount);
          const amount = `$${amountNum.toFixed(2)}`.padStart(12);
          console.log(`${account}${creditedTo}${amount}`);
          nonCashTotal += amountNum;
        });
        
        console.log('='.repeat(80));
        console.log('TOTAL NON-CASH EXPENSES:'.padEnd(65) + `$${nonCashTotal.toFixed(2)}`.padStart(12));
      } else {
        console.log('No non-cash expenses found.');
      }
    }

    console.log('\n');
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

compareReports();

