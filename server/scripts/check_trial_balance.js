const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking Trial Balance...');
    
    // Get trial balance data
    const [trialBalance] = await conn.query(
      `SELECT 
        coa.code,
        coa.name,
        coa.type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            0
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            0
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      ORDER BY coa.code`
    );
    
    console.log(`\nTrial Balance Summary:`);
    console.log(`Total accounts: ${trialBalance.length}`);
    
    let totalDebits = 0;
    let totalCredits = 0;
    let accountsWithBalances = 0;
    
    trialBalance.forEach(account => {
      const debitBalance = parseFloat(account.debit_balance || 0);
      const creditBalance = parseFloat(account.credit_balance || 0);
      
      if (debitBalance > 0 || creditBalance > 0) {
        accountsWithBalances++;
        totalDebits += debitBalance;
        totalCredits += creditBalance;
        
        console.log(`${account.code}: ${account.name} - Debit: $${debitBalance.toFixed(2)}, Credit: $${creditBalance.toFixed(2)}`);
      }
    });
    
    console.log(`\nTrial Balance Totals:`);
    console.log(`Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`Difference: $${(totalDebits - totalCredits).toFixed(2)}`);
    console.log(`Balanced: ${Math.abs(totalDebits - totalCredits) < 0.01 ? '✅ YES' : '❌ NO'}`);
    console.log(`Accounts with balances: ${accountsWithBalances}`);
    
    // Check key account balances
    console.log(`\nKey Account Balances:`);
    const keyAccounts = ['10001', '10002', '10003', '10004', '10005', '30004', '40001'];
    
    for (const code of keyAccounts) {
      const account = trialBalance.find(acc => acc.code === code);
      if (account) {
        console.log(`${account.code}: ${account.name} - $${parseFloat(account.current_balance || 0).toFixed(2)}`);
      }
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();