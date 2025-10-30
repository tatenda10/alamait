const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCorrectedBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== TESTING CORRECTED CASH BALANCES ===\n');

    // Get cash accounts
    const [cashAccounts] = await connection.query(`
      SELECT id, code, name FROM chart_of_accounts 
      WHERE code IN ('10001', '10002', '10003', '10004')
      AND type = 'Asset'
      AND deleted_at IS NULL
      ORDER BY code
    `);

    const cashAccountIds = cashAccounts.map(acc => acc.id);

    // Test the corrected query
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

    console.log('Cash Account Balances:\n');
    console.log('Account'.padEnd(30) + 'Balance');
    console.log('='.repeat(50));

    let total = 0;
    cashBalances.forEach(acc => {
      const balance = Number(acc.balance);
      total += balance;
      console.log(`${(acc.code + ' - ' + acc.name).padEnd(30)}$${balance.toFixed(2)}`);
    });

    console.log('='.repeat(50));
    console.log(`${'TOTAL CASH POSITION'.padEnd(30)}$${total.toFixed(2)}`);
    console.log('');

    // Show petty cash user breakdown
    console.log('\n--- PETTY CASH USER BREAKDOWN ---\n');
    const [pettyCashUsers] = await connection.query(`
      SELECT 
        pca.id,
        u.username,
        bh.name as boarding_house,
        pca.current_balance
      FROM petty_cash_accounts pca
      JOIN users u ON pca.petty_cash_user_id = u.id
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pca.deleted_at IS NULL
      ORDER BY u.username
    `);

    console.log('User'.padEnd(20) + 'Boarding House'.padEnd(25) + 'Balance');
    console.log('='.repeat(60));
    pettyCashUsers.forEach(user => {
      console.log(
        `${user.username.padEnd(20)}${(user.boarding_house || 'N/A').padEnd(25)}$${Number(user.current_balance).toFixed(2)}`
      );
    });

    const pettyCashTotal = pettyCashUsers.reduce((sum, user) => sum + Number(user.current_balance), 0);
    console.log('='.repeat(60));
    console.log(`${'TOTAL PETTY CASH'.padEnd(45)}$${pettyCashTotal.toFixed(2)}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

testCorrectedBalances();

