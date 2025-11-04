const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnoseBalanceSheet() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Diagnosing Balance Sheet Issues...\n');

    // Calculate balances from journal entries (like trial balance fix)
    console.log('1️⃣ Calculating account balances from journal entries...');
    const [calculatedBalances] = await connection.query(`
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
        ) as calculated_balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY coa.type, coa.code
    `);

    // Get Petty Cash from petty_cash_accounts
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);
    const pettyCashBalance = parseFloat(pettyCashResult[0]?.total_balance || 0);

    // Process balances and group by type
    const balanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: []
    };

    calculatedBalances.forEach(row => {
      let balance = parseFloat(row.calculated_balance || 0);
      
      // Replace Petty Cash balance
      if (row.account_code === '10001') {
        balance = pettyCashBalance;
      }

      // Calculate debit/credit balances
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

      const account = {
        code: row.account_code,
        name: row.account_name,
        type: row.account_type,
        currentBalance: balance,
        debitBalance,
        creditBalance
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
    const totalAssets = balanceSheet.assets.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                       balanceSheet.assets.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const liabilitiesFromAccounts = balanceSheet.liabilities.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                                    balanceSheet.liabilities.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalLiabilities = liabilitiesFromAccounts + totalPrepayments;
    
    const totalEquity = balanceSheet.equity.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                       balanceSheet.equity.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalRevenue = balanceSheet.revenue.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                        balanceSheet.revenue.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalExpenses = balanceSheet.expenses.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                         balanceSheet.expenses.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const netIncome = totalRevenue - totalExpenses;
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalAssetsFinal = totalAssets + totalDebtors;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;

    console.log('2️⃣ Balance Sheet Summary:');
    console.log(`   Assets (from COA): ${totalAssets.toFixed(2)}`);
    console.log(`   Student Debtors: ${totalDebtors.toFixed(2)}`);
    console.log(`   Total Assets: ${totalAssetsFinal.toFixed(2)}`);
    console.log(`   Liabilities (from COA): ${liabilitiesFromAccounts.toFixed(2)}`);
    console.log(`   Student Prepayments: ${totalPrepayments.toFixed(2)}`);
    console.log(`   Total Liabilities: ${totalLiabilities.toFixed(2)}`);
    console.log(`   Equity: ${totalEquity.toFixed(2)}`);
    console.log(`   Revenue: ${totalRevenue.toFixed(2)}`);
    console.log(`   Expenses: ${totalExpenses.toFixed(2)}`);
    console.log(`   Net Income: ${netIncome.toFixed(2)}`);
    console.log(`   Total Equity (with income): ${totalEquityWithIncome.toFixed(2)}`);
    console.log(`   Total Liabilities + Equity: ${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`   Difference: ${(totalAssetsFinal - totalLiabilitiesAndEquity).toFixed(2)}`);

    if (Math.abs(totalAssetsFinal - totalLiabilitiesAndEquity) < 0.01) {
      console.log('\n✅ Balance Sheet is BALANCED!\n');
    } else {
      console.log(`\n❌ Balance Sheet is NOT balanced! Difference: ${(totalAssetsFinal - totalLiabilitiesAndEquity).toFixed(2)}\n`);
    }

    // Compare with current_account_balances (what the controller currently uses)
    console.log('3️⃣ Comparing with current_account_balances (current implementation)...');
    const [storedBalances] = await connection.query(`
      SELECT 
        coa.id,
        coa.code,
        coa.name,
        coa.type,
        COALESCE(cab.current_balance, 0) as stored_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      ORDER BY coa.type, coa.code
    `);

    const storedBalanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: []
    };

    storedBalances.forEach(row => {
      const balance = parseFloat(row.stored_balance || 0);
      
      let debitBalance = 0;
      let creditBalance = 0;

      if (row.type === 'Asset' || row.type === 'Expense') {
        if (balance > 0) {
          debitBalance = balance;
        } else if (balance < 0) {
          creditBalance = Math.abs(balance);
        }
      } else if (row.type === 'Liability' || row.type === 'Equity' || row.type === 'Revenue') {
        if (balance > 0) {
          creditBalance = balance;
        } else if (balance < 0) {
          debitBalance = Math.abs(balance);
        }
      }

      const account = {
        code: row.code,
        name: row.name,
        type: row.type,
        currentBalance: balance,
        debitBalance,
        creditBalance
      };

      switch (row.type) {
        case 'Asset':
          storedBalanceSheet.assets.push(account);
          break;
        case 'Liability':
          storedBalanceSheet.liabilities.push(account);
          break;
        case 'Equity':
          storedBalanceSheet.equity.push(account);
          break;
        case 'Revenue':
          storedBalanceSheet.revenue.push(account);
          break;
        case 'Expense':
          storedBalanceSheet.expenses.push(account);
          break;
      }
    });

    const storedTotalAssets = storedBalanceSheet.assets.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                             storedBalanceSheet.assets.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const storedTotalLiabilities = storedBalanceSheet.liabilities.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                                   storedBalanceSheet.liabilities.reduce((sum, acc) => sum + acc.debitBalance, 0) + totalPrepayments;
    
    const storedTotalEquity = storedBalanceSheet.equity.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                             storedBalanceSheet.equity.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const storedTotalRevenue = storedBalanceSheet.revenue.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                              storedBalanceSheet.revenue.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const storedTotalExpenses = storedBalanceSheet.expenses.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                               storedBalanceSheet.expenses.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const storedNetIncome = storedTotalRevenue - storedTotalExpenses;
    const storedTotalEquityWithIncome = storedTotalEquity + storedNetIncome;
    const storedTotalAssetsFinal = storedTotalAssets + totalDebtors;
    const storedTotalLiabilitiesAndEquity = storedTotalLiabilities + storedTotalEquityWithIncome;

    console.log(`   Stored Assets: ${storedTotalAssetsFinal.toFixed(2)}`);
    console.log(`   Stored Liabilities + Equity: ${storedTotalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`   Stored Difference: ${(storedTotalAssetsFinal - storedTotalLiabilitiesAndEquity).toFixed(2)}`);
    console.log(`\n   Calculated Assets: ${totalAssetsFinal.toFixed(2)}`);
    console.log(`   Calculated Liabilities + Equity: ${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`   Difference between methods: ${(totalAssetsFinal - storedTotalAssetsFinal).toFixed(2)} (assets)`);
    console.log(`   Difference between methods: ${(totalLiabilitiesAndEquity - storedTotalLiabilitiesAndEquity).toFixed(2)} (L+E)`);

    console.log('\n✅ Diagnosis complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

diagnoseBalanceSheet();


