require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkBalanceSheetLogic() {
  console.log('🔍 Checking Balance Sheet Logic...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // 1. Check Chart of Accounts structure
    console.log('📊 Chart of Accounts Summary by Type:');
    const [typesSummary] = await connection.execute(`
      SELECT type, COUNT(*) as count 
      FROM chart_of_accounts 
      WHERE deleted_at IS NULL 
      GROUP BY type 
      ORDER BY type
    `);
    console.table(typesSummary);

    // 2. Check sample accounts from each type
    console.log('\n📋 Sample Accounts by Type:');
    const [accounts] = await connection.execute(`
      SELECT code, name, type 
      FROM chart_of_accounts 
      WHERE deleted_at IS NULL 
      ORDER BY type, code 
      LIMIT 30
    `);
    console.table(accounts);

    // 3. Check current balances
    console.log('\n💰 Current Account Balances (with balances):');
    const [balances] = await connection.execute(`
      SELECT 
        cab.account_code,
        coa.name as account_name,
        coa.type as account_type,
        cab.current_balance
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_code = coa.code
      WHERE coa.deleted_at IS NULL 
        AND cab.current_balance != 0
      ORDER BY coa.type, cab.account_code
    `);
    console.table(balances);

    // 4. Test the balance sheet calculation logic
    console.log('\n🧮 Testing Balance Sheet Calculation Logic:\n');
    
    const [rows] = await connection.execute(`
      SELECT 
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      ORDER BY coa.type, coa.code
    `);

    // Group by type and calculate totals
    const groupedAccounts = {
      Asset: [],
      Liability: [],
      Equity: [],
      Revenue: [],
      Expense: []
    };

    rows.forEach(row => {
      if (row.current_balance !== 0 || row.debit_balance !== 0 || row.credit_balance !== 0) {
        groupedAccounts[row.account_type].push({
          code: row.account_code,
          name: row.account_name,
          current_balance: parseFloat(row.current_balance),
          debit_balance: parseFloat(row.debit_balance),
          credit_balance: parseFloat(row.credit_balance)
        });
      }
    });

    // Calculate totals
    const calculateTotal = (accounts, field) => {
      return accounts.reduce((sum, acc) => sum + acc[field], 0);
    };

    const totalAssets = calculateTotal(groupedAccounts.Asset, 'debit_balance') - 
                       calculateTotal(groupedAccounts.Asset, 'credit_balance');
    
    const totalLiabilities = calculateTotal(groupedAccounts.Liability, 'credit_balance') - 
                            calculateTotal(groupedAccounts.Liability, 'debit_balance');
    
    const totalEquity = calculateTotal(groupedAccounts.Equity, 'credit_balance') - 
                       calculateTotal(groupedAccounts.Equity, 'debit_balance');
    
    const totalRevenue = calculateTotal(groupedAccounts.Revenue, 'credit_balance') - 
                        calculateTotal(groupedAccounts.Revenue, 'debit_balance');
    
    const totalExpenses = calculateTotal(groupedAccounts.Expense, 'debit_balance') - 
                         calculateTotal(groupedAccounts.Expense, 'credit_balance');
    
    const netIncome = totalRevenue - totalExpenses;
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;

    console.log('ASSETS:');
    groupedAccounts.Asset.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name}: Balance=${acc.current_balance}, Debit=${acc.debit_balance}, Credit=${acc.credit_balance}`);
    });
    console.log(`  TOTAL ASSETS: ${totalAssets.toFixed(2)}\n`);

    console.log('LIABILITIES:');
    groupedAccounts.Liability.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name}: Balance=${acc.current_balance}, Debit=${acc.debit_balance}, Credit=${acc.credit_balance}`);
    });
    console.log(`  TOTAL LIABILITIES: ${totalLiabilities.toFixed(2)}\n`);

    console.log('EQUITY:');
    groupedAccounts.Equity.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name}: Balance=${acc.current_balance}, Debit=${acc.debit_balance}, Credit=${acc.credit_balance}`);
    });
    console.log(`  TOTAL EQUITY: ${totalEquity.toFixed(2)}\n`);

    console.log('REVENUE:');
    groupedAccounts.Revenue.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name}: Balance=${acc.current_balance}, Debit=${acc.debit_balance}, Credit=${acc.credit_balance}`);
    });
    console.log(`  TOTAL REVENUE: ${totalRevenue.toFixed(2)}\n`);

    console.log('EXPENSES:');
    groupedAccounts.Expense.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name}: Balance=${acc.current_balance}, Debit=${acc.debit_balance}, Credit=${acc.credit_balance}`);
    });
    console.log(`  TOTAL EXPENSES: ${totalExpenses.toFixed(2)}\n`);

    console.log('📊 BALANCE SHEET SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`Total Assets:                    $${totalAssets.toFixed(2)}`);
    console.log(`Total Liabilities:               $${totalLiabilities.toFixed(2)}`);
    console.log(`Total Equity:                    $${totalEquity.toFixed(2)}`);
    console.log(`Net Income (Revenue - Expenses): $${netIncome.toFixed(2)}`);
    console.log(`Total Equity + Net Income:       $${totalEquityWithIncome.toFixed(2)}`);
    console.log(`Total Liabilities + Equity:      $${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log('═'.repeat(60));
    console.log(`Difference (Assets - L&E):       $${(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}`);
    console.log(`Balanced: ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? '✅ YES' : '❌ NO'}`);

    console.log('\n🔍 ACCOUNTING LOGIC CHECK:');
    console.log('═'.repeat(60));
    console.log('Accounting Equation: Assets = Liabilities + Equity + Net Income');
    console.log('');
    console.log('Normal Balances:');
    console.log('  Assets: DEBIT (positive balance)');
    console.log('  Liabilities: CREDIT (positive balance)');
    console.log('  Equity: CREDIT (positive balance)');
    console.log('  Revenue: CREDIT (positive balance)');
    console.log('  Expenses: DEBIT (positive balance)');
    console.log('');
    console.log('Current Logic:');
    console.log('  ✓ Assets with positive balance → DEBIT side');
    console.log('  ✓ Assets with negative balance → CREDIT side (contra-asset)');
    console.log('  ✓ Liabilities with positive balance → CREDIT side');
    console.log('  ✓ Liabilities with negative balance → DEBIT side (rare)');
    console.log('  ✓ Equity with positive balance → CREDIT side');
    console.log('  ✓ Equity with negative balance → DEBIT side (deficit)');
    console.log('  ✓ Revenue with positive balance → CREDIT side');
    console.log('  ✓ Revenue with negative balance → DEBIT side (contra-revenue)');
    console.log('  ✓ Expenses with positive balance → DEBIT side');
    console.log('  ✓ Expenses with negative balance → CREDIT side (contra-expense)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkBalanceSheetLogic();

