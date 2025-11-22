require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function breakdownTotalAssets() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('TOTAL ASSETS BREAKDOWN');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Get all asset accounts with their balances
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
        AND coa.type = 'Asset'
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY coa.code
    `);

    // Get Petty Cash balance
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);
    const pettyCashBalance = parseFloat(pettyCashResult[0]?.total_balance || 0);

    console.log('ASSET ACCOUNTS BREAKDOWN:\n');
    console.log(`${'Account Code'.padEnd(15)} ${'Account Name'.padEnd(40)} ${'Balance'.padStart(20)} ${'Calculation'.padStart(20)}`);
    console.log('-'.repeat(95));

    let totalAssets = 0;
    const calculations = [];

    rows.forEach(row => {
      let balance = parseFloat(row.current_balance || 0);
      
      // Replace Petty Cash balance
      if (row.account_code === '10001') {
        balance = pettyCashBalance;
      }
      
      let debitBalance = 0;
      let creditBalance = 0;
      
      if (balance > 0) {
        debitBalance = balance;
      } else if (balance < 0) {
        creditBalance = Math.abs(balance);
      }

      // Calculate contribution to total assets
      const contribution = debitBalance - creditBalance;
      totalAssets += contribution;

      const calcStr = contribution >= 0 
        ? `+${contribution.toFixed(2)}`
        : `${contribution.toFixed(2)}`;

      console.log(`${row.account_code.padEnd(15)} ${row.account_name.padEnd(40)} ${balance.toFixed(2).padStart(20)} ${calcStr.padStart(20)}`);
      
      calculations.push({
        account: `${row.account_code} - ${row.account_name}`,
        balance: balance,
        debitBalance: debitBalance,
        creditBalance: creditBalance,
        contribution: contribution
      });
    });

    console.log('-'.repeat(95));
    console.log(`${'TOTAL ASSETS'.padEnd(56)} ${totalAssets.toFixed(2).padStart(20)}`);
    console.log('');

    console.log('DETAILED CALCULATION:\n');
    console.log('Formula: Total Assets = Sum of (Debit Balance - Credit Balance) for all Asset accounts\n');
    
    calculations.forEach(calc => {
      if (Math.abs(calc.balance) > 0.01) {
        if (calc.debitBalance > 0) {
          console.log(`  ${calc.account}:`);
          console.log(`    Debit Balance: $${calc.debitBalance.toFixed(2)}`);
          console.log(`    Credit Balance: $${calc.creditBalance.toFixed(2)}`);
          console.log(`    Contribution: $${calc.debitBalance.toFixed(2)} - $${calc.creditBalance.toFixed(2)} = $${calc.contribution.toFixed(2)}`);
          console.log('');
        } else if (calc.creditBalance > 0) {
          console.log(`  ${calc.account}:`);
          console.log(`    Debit Balance: $${calc.debitBalance.toFixed(2)}`);
          console.log(`    Credit Balance: $${calc.creditBalance.toFixed(2)}`);
          console.log(`    Contribution: $${calc.debitBalance.toFixed(2)} - $${calc.creditBalance.toFixed(2)} = $${calc.contribution.toFixed(2)} (NEGATIVE)`);
          console.log('');
        }
      }
    });

    console.log('STEP-BY-STEP ADDITION:\n');
    let runningTotal = 0;
    calculations.forEach(calc => {
      if (Math.abs(calc.contribution) > 0.01) {
        const prevTotal = runningTotal;
        runningTotal += calc.contribution;
        const sign = calc.contribution >= 0 ? '+' : '';
        console.log(`  ${prevTotal.toFixed(2)} ${sign}${calc.contribution.toFixed(2)} = ${runningTotal.toFixed(2)}  (${calc.account})`);
      }
    });

    console.log('');
    console.log(`FINAL TOTAL: $${totalAssets.toFixed(2)}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Breakdown Complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

breakdownTotalAssets();

