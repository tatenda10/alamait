const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCashflowEndpoint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== TESTING CASHFLOW ENDPOINT LOGIC ===\n');

    // Get cash accounts (same as controller)
    const [cashAccounts] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')
       AND type = 'Asset'
       AND deleted_at IS NULL
       ORDER BY code`
    );

    console.log('Cash Accounts Found:', cashAccounts.length);
    cashAccounts.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name} (ID: ${acc.id})`);
    });
    console.log('');

    const cashAccountIds = cashAccounts.map(acc => acc.id);

    // Test the exact query from the controller
    console.log('--- RUNNING CONTROLLER QUERY ---\n');
    console.log('SQL:', `
      SELECT 
        coa.code,
        coa.name,
        CASE 
          WHEN coa.code = '10001' THEN 
            COALESCE((SELECT SUM(current_balance) FROM petty_cash_accounts WHERE deleted_at IS NULL), 0)
          ELSE
            COALESCE(
              (SELECT SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE -je.amount END)
               FROM journal_entries je
               WHERE je.account_id = coa.id
              ), 0
            )
        END as balance
      FROM chart_of_accounts coa
      WHERE coa.id IN (${cashAccountIds.join(',')})
      ORDER BY coa.code
    `);
    console.log('');

    const [cashBalances] = await connection.query(
      `SELECT 
        coa.code,
        coa.name,
        CASE 
          WHEN coa.code = '10001' THEN 
            COALESCE((SELECT SUM(current_balance) FROM petty_cash_accounts WHERE deleted_at IS NULL), 0)
          ELSE
            COALESCE(
              (SELECT SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE -je.amount END)
               FROM journal_entries je
               WHERE je.account_id = coa.id
              ), 0
            )
        END as balance
      FROM chart_of_accounts coa
      WHERE coa.id IN (${cashAccountIds.map(() => '?').join(',')})
      ORDER BY coa.code`,
      cashAccountIds
    );

    console.log('Results:', cashBalances.length, 'rows\n');
    console.log('Account'.padEnd(30) + 'Balance'.padEnd(15) + 'Type');
    console.log('='.repeat(60));

    let total = 0;
    cashBalances.forEach(acc => {
      const balance = Number(acc.balance);
      total += balance;
      console.log(
        `${(acc.code + ' - ' + acc.name).padEnd(30)}$${balance.toFixed(2).padEnd(14)}${typeof acc.balance}`
      );
    });

    console.log('='.repeat(60));
    console.log(`TOTAL:`.padEnd(30) + `$${total.toFixed(2)}`);
    console.log('');

    // Format as controller does
    const totalCashPosition = cashBalances.reduce((sum, account) => {
      return sum + Number(account.balance);
    }, 0);

    const cashAccountBalances = cashBalances.map(account => ({
      code: account.code,
      name: account.name,
      balance: Number(account.balance)
    }));

    console.log('--- FORMATTED RESPONSE (as sent to frontend) ---\n');
    console.log(JSON.stringify({
      totalCashPosition: { amount: totalCashPosition },
      cashAccountBalances
    }, null, 2));

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

testCashflowEndpoint();

