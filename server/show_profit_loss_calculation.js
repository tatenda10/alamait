require('dotenv').config();
const mysql = require('mysql2/promise');

async function showProfitLossCalculation() {
  console.log('📊 Current Period Profit/Loss Calculation Breakdown\n');
  console.log('='.repeat(80));

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // 1. Get all Revenue accounts
    console.log('\n1️⃣ REVENUE ACCOUNTS:');
    console.log('Formula: Total Revenue = Sum of Credit Balances - Sum of Debit Balances');
    const [revenueAccounts] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN COALESCE(cab.current_balance, 0) > 0 THEN COALESCE(cab.current_balance, 0)
          ELSE 0
        END as credit_balance,
        CASE 
          WHEN COALESCE(cab.current_balance, 0) < 0 THEN ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.type = 'Revenue'
        AND coa.deleted_at IS NULL
      ORDER BY coa.code
    `);

    const totalRevenueCredit = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.credit_balance), 0);
    const totalRevenueDebit = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.debit_balance), 0);
    const totalRevenue = totalRevenueCredit - totalRevenueDebit;

    console.table(revenueAccounts.map(acc => ({
      Code: acc.code,
      Name: acc.name,
      'Current Balance': parseFloat(acc.current_balance).toFixed(2),
      'Credit': parseFloat(acc.credit_balance).toFixed(2),
      'Debit': parseFloat(acc.debit_balance).toFixed(2)
    })));

    console.log(`\nTotal Revenue Credits: $${totalRevenueCredit.toFixed(2)}`);
    console.log(`Total Revenue Debits: $${totalRevenueDebit.toFixed(2)}`);
    console.log(`TOTAL REVENUE: $${totalRevenue.toFixed(2)}`);

    // 2. Get all Expense accounts
    console.log('\n' + '='.repeat(80));
    console.log('\n2️⃣ EXPENSE ACCOUNTS:');
    console.log('Formula: Total Expenses = Sum of Debit Balances - Sum of Credit Balances');
    const [expenseAccounts] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN COALESCE(cab.current_balance, 0) > 0 THEN COALESCE(cab.current_balance, 0)
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN COALESCE(cab.current_balance, 0) < 0 THEN ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.type = 'Expense'
        AND coa.deleted_at IS NULL
      ORDER BY coa.code
    `);

    const totalExpenseDebit = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.debit_balance), 0);
    const totalExpenseCredit = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.credit_balance), 0);
    const totalExpenses = totalExpenseDebit - totalExpenseCredit;

    console.table(expenseAccounts.map(acc => ({
      Code: acc.code,
      Name: acc.name,
      'Current Balance': parseFloat(acc.current_balance).toFixed(2),
      'Debit': parseFloat(acc.debit_balance).toFixed(2),
      'Credit': parseFloat(acc.credit_balance).toFixed(2)
    })));

    console.log(`\nTotal Expense Debits: $${totalExpenseDebit.toFixed(2)}`);
    console.log(`Total Expense Credits: $${totalExpenseCredit.toFixed(2)}`);
    console.log(`TOTAL EXPENSES: $${totalExpenses.toFixed(2)}`);

    // 3. Calculate Net Income
    console.log('\n' + '='.repeat(80));
    console.log('\n3️⃣ NET INCOME (PROFIT/LOSS) CALCULATION:');
    console.log(`Formula: Net Income = Total Revenue - Total Expenses`);
    console.log(`\nTotal Revenue:    $${totalRevenue.toFixed(2)}`);
    console.log(`Total Expenses:   $${totalExpenses.toFixed(2)}`);
    console.log(`─────────────────────────────────`);
    
    const netIncome = totalRevenue - totalExpenses;
    
    if (netIncome >= 0) {
      console.log(`NET PROFIT:       $${netIncome.toFixed(2)} ✅`);
    } else {
      console.log(`NET LOSS:         $${Math.abs(netIncome).toFixed(2)} ❌`);
    }

    // 4. Show how this appears in Balance Sheet
    console.log('\n' + '='.repeat(80));
    console.log('\n4️⃣ BALANCE SHEET PRESENTATION:');
    console.log('\nThis Net Income appears under EQUITY section as:');
    console.log(`"Current Period Profit/(Loss): $${netIncome.toFixed(2)}"`);
    
    console.log('\nBalance Sheet Equation:');
    console.log('Assets = Liabilities + Equity + Net Income');

    // 5. Show key accounting principle
    console.log('\n' + '='.repeat(80));
    console.log('\n5️⃣ ACCOUNTING PRINCIPLES:');
    console.log('\n✓ Revenue accounts have CREDIT balances (increase with credits)');
    console.log('✓ Expense accounts have DEBIT balances (increase with debits)');
    console.log('✓ Net Income = Revenue - Expenses');
    console.log('✓ Positive Net Income = Profit (good! 📈)');
    console.log('✓ Negative Net Income = Loss (needs attention 📉)');

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

showProfitLossCalculation();

