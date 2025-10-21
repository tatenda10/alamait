const db = require('../src/services/db');

async function testBalanceSheet() {
  const conn = await db.getConnection();
  try {
    console.log('Testing Balance Sheet API Logic...\n');
    
    const asOfDate = new Date().toISOString().split('T')[0];
    
    // Simulate the controller query
    const query = `
      SELECT 
        coa.id as account_id,
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
    `;
    
    const [rows] = await conn.query(query);
    
    console.log(`Balance Sheet Results (${rows.length} accounts):\n`);
    
    // Group by type
    const byType = {};
    rows.forEach(row => {
      if (!byType[row.account_type]) byType[row.account_type] = [];
      byType[row.account_type].push(row);
    });
    
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    for (const [type, accounts] of Object.entries(byType)) {
      console.log(`\n=== ${type.toUpperCase()} ===`);
      let typeTotal = 0;
      
      accounts.forEach(acc => {
        const debit = parseFloat(acc.debit_balance || 0);
        const credit = parseFloat(acc.credit_balance || 0);
        const balance = parseFloat(acc.current_balance || 0);
        
        if (debit > 0 || credit > 0) {
          console.log(`  ${acc.account_code} - ${acc.account_name}: $${balance.toFixed(2)}`);
          console.log(`    Debit: $${debit.toFixed(2)} | Credit: $${credit.toFixed(2)}`);
          
          if (type === 'Asset') {
            typeTotal += debit - credit;
          } else if (type === 'Liability') {
            typeTotal += credit - debit;
          } else if (type === 'Equity') {
            typeTotal += credit - debit;
          } else if (type === 'Revenue') {
            typeTotal += credit - debit;
          } else if (type === 'Expense') {
            typeTotal += debit - credit;
          }
        }
      });
      
      console.log(`  Total ${type}: $${typeTotal.toFixed(2)}`);
      
      // Store totals
      if (type === 'Asset') totalAssets = typeTotal;
      else if (type === 'Liability') totalLiabilities = typeTotal;
      else if (type === 'Equity') totalEquity = typeTotal;
      else if (type === 'Revenue') totalRevenue = typeTotal;
      else if (type === 'Expense') totalExpenses = typeTotal;
    }
    
    // Calculate net income and balance sheet equation
    const netIncome = totalRevenue - totalExpenses;
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;
    
    console.log('\n' + '='.repeat(60));
    console.log('BALANCE SHEET SUMMARY:');
    console.log(`Total Assets: $${totalAssets.toFixed(2)}`);
    console.log(`Total Liabilities: $${totalLiabilities.toFixed(2)}`);
    console.log(`Total Equity: $${totalEquity.toFixed(2)}`);
    console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`Net Income: $${netIncome.toFixed(2)}`);
    console.log(`Total Equity + Net Income: $${totalEquityWithIncome.toFixed(2)}`);
    console.log(`Total Liabilities + Equity: $${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`Balance Check: ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? '✅ BALANCED' : '❌ NOT BALANCED'}`);
    console.log(`Difference: $${(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

testBalanceSheet();

