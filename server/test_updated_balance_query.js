const mysql = require('mysql2/promise');
require('dotenv').config();

async function testQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [cashAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')
       AND type = 'Asset'
       AND deleted_at IS NULL`
    );

    const cashAccountIds = cashAccounts.map(acc => acc.id);

    const [cashBalances] = await connection.query(
      `SELECT 
        coa.code,
        coa.name,
        CASE 
          WHEN coa.code = '10001' THEN 
            COALESCE((SELECT SUM(current_balance) FROM petty_cash_accounts WHERE deleted_at IS NULL), 0)
          ELSE
            COALESCE(cab.current_balance, 0)
        END as balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.id IN (${cashAccountIds.map(() => '?').join(',')})
      ORDER BY coa.code`,
      cashAccountIds
    );

    console.log('\n=== UPDATED CASH BALANCES QUERY TEST ===\n');
    console.log('Account'.padEnd(35) + 'Balance');
    console.log('='.repeat(50));
    
    cashBalances.forEach(acc => {
      console.log(`${(acc.code + ' - ' + acc.name).padEnd(35)}$${Number(acc.balance).toFixed(2)}`);
    });

    const total = cashBalances.reduce((sum, acc) => sum + Number(acc.balance), 0);
    console.log('='.repeat(50));
    console.log(`${'TOTAL CASH POSITION'.padEnd(35)}$${total.toFixed(2)}`);
    console.log('');

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

testQuery();

