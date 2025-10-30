const mysql = require('mysql2/promise');
require('dotenv').config();

async function investigateDiscrepancies() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== INVESTIGATING CASH BALANCE DISCREPANCIES ===\n');

    const expectedBalances = {
      '10001': { name: 'Petty Cash', expected: 71.08 },
      '10002': { name: 'Cash', expected: 3268.55 },
      '10003': { name: 'CBZ Bank Account', expected: 339.75 },
      '10004': { name: 'CBZ Vault', expected: 6280.00 }
    };

    for (const [code, info] of Object.entries(expectedBalances)) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`${code} - ${info.name}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Expected Balance: $${info.expected.toFixed(2)}\n`);

      if (code === '10001') {
        // Petty Cash - check petty_cash_accounts
        const [pca] = await connection.query(`
          SELECT SUM(current_balance) as total
          FROM petty_cash_accounts 
          WHERE deleted_at IS NULL
        `);
        console.log(`Actual (from petty_cash_accounts): $${Number(pca[0].total).toFixed(2)}`);
        console.log(`Difference: $${(Number(pca[0].total) - info.expected).toFixed(2)}`);
        continue;
      }

      // Get account ID
      const [account] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        [code]
      );

      if (account.length === 0) {
        console.log('❌ Account not found!');
        continue;
      }

      const accountId = account[0].id;

      // Calculate from journal entries
      const [calculated] = await connection.query(`
        SELECT 
          COALESCE(SUM(CASE 
            WHEN je.entry_type = 'debit' THEN je.amount 
            ELSE -je.amount 
          END), 0) as balance
        FROM journal_entries je
        WHERE je.account_id = ?
      `, [accountId]);

      const calculatedBalance = Number(calculated[0].balance);
      const difference = calculatedBalance - info.expected;

      console.log(`Calculated (from journal entries): $${calculatedBalance.toFixed(2)}`);
      console.log(`Difference: $${difference.toFixed(2)}`);

      if (Math.abs(difference) > 0.01) {
        console.log(`\n⚠️  DISCREPANCY OF $${Math.abs(difference).toFixed(2)}`);
        
        // Show breakdown by transaction type
        console.log('\nBreakdown by Transaction Type:');
        const [breakdown] = await connection.query(`
          SELECT 
            t.transaction_type,
            je.entry_type,
            COUNT(*) as count,
            SUM(je.amount) as total
          FROM journal_entries je
          JOIN transactions t ON je.transaction_id = t.id
          WHERE je.account_id = ?
          GROUP BY t.transaction_type, je.entry_type
          ORDER BY total DESC
        `, [accountId]);

        console.log('\nTransaction Type'.padEnd(35) + 'Type'.padEnd(8) + 'Count'.padEnd(8) + 'Total');
        console.log('-'.repeat(70));
        breakdown.forEach(row => {
          const sign = row.entry_type === 'debit' ? '+' : '-';
          console.log(
            row.transaction_type.padEnd(35) +
            row.entry_type.toUpperCase().padEnd(8) +
            row.count.toString().padEnd(8) +
            `${sign}$${Number(row.total).toFixed(2)}`
          );
        });

        // Check for suspicious patterns
        console.log('\n--- Checking for Issues ---');
        
        // 1. Check for duplicate entries on same date
        const [duplicates] = await connection.query(`
          SELECT 
            t.transaction_date,
            t.description,
            je.entry_type,
            je.amount,
            COUNT(*) as occurrence_count
          FROM journal_entries je
          JOIN transactions t ON je.transaction_id = t.id
          WHERE je.account_id = ?
          GROUP BY DATE(t.transaction_date), t.description, je.entry_type, je.amount
          HAVING COUNT(*) > 1
        `, [accountId]);

        if (duplicates.length > 0) {
          console.log(`\n⚠️  Found ${duplicates.length} potential duplicate entries:`);
          duplicates.forEach(dup => {
            const date = new Date(dup.transaction_date).toLocaleDateString();
            console.log(`  ${date} | ${dup.entry_type} $${dup.amount} | x${dup.occurrence_count} | ${dup.description.substring(0, 40)}`);
          });
        } else {
          console.log('✅ No obvious duplicates found');
        }

        // 2. Show recent large transactions
        console.log('\nLarge Transactions (>$500):');
        const [largeTxns] = await connection.query(`
          SELECT 
            t.transaction_date,
            je.entry_type,
            je.amount,
            t.description,
            t.transaction_type
          FROM journal_entries je
          JOIN transactions t ON je.transaction_id = t.id
          WHERE je.account_id = ?
            AND je.amount > 500
          ORDER BY t.transaction_date DESC
          LIMIT 10
        `, [accountId]);

        largeTxns.forEach(txn => {
          const date = new Date(txn.transaction_date).toLocaleDateString();
          const sign = txn.entry_type === 'debit' ? '+' : '-';
          console.log(`  ${date} | ${txn.entry_type.padEnd(6)} ${sign}$${Number(txn.amount).toFixed(2).padStart(10)} | ${txn.description.substring(0, 40)}`);
        });
      } else {
        console.log('✅ Balance is correct!');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

investigateDiscrepancies();

