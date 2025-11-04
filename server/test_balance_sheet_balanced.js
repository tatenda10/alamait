const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBalanceSheet() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Testing Balance Sheet Calculation...\n');

    // Calculate balances from journal entries
    let query = `
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
    `;

    const [rows] = await connection.query(query);

    // Get Petty Cash
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);
    const pettyCashBalance = parseFloat(pettyCashResult[0]?.total_balance || 0);

    // Process rows
    const processedRows = rows.map(row => {
      let balance = parseFloat(row.current_balance || 0);
      
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
        code: row.account_code,
        name: row.account_name,
        type: row.account_type,
        currentBalance: balance,
        debitBalance,
        creditBalance
      };
    });

    // Group by type (including AR - Accounts Receivable already includes all student balances)
    const balanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: []
    };

    processedRows.forEach(row => {
      // Include all accounts including AR

      switch (row.type) {
        case 'Asset':
          balanceSheet.assets.push(row);
          break;
        case 'Liability':
          balanceSheet.liabilities.push(row);
          break;
        case 'Equity':
          balanceSheet.equity.push(row);
          break;
        case 'Revenue':
          balanceSheet.revenue.push(row);
          break;
        case 'Expense':
          balanceSheet.expenses.push(row);
          break;
      }
    });

    // Get student debtors and prepayments
    const [debtorsTotal] = await connection.query(`
      SELECT COALESCE(SUM(ABS(sab.current_balance)), 0) as total
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
    `);

    const [prepaymentsTotal] = await connection.query(`
      SELECT COALESCE(SUM(sab.current_balance), 0) as total
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
    `);

    const totalDebtors = parseFloat(debtorsTotal[0].total);
    const totalPrepayments = parseFloat(prepaymentsTotal[0].total);

    // Calculate totals
    // Note: Accounts Receivable already includes all student balances, so don't add debtors/prepayments separately
    const totalAssets = balanceSheet.assets.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                       balanceSheet.assets.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const totalLiabilities = balanceSheet.liabilities.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                            balanceSheet.liabilities.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalEquity = balanceSheet.equity.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                       balanceSheet.equity.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalRevenue = balanceSheet.revenue.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                        balanceSheet.revenue.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalExpenses = balanceSheet.expenses.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                         balanceSheet.expenses.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const netIncome = totalRevenue - totalExpenses;
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalAssetsFinal = totalAssets; // Use assets as-is, AR already included
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;

    console.log('📊 BALANCE SHEET CALCULATION:\n');
    console.log('ASSETS:');
    console.log(`  Assets (from COA, including AR): ${totalAssets.toFixed(2)}`);
    balanceSheet.assets.forEach(acc => {
      if (Math.abs(acc.currentBalance) > 0.01) {
        console.log(`    ${acc.code} - ${acc.name}: ${acc.currentBalance.toFixed(2)}`);
      }
    });
    console.log(`  (Note: Student Debtors: ${totalDebtors.toFixed(2)} - already included in AR)`);
    console.log(`  TOTAL ASSETS: ${totalAssetsFinal.toFixed(2)}\n`);

    console.log('LIABILITIES:');
    console.log(`  Liabilities (from COA): ${totalLiabilities.toFixed(2)}`);
    balanceSheet.liabilities.forEach(acc => {
      if (Math.abs(acc.currentBalance) > 0.01) {
        console.log(`    ${acc.code} - ${acc.name}: ${acc.currentBalance.toFixed(2)}`);
      }
    });
    console.log(`  (Note: Student Prepayments: ${totalPrepayments.toFixed(2)} - already included in AR)`);
    console.log(`  TOTAL LIABILITIES: ${totalLiabilities.toFixed(2)}\n`);

    console.log('EQUITY:');
    console.log(`  Equity (from COA): ${totalEquity.toFixed(2)}`);
    balanceSheet.equity.forEach(acc => {
      if (Math.abs(acc.currentBalance) > 0.01) {
        console.log(`    ${acc.code} - ${acc.name}: ${acc.currentBalance.toFixed(2)}`);
      }
    });
    console.log(`  Revenue: ${totalRevenue.toFixed(2)}`);
    console.log(`  Expenses: ${totalExpenses.toFixed(2)}`);
    console.log(`  Net Income: ${netIncome.toFixed(2)}`);
    console.log(`  TOTAL EQUITY (with income): ${totalEquityWithIncome.toFixed(2)}\n`);

    console.log('BALANCE CHECK:');
    console.log(`  Total Assets: ${totalAssetsFinal.toFixed(2)}`);
    console.log(`  Total Liabilities + Equity: ${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`  Difference: ${(totalAssetsFinal - totalLiabilitiesAndEquity).toFixed(2)}\n`);

    // Check Accounts Receivable
    const arAccount = processedRows.find(r => r.code === '10005');
    if (arAccount) {
      console.log('ACCOUNTS RECEIVABLE ANALYSIS:');
      console.log(`  AR Balance (from journal entries): ${arAccount.currentBalance.toFixed(2)}`);
      console.log(`  Student Debtors: ${totalDebtors.toFixed(2)}`);
      console.log(`  Student Prepayments: ${totalPrepayments.toFixed(2)}`);
      console.log(`  Net Student Balance (Debtors - Prepayments): ${(totalDebtors - totalPrepayments).toFixed(2)}`);
      console.log(`  AR should equal Net Student Balance: ${Math.abs(arAccount.currentBalance - (totalDebtors - totalPrepayments)) < 0.01 ? '✅ YES' : '❌ NO'}`);
      console.log(`  Difference: ${(arAccount.currentBalance - (totalDebtors - totalPrepayments)).toFixed(2)}\n`);
    }

    if (Math.abs(totalAssetsFinal - totalLiabilitiesAndEquity) < 0.01) {
      console.log('✅ BALANCE SHEET IS BALANCED!\n');
    } else {
      console.log(`❌ BALANCE SHEET IS NOT BALANCED! Difference: ${(totalAssetsFinal - totalLiabilitiesAndEquity).toFixed(2)}\n`);
      
      // Try to identify the issue
      console.log('🔍 DIAGNOSTIC:');
      console.log(`  If difference is negative, assets are less than L+E`);
      console.log(`  If difference is positive, assets are more than L+E`);
      console.log(`\n  Possible issues:`);
      console.log(`    1. Accounts Receivable balance doesn't match student balances`);
      console.log(`    2. Missing journal entries`);
      console.log(`    3. Incorrect account type classifications`);
      console.log(`    4. Date filtering issue (if asOfDate used)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testBalanceSheet();

