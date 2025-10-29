require('dotenv').config();
const mysql = require('mysql2/promise');

async function testBalanceSheet() {
  console.log('📊 Testing Balance Sheet Calculation...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get all account balances
    const [accounts] = await connection.execute(`
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      ORDER BY coa.type, coa.code
    `);

    // Group by type
    const assets = accounts.filter(a => a.account_type === 'Asset');
    const liabilities = accounts.filter(a => a.account_type === 'Liability');
    const equity = accounts.filter(a => a.account_type === 'Equity');
    const revenue = accounts.filter(a => a.account_type === 'Revenue');
    const expenses = accounts.filter(a => a.account_type === 'Expense');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ASSETS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.table(assets.map(a => ({
      Code: a.account_code,
      Name: a.account_name,
      Balance: parseFloat(a.current_balance).toFixed(2)
    })));
    
    const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    
    // Get student debtors
    const [debtorsTotal] = await connection.execute(`
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
    
    const studentDebtors = parseFloat(debtorsTotal[0].total);
    console.log('\n💰 Student Debtors (Students Who Owe): $' + studentDebtors.toFixed(2));
    const totalAssetsWithDebtors = totalAssets + studentDebtors;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TOTAL ASSETS: $' + totalAssetsWithDebtors.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LIABILITIES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.table(liabilities.map(a => ({
      Code: a.account_code,
      Name: a.account_name,
      Balance: parseFloat(a.current_balance).toFixed(2)
    })));
    
    const totalLiabilitiesFromAccounts = liabilities.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    
    // Get student prepayments
    const [prepaymentsTotal] = await connection.execute(`
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
    
    const studentPrepayments = parseFloat(prepaymentsTotal[0].total);
    console.log('\n💰 Student Prepayments (Students Who Prepaid): $' + studentPrepayments.toFixed(2));
    const totalLiabilities = totalLiabilitiesFromAccounts + studentPrepayments;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TOTAL LIABILITIES: $' + totalLiabilities.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 EQUITY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.table(equity.map(a => ({
      Code: a.account_code,
      Name: a.account_name,
      Balance: parseFloat(a.current_balance).toFixed(2)
    })));
    
    const totalEquity = equity.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TOTAL EQUITY: $' + totalEquity.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 REVENUE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.table(revenue.map(a => ({
      Code: a.account_code,
      Name: a.account_name,
      Balance: parseFloat(a.current_balance).toFixed(2)
    })));
    
    const totalRevenue = revenue.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TOTAL REVENUE: $' + totalRevenue.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 EXPENSES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.table(expenses.map(a => ({
      Code: a.account_code,
      Name: a.account_name,
      Balance: parseFloat(a.current_balance).toFixed(2)
    })));
    
    const totalExpenses = expenses.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TOTAL EXPENSES: $' + totalExpenses.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Calculate net income
    const netIncome = totalRevenue - totalExpenses;
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║         BALANCE SHEET EQUATION CHECK          ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║ Assets = Liabilities + Equity + Net Income    ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;
    
    console.log('LEFT SIDE (Assets):');
    console.log('  Assets from accounts: $' + totalAssets.toFixed(2));
    console.log('  + Student Debtors: $' + studentDebtors.toFixed(2));
    console.log('  ────────────────────────────────');
    console.log('  TOTAL ASSETS: $' + totalAssetsWithDebtors.toFixed(2));
    
    console.log('\nRIGHT SIDE (Liabilities + Equity):');
    console.log('  Liabilities from accounts: $' + totalLiabilitiesFromAccounts.toFixed(2));
    console.log('  + Student Prepayments: $' + studentPrepayments.toFixed(2));
    console.log('  ────────────────────────────────');
    console.log('  Total Liabilities: $' + totalLiabilities.toFixed(2));
    console.log('\n  Equity: $' + totalEquity.toFixed(2));
    console.log('  + Net Income (Revenue - Expenses): $' + netIncome.toFixed(2));
    console.log('    (Revenue: $' + totalRevenue.toFixed(2) + ' - Expenses: $' + totalExpenses.toFixed(2) + ')');
    console.log('  ────────────────────────────────');
    console.log('  Total Equity with Income: $' + totalEquityWithIncome.toFixed(2));
    console.log('\n  ────────────────────────────────');
    console.log('  TOTAL LIABILITIES + EQUITY: $' + totalLiabilitiesAndEquity.toFixed(2));
    
    console.log('\n════════════════════════════════════════════════');
    const difference = totalAssetsWithDebtors - totalLiabilitiesAndEquity;
    const isBalanced = Math.abs(difference) < 0.01;
    
    if (isBalanced) {
      console.log('✅ BALANCE SHEET IS BALANCED! ✅');
    } else {
      console.log('❌ BALANCE SHEET IS NOT BALANCED! ❌');
      console.log('\nDifference: $' + difference.toFixed(2));
      
      if (difference > 0) {
        console.log('Assets are HIGHER than Liabilities + Equity by $' + Math.abs(difference).toFixed(2));
        console.log('💡 This means either:');
        console.log('   - Missing liabilities or equity');
        console.log('   - Expenses not recorded properly');
        console.log('   - Revenue recorded but not in equity');
      } else {
        console.log('Liabilities + Equity are HIGHER than Assets by $' + Math.abs(difference).toFixed(2));
        console.log('💡 This means either:');
        console.log('   - Missing assets');
        console.log('   - Extra liabilities recorded');
        console.log('   - Revenue overstated');
      }
    }
    console.log('════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

testBalanceSheet();
