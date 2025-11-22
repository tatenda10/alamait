require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function analyzeBalanceSheetImpact() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('BALANCE SHEET IMPACT ANALYSIS - STUDENT OPENING BALANCE CORRECTION');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Get current balances for key accounts
    console.log('1️⃣  CURRENT BALANCES (Before Correction):\n');
    
    const [currentBalances] = await connection.query(`
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
        ) as current_balance,
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
        AND coa.code IN ('10005', '30004', '40001')
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY coa.code
    `);

    let accountsReceivableBalance = 0;
    let openingBalanceEquityBalance = 0;
    let revenueBalance = 0;

    currentBalances.forEach(acc => {
      if (acc.account_code === '10005') {
        accountsReceivableBalance = parseFloat(acc.current_balance);
        console.log(`   Accounts Receivable (10005):`);
        console.log(`     Current Balance: $${accountsReceivableBalance.toFixed(2)}`);
        console.log(`     Total Debits: $${parseFloat(acc.total_debits).toFixed(2)}`);
        console.log(`     Total Credits: $${parseFloat(acc.total_credits).toFixed(2)}`);
        console.log('');
      } else if (acc.account_code === '30004') {
        openingBalanceEquityBalance = parseFloat(acc.current_balance);
        console.log(`   Opening Balance Equity (30004):`);
        console.log(`     Current Balance: $${openingBalanceEquityBalance.toFixed(2)}`);
        console.log(`     Total Debits: $${parseFloat(acc.total_debits).toFixed(2)}`);
        console.log(`     Total Credits: $${parseFloat(acc.total_credits).toFixed(2)}`);
        console.log('');
      } else if (acc.account_code === '40001') {
        revenueBalance = parseFloat(acc.current_balance);
        console.log(`   Revenue - Rentals Income (40001):`);
        console.log(`     Current Balance: $${revenueBalance.toFixed(2)}`);
        console.log(`     Total Debits: $${parseFloat(acc.total_debits).toFixed(2)}`);
        console.log(`     Total Credits: $${parseFloat(acc.total_credits).toFixed(2)}`);
        console.log('');
      }
    });

    // Calculate correction amounts
    const correctionAmount = 3126.00; // Net correction: $3,126.00

    console.log('2️⃣  CORRECTING JOURNAL ENTRY:\n');
    console.log(`   Debit:  Opening Balance Equity (30004) - $${correctionAmount.toFixed(2)}`);
    console.log(`   Credit: Revenue (40001) - $${correctionAmount.toFixed(2)}`);
    console.log('');

    // Calculate projected balances
    console.log('3️⃣  PROJECTED BALANCES (After Correction):\n');
    
    const projectedOpeningBalanceEquity = openingBalanceEquityBalance + correctionAmount;
    const projectedRevenue = revenueBalance - correctionAmount;
    
    console.log(`   Accounts Receivable (10005):`);
    console.log(`     Current: $${accountsReceivableBalance.toFixed(2)}`);
    console.log(`     After Correction: $${accountsReceivableBalance.toFixed(2)} (NO CHANGE)`);
    console.log('');
    
    console.log(`   Opening Balance Equity (30004):`);
    console.log(`     Current: $${openingBalanceEquityBalance.toFixed(2)}`);
    console.log(`     After Correction: $${projectedOpeningBalanceEquity.toFixed(2)}`);
    console.log(`     Change: +$${correctionAmount.toFixed(2)}`);
    console.log('');
    
    console.log(`   Revenue - Rentals Income (40001):`);
    console.log(`     Current: $${revenueBalance.toFixed(2)}`);
    console.log(`     After Correction: $${projectedRevenue.toFixed(2)}`);
    console.log(`     Change: -$${correctionAmount.toFixed(2)}`);
    console.log('');

    // Get full balance sheet summary
    console.log('4️⃣  FULL BALANCE SHEET IMPACT:\n');
    
    const [balanceSheetSummary] = await connection.query(`
      SELECT 
        coa.type as account_type,
        SUM(
          CASE 
            WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
            WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
            WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
            WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
            ELSE 0
          END
        ) as total_balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
        AND coa.type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')
      GROUP BY coa.type
    `);

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    balanceSheetSummary.forEach(row => {
      const balance = parseFloat(row.total_balance) || 0;
      if (row.account_type === 'Asset') {
        totalAssets += balance;
      } else if (row.account_type === 'Liability') {
        totalLiabilities += balance;
      } else if (row.account_type === 'Equity') {
        totalEquity += balance;
      } else if (row.account_type === 'Revenue') {
        totalRevenue += balance;
      } else if (row.account_type === 'Expense') {
        totalExpenses += balance;
      }
    });

    const netIncome = totalRevenue - totalExpenses;
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;

    console.log('   CURRENT BALANCE SHEET:');
    console.log(`     Total Assets: $${totalAssets.toFixed(2)}`);
    console.log(`     Total Liabilities: $${totalLiabilities.toFixed(2)}`);
    console.log(`     Total Equity (before net income): $${totalEquity.toFixed(2)}`);
    console.log(`     Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`     Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`     Net Income: $${netIncome.toFixed(2)}`);
    console.log(`     Total Equity (with net income): $${totalEquityWithIncome.toFixed(2)}`);
    console.log(`     Total Liabilities + Equity: $${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`     Balance Check: ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? '✅ BALANCED' : '❌ NOT BALANCED'}`);
    console.log('');

    // Projected balance sheet
    const projectedTotalRevenue = totalRevenue - correctionAmount;
    const projectedNetIncome = projectedTotalRevenue - totalExpenses;
    const projectedTotalEquity = totalEquity + correctionAmount;
    const projectedTotalEquityWithIncome = projectedTotalEquity + projectedNetIncome;
    const projectedTotalLiabilitiesAndEquity = totalLiabilities + projectedTotalEquityWithIncome;

    console.log('   PROJECTED BALANCE SHEET (After Correction):');
    console.log(`     Total Assets: $${totalAssets.toFixed(2)} (NO CHANGE)`);
    console.log(`     Total Liabilities: $${totalLiabilities.toFixed(2)} (NO CHANGE)`);
    console.log(`     Total Equity (before net income): $${projectedTotalEquity.toFixed(2)} (+$${correctionAmount.toFixed(2)})`);
    console.log(`     Total Revenue: $${projectedTotalRevenue.toFixed(2)} (-$${correctionAmount.toFixed(2)})`);
    console.log(`     Total Expenses: $${totalExpenses.toFixed(2)} (NO CHANGE)`);
    console.log(`     Net Income: $${projectedNetIncome.toFixed(2)} (-$${correctionAmount.toFixed(2)})`);
    console.log(`     Total Equity (with net income): $${projectedTotalEquityWithIncome.toFixed(2)} (NO CHANGE)`);
    console.log(`     Total Liabilities + Equity: $${projectedTotalLiabilitiesAndEquity.toFixed(2)} (NO CHANGE)`);
    console.log(`     Balance Check: ${Math.abs(totalAssets - projectedTotalLiabilitiesAndEquity) < 0.01 ? '✅ BALANCED' : '❌ NOT BALANCED'}`);
    console.log('');

    // Summary of changes
    console.log('5️⃣  SUMMARY OF CHANGES:\n');
    console.log('   Accounts Affected:');
    console.log(`     • Opening Balance Equity (30004): +$${correctionAmount.toFixed(2)}`);
    console.log(`     • Revenue (40001): -$${correctionAmount.toFixed(2)}`);
    console.log(`     • Accounts Receivable (10005): No change`);
    console.log('');
    console.log('   Balance Sheet Impact:');
    console.log(`     • Total Assets: No change`);
    console.log(`     • Total Liabilities: No change`);
    console.log(`     • Total Equity (before net income): +$${correctionAmount.toFixed(2)}`);
    console.log(`     • Net Income: -$${correctionAmount.toFixed(2)}`);
    console.log(`     • Total Equity (with net income): No change (reclassification only)`);
    console.log(`     • Total Liabilities + Equity: No change`);
    console.log('');
    console.log('   ✅ The balance sheet will remain balanced!');
    console.log('   ✅ This is a reclassification within equity (from Revenue to Opening Balance Equity)');
    console.log('   ✅ No impact on total assets or total equity');
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Analysis Complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in analyzeBalanceSheetImpact:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

analyzeBalanceSheetImpact();

