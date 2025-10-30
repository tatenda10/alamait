const mysql = require('mysql2/promise');
require('dotenv').config();

async function recalculateAllCashBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== RECALCULATING ALL CASH ACCOUNT BALANCES ===\n');

    // Get all cash accounts (excluding Petty Cash as it uses petty_cash_accounts)
    const [cashAccounts] = await connection.query(`
      SELECT id, code, name 
      FROM chart_of_accounts 
      WHERE code IN ('10002', '10003', '10004')
      AND type = 'Asset'
      AND deleted_at IS NULL
      ORDER BY code
    `);

    console.log('Cash Accounts to Recalculate:', cashAccounts.length);
    console.log('');

    for (const account of cashAccounts) {
      console.log(`\n--- ${account.code} - ${account.name} ---`);
      console.log(`Account ID: ${account.id}\n`);

      // Calculate balance from journal entries
      const [balanceResult] = await connection.query(`
        SELECT 
          COALESCE(SUM(CASE 
            WHEN je.entry_type = 'debit' THEN je.amount 
            ELSE -je.amount 
          END), 0) as calculated_balance
        FROM journal_entries je
        WHERE je.account_id = ?
      `, [account.id]);

      const calculatedBalance = Number(balanceResult[0].calculated_balance);

      // Get sample transactions
      const [recentTransactions] = await connection.query(`
        SELECT 
          t.transaction_date,
          je.entry_type,
          je.amount,
          t.description,
          t.transaction_type
        FROM journal_entries je
        JOIN transactions t ON je.transaction_id = t.id
        WHERE je.account_id = ?
        ORDER BY t.transaction_date DESC, je.id DESC
        LIMIT 10
      `, [account.id]);

      console.log('Recent Transactions (last 10):');
      console.log('Date'.padEnd(15) + 'Type'.padEnd(8) + 'Amount'.padEnd(12) + 'Description');
      console.log('='.repeat(80));
      
      recentTransactions.forEach(txn => {
        const date = new Date(txn.transaction_date).toLocaleDateString();
        const type = txn.entry_type.toUpperCase();
        const amount = `$${Number(txn.amount).toFixed(2)}`;
        const desc = txn.description || txn.transaction_type;
        console.log(
          date.padEnd(15) + 
          type.padEnd(8) + 
          amount.padEnd(12) + 
          desc.substring(0, 45)
        );
      });

      console.log('\nCalculated Balance: $' + calculatedBalance.toFixed(2));

      // Check if balance exists in current_account_balances
      const [currentBalance] = await connection.query(`
        SELECT current_balance 
        FROM current_account_balances 
        WHERE account_id = ?
      `, [account.id]);

      if (currentBalance.length > 0) {
        console.log('Current Balance in DB: $' + Number(currentBalance[0].current_balance).toFixed(2));
        const difference = calculatedBalance - Number(currentBalance[0].current_balance);
        if (Math.abs(difference) > 0.01) {
          console.log('⚠️  MISMATCH: Difference of $' + difference.toFixed(2));
        } else {
          console.log('✅ Balance matches');
        }
      } else {
        console.log('ℹ️  No entry in current_account_balances table');
      }

      console.log('='.repeat(80));
    }

    // Also show Petty Cash
    console.log('\n\n--- 10001 - Petty Cash ---');
    console.log('(Using petty_cash_accounts table)\n');

    const [pettyCashAccounts] = await connection.query(`
      SELECT 
        pca.id,
        u.username,
        pca.current_balance,
        bh.name as boarding_house
      FROM petty_cash_accounts pca
      JOIN users u ON pca.petty_cash_user_id = u.id
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pca.deleted_at IS NULL
      ORDER BY u.username
    `);

    console.log('Petty Cash Users:');
    console.log('User'.padEnd(20) + 'Boarding House'.padEnd(25) + 'Balance');
    console.log('='.repeat(70));
    
    let pettyCashTotal = 0;
    pettyCashAccounts.forEach(acc => {
      const balance = Number(acc.current_balance);
      pettyCashTotal += balance;
      console.log(
        acc.username.padEnd(20) + 
        (acc.boarding_house || 'N/A').padEnd(25) + 
        '$' + balance.toFixed(2)
      );
    });

    console.log('='.repeat(70));
    console.log('Total Petty Cash: $' + pettyCashTotal.toFixed(2));

    // Summary
    console.log('\n\n=== SUMMARY ===\n');
    console.log('Petty Cash (10001): $' + pettyCashTotal.toFixed(2));
    
    for (const account of cashAccounts) {
      const [balanceResult] = await connection.query(`
        SELECT 
          COALESCE(SUM(CASE 
            WHEN je.entry_type = 'debit' THEN je.amount 
            ELSE -je.amount 
          END), 0) as calculated_balance
        FROM journal_entries je
        WHERE je.account_id = ?
      `, [account.id]);
      
      console.log(`${account.name} (${account.code}): $${Number(balanceResult[0].calculated_balance).toFixed(2)}`);
    }

    const [allBalances] = await connection.query(`
      SELECT 
        COALESCE(SUM(CASE 
          WHEN je.entry_type = 'debit' THEN je.amount 
          ELSE -je.amount 
        END), 0) as total
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code IN ('10002', '10003', '10004')
      AND coa.deleted_at IS NULL
    `);

    const totalCash = pettyCashTotal + Number(allBalances[0].total);
    console.log('\n' + '='.repeat(50));
    console.log('TOTAL CASH POSITION: $' + totalCash.toFixed(2));
    console.log('='.repeat(50));

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

recalculateAllCashBalances();

