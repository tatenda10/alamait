const db = require('../src/services/db');

async function checkCashBalance() {
  const conn = await db.getConnection();
  try {
    console.log('💰 Checking current cash balance...\n');

    // Get cash account balance
    const [cashBalance] = await conn.query(
      `SELECT 
        coa.name as account_name,
        coa.code as account_code,
        cab.current_balance
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code = '10002' AND coa.deleted_at IS NULL`
    );

    if (cashBalance[0]) {
      console.log(`💰 Cash Account Balance:`);
      console.log(`  Account: ${cashBalance[0].account_name} (${cashBalance[0].account_code})`);
      console.log(`  Current Balance: $${parseFloat(cashBalance[0].current_balance).toFixed(2)}`);
    } else {
      console.log('❌ Cash account not found');
    }

    // Get all cash-related accounts
    console.log('\n📊 All Cash-Related Account Balances:');
    const [allCashAccounts] = await conn.query(
      `SELECT 
        coa.name as account_name,
        coa.code as account_code,
        cab.current_balance
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code LIKE '1000%' AND coa.deleted_at IS NULL
      ORDER BY coa.code`
    );

    allCashAccounts.forEach(account => {
      console.log(`  ${account.account_name} (${account.account_code}): $${parseFloat(account.current_balance).toFixed(2)}`);
    });

    // Calculate total cash position
    const totalCash = allCashAccounts.reduce((sum, account) => sum + parseFloat(account.current_balance), 0);
    console.log(`\n💰 Total Cash Position: $${totalCash.toFixed(2)}`);

    // Check recent cash transactions
    console.log('\n📝 Recent Cash Transactions:');
    const [recentTransactions] = await conn.query(
      `SELECT 
        t.id,
        t.amount,
        t.description,
        t.transaction_date,
        t.transaction_type
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code = '10002' 
        AND t.deleted_at IS NULL 
        AND je.deleted_at IS NULL
      ORDER BY t.id DESC
      LIMIT 10`
    );

    recentTransactions.forEach(transaction => {
      console.log(`  ID: ${transaction.id}, Amount: $${transaction.amount}, Type: ${transaction.transaction_type}, Date: ${transaction.transaction_date}`);
    });

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkCashBalance();