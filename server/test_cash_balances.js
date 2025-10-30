const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCashBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== TESTING CASH ACCOUNT BALANCES ===\n');

    // Get cash accounts
    const [cashAccounts] = await connection.query(`
      SELECT id, code, name FROM chart_of_accounts 
      WHERE code IN ('10001', '10002', '10003', '10004')
      AND type = 'Asset'
      AND deleted_at IS NULL
      ORDER BY code
    `);

    console.log('Cash Accounts Found:', cashAccounts.length);
    cashAccounts.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name} (ID: ${acc.id})`);
    });
    console.log('');

    const cashAccountIds = cashAccounts.map(acc => acc.id);

    // Method 1: Using subquery (current approach)
    console.log('--- METHOD 1: Subquery Approach ---\n');
    const [method1] = await connection.query(
      `SELECT 
        coa.code,
        coa.name,
        COALESCE(
          (SELECT SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE -je.amount END)
           FROM journal_entries je
           WHERE je.account_id = coa.id
          ), 0
        ) as balance
      FROM chart_of_accounts coa
      WHERE coa.id IN (${cashAccountIds.map(() => '?').join(',')})
      ORDER BY coa.code`,
      cashAccountIds
    );

    method1.forEach(acc => {
      console.log(`${acc.code} - ${acc.name}: $${Number(acc.balance).toFixed(2)}`);
    });
    console.log('Total (Method 1):', method1.reduce((sum, acc) => sum + Number(acc.balance), 0).toFixed(2));

    // Method 2: Using JOIN
    console.log('\n--- METHOD 2: JOIN Approach ---\n');
    const [method2] = await connection.query(
      `SELECT 
        coa.code,
        coa.name,
        COALESCE(SUM(CASE 
          WHEN je.entry_type = 'debit' THEN je.amount 
          ELSE -je.amount 
        END), 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id
      WHERE coa.id IN (${cashAccountIds.map(() => '?').join(',')})
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY coa.code`,
      cashAccountIds
    );

    method2.forEach(acc => {
      console.log(`${acc.code} - ${acc.name}: $${Number(acc.balance).toFixed(2)}`);
    });
    console.log('Total (Method 2):', method2.reduce((sum, acc) => sum + Number(acc.balance), 0).toFixed(2));

    // Method 3: Check if current_account_balances exists
    console.log('\n--- METHOD 3: Check current_account_balances table ---\n');
    try {
      const [method3] = await connection.query(
        `SELECT 
          coa.code,
          coa.name,
          cab.current_balance
        FROM chart_of_accounts coa
        LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
        WHERE coa.id IN (${cashAccountIds.map(() => '?').join(',')})
        ORDER BY coa.code`,
        cashAccountIds
      );

      method3.forEach(acc => {
        console.log(`${acc.code} - ${acc.name}: $${acc.current_balance ? Number(acc.current_balance).toFixed(2) : '0.00'}`);
      });
      console.log('Total (Method 3):', method3.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0).toFixed(2));
    } catch (error) {
      console.log('current_account_balances table approach failed:', error.message);
    }

    // Check sample journal entries for one account
    console.log('\n--- SAMPLE JOURNAL ENTRIES (Petty Cash - 10001) ---\n');
    const pettyCashAccount = cashAccounts.find(acc => acc.code === '10001');
    if (pettyCashAccount) {
      const [sampleEntries] = await connection.query(
        `SELECT 
          je.id,
          je.entry_type,
          je.amount,
          t.transaction_date,
          t.description
        FROM journal_entries je
        JOIN transactions t ON je.transaction_id = t.id
        WHERE je.account_id = ?
        ORDER BY t.transaction_date DESC
        LIMIT 5`,
        [pettyCashAccount.id]
      );

      if (sampleEntries.length > 0) {
        console.log('Last 5 journal entries:');
        sampleEntries.forEach(je => {
          const date = new Date(je.transaction_date).toLocaleDateString();
          console.log(`  ${je.entry_type.toUpperCase().padEnd(6)} | $${Number(je.amount).toFixed(2).padStart(10)} | ${date} | ${je.description}`);
        });
      } else {
        console.log('No journal entries found for this account!');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

testCashBalances();

