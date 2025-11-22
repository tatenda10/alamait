require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function displayBalanceSheet() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('BALANCE SHEET REPORT');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    const reportDate = new Date().toISOString().split('T')[0];
    console.log(`Report Date: ${reportDate}\n`);

    // Calculate balances directly from journal entries
    const [rows] = await connection.query(`
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(
          SUM(
            CASE 
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
              ELSE 0
            END
          ), 0
        ) as current_balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY coa.type, coa.code
    `);

    // Get Petty Cash balance
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);
    const pettyCashBalance = parseFloat(pettyCashResult[0]?.total_balance || 0);

    // Get Student Debtors and Prepayments
    const [studentBalances] = await connection.query(`
      SELECT 
        SUM(CASE WHEN sab.current_balance < 0 THEN ABS(sab.current_balance) ELSE 0 END) as total_debtors,
        SUM(CASE WHEN sab.current_balance > 0 THEN sab.current_balance ELSE 0 END) as total_prepayments
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND sab.current_balance != 0
    `);
    
    const studentDebtors = parseFloat(studentBalances[0]?.total_debtors || 0);
    const studentPrepayments = parseFloat(studentBalances[0]?.total_prepayments || 0);

    // Process rows - EXCLUDE Accounts Receivable (10005)
    const processedRows = rows
      .filter(row => row.account_code !== '10005') // Exclude Accounts Receivable
      .map(row => {
        let balance = parseFloat(row.current_balance || 0);
        
        // Replace Petty Cash balance
        if (row.account_code === '10001') {
          balance = pettyCashBalance;
        }
        
        let debitBalance = 0;
        let creditBalance = 0;
        
        if (row.account_type === 'Asset' || row.account_type === 'Expense') {
          if (balance > 0) {
            debitBalance = balance;
          } else if (balance < 0) {
            creditBalance = Math.abs(balance);
          }
        } else if (row.account_type === 'Liability' || row.account_type === 'Equity' || row.account_type === 'Revenue') {
          if (balance > 0) {
            creditBalance = balance;
          } else if (balance < 0) {
            debitBalance = Math.abs(balance);
          }
        }
        
        return {
          account_code: row.account_code,
          account_name: row.account_name,
          account_type: row.account_type,
          current_balance: balance,
          debit_balance: debitBalance,
          credit_balance: creditBalance
        };
      });

    // Group by type
    const balanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: []
    };

    processedRows.forEach(row => {
      if (Math.abs(row.current_balance) < 0.01) return; // Skip zero balances
      
      const account = {
        code: row.account_code,
        name: row.account_name,
        debitBalance: row.debit_balance,
        creditBalance: row.credit_balance
      };

      switch (row.account_type) {
        case 'Asset':
          balanceSheet.assets.push(account);
          break;
        case 'Liability':
          balanceSheet.liabilities.push(account);
          break;
        case 'Equity':
          balanceSheet.equity.push(account);
          break;
        case 'Revenue':
          balanceSheet.revenue.push(account);
          break;
        case 'Expense':
          balanceSheet.expenses.push(account);
          break;
      }
    });

    // Add Student Debtors to Assets (if > 0)
    if (studentDebtors > 0) {
      balanceSheet.assets.push({
        code: 'STU-DEBT',
        name: 'Student Debtors',
        debitBalance: studentDebtors,
        creditBalance: 0
      });
    }

    // Add Student Prepayments to Liabilities (if > 0)
    if (studentPrepayments > 0) {
      balanceSheet.liabilities.push({
        code: 'STU-PREP',
        name: 'Student Prepayments',
        debitBalance: 0,
        creditBalance: studentPrepayments
      });
    }

    // Calculate totals
    const totalAssets = balanceSheet.assets.reduce((sum, acc) => sum + acc.debitBalance - acc.creditBalance, 0);
    const totalLiabilities = balanceSheet.liabilities.reduce((sum, acc) => sum + acc.creditBalance - acc.debitBalance, 0);
    const totalEquity = balanceSheet.equity.reduce((sum, acc) => sum + acc.creditBalance - acc.debitBalance, 0);
    const totalRevenue = balanceSheet.revenue.reduce((sum, acc) => sum + acc.creditBalance - acc.debitBalance, 0);
    const totalExpenses = balanceSheet.expenses.reduce((sum, acc) => sum + acc.debitBalance - acc.creditBalance, 0);
    const netIncome = totalRevenue - totalExpenses;
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;

    // Display Balance Sheet
    console.log('ASSETS');
    console.log('-'.repeat(80));
    console.log(`${'Account Code'.padEnd(15)} ${'Account Name'.padEnd(40)} ${'Debit'.padStart(15)} ${'Credit'.padStart(15)}`);
    console.log('-'.repeat(80));
    balanceSheet.assets.forEach(acc => {
      console.log(`${acc.code.padEnd(15)} ${acc.name.padEnd(40)} ${acc.debitBalance.toFixed(2).padStart(15)} ${acc.creditBalance.toFixed(2).padStart(15)}`);
    });
    console.log('-'.repeat(80));
    console.log(`${'TOTAL ASSETS'.padEnd(56)} ${totalAssets.toFixed(2).padStart(15)} ${'0.00'.padStart(15)}`);
    console.log('');

    console.log('LIABILITIES');
    console.log('-'.repeat(80));
    console.log(`${'Account Code'.padEnd(15)} ${'Account Name'.padEnd(40)} ${'Debit'.padStart(15)} ${'Credit'.padStart(15)}`);
    console.log('-'.repeat(80));
    balanceSheet.liabilities.forEach(acc => {
      console.log(`${acc.code.padEnd(15)} ${acc.name.padEnd(40)} ${acc.debitBalance.toFixed(2).padStart(15)} ${acc.creditBalance.toFixed(2).padStart(15)}`);
    });
    console.log('-'.repeat(80));
    console.log(`${'TOTAL LIABILITIES'.padEnd(56)} ${'0.00'.padStart(15)} ${totalLiabilities.toFixed(2).padStart(15)}`);
    console.log('');

    console.log('EQUITY');
    console.log('-'.repeat(80));
    console.log(`${'Account Code'.padEnd(15)} ${'Account Name'.padEnd(40)} ${'Debit'.padStart(15)} ${'Credit'.padStart(15)}`);
    console.log('-'.repeat(80));
    balanceSheet.equity.forEach(acc => {
      console.log(`${acc.code.padEnd(15)} ${acc.name.padEnd(40)} ${acc.debitBalance.toFixed(2).padStart(15)} ${acc.creditBalance.toFixed(2).padStart(15)}`);
    });
    console.log('-'.repeat(80));
    console.log(`${'TOTAL EQUITY (before net income)'.padEnd(56)} ${'0.00'.padStart(15)} ${totalEquity.toFixed(2).padStart(15)}`);
    console.log('');

    console.log('REVENUE');
    console.log('-'.repeat(80));
    console.log(`${'Account Code'.padEnd(15)} ${'Account Name'.padEnd(40)} ${'Debit'.padStart(15)} ${'Credit'.padStart(15)}`);
    console.log('-'.repeat(80));
    balanceSheet.revenue.forEach(acc => {
      console.log(`${acc.code.padEnd(15)} ${acc.name.padEnd(40)} ${acc.debitBalance.toFixed(2).padStart(15)} ${acc.creditBalance.toFixed(2).padStart(15)}`);
    });
    console.log('-'.repeat(80));
    console.log(`${'TOTAL REVENUE'.padEnd(56)} ${'0.00'.padStart(15)} ${totalRevenue.toFixed(2).padStart(15)}`);
    console.log('');

    console.log('EXPENSES');
    console.log('-'.repeat(80));
    console.log(`${'Account Code'.padEnd(15)} ${'Account Name'.padEnd(40)} ${'Debit'.padStart(15)} ${'Credit'.padStart(15)}`);
    console.log('-'.repeat(80));
    balanceSheet.expenses.forEach(acc => {
      console.log(`${acc.code.padEnd(15)} ${acc.name.padEnd(40)} ${acc.debitBalance.toFixed(2).padStart(15)} ${acc.creditBalance.toFixed(2).padStart(15)}`);
    });
    console.log('-'.repeat(80));
    console.log(`${'TOTAL EXPENSES'.padEnd(56)} ${totalExpenses.toFixed(2).padStart(15)} ${'0.00'.padStart(15)}`);
    console.log('');

    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Assets:                    $${totalAssets.toFixed(2)}`);
    console.log(`Total Liabilities:               $${totalLiabilities.toFixed(2)}`);
    console.log(`Total Equity (before net income): $${totalEquity.toFixed(2)}`);
    console.log(`Total Revenue:                   $${totalRevenue.toFixed(2)}`);
    console.log(`Total Expenses:                  $${totalExpenses.toFixed(2)}`);
    console.log(`Net Income:                      $${netIncome.toFixed(2)}`);
    console.log(`Total Equity (with net income):  $${totalEquityWithIncome.toFixed(2)}`);
    console.log(`Total Liabilities + Equity:      $${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log('');
    console.log(`Balance Check: ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? '✅ BALANCED' : '❌ NOT BALANCED'}`);
    console.log(`Difference: $${Math.abs(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Balance Sheet Report Complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error displaying balance sheet:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

displayBalanceSheet();

