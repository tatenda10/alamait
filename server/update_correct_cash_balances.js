const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCorrectBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();
    
    console.log('\n=== UPDATING CASH BALANCES TO CORRECT VALUES ===\n');

    const correctBalances = [
      { code: '10001', name: 'Petty Cash', balance: 71.08, note: 'Using petty_cash_accounts' },
      { code: '10002', name: 'Cash', balance: 3268.55 },
      { code: '10003', name: 'CBZ Bank Account', balance: 339.75 },
      { code: '10004', name: 'CBZ Vault', balance: 6280.00 }
    ];

    for (const account of correctBalances) {
      if (account.code === '10001') {
        // Petty Cash is already correct at $71.08
        console.log(`✅ ${account.code} - ${account.name}: $${account.balance} (${account.note})`);
        continue;
      }

      // Get account ID
      const [acc] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        [account.code]
      );

      if (acc.length === 0) {
        console.log(`❌ Account ${account.code} not found`);
        continue;
      }

      const accountId = acc[0].id;

      // Check if entry exists in current_account_balances
      const [existing] = await connection.query(
        'SELECT * FROM current_account_balances WHERE account_id = ?',
        [accountId]
      );

      if (existing.length > 0) {
        const oldBalance = existing[0].current_balance;
        
        // Update existing entry
        await connection.query(
          'UPDATE current_account_balances SET current_balance = ? WHERE account_id = ?',
          [account.balance, accountId]
        );
        
        console.log(`✅ ${account.code} - ${account.name}: $${oldBalance} → $${account.balance}`);
      } else {
        // Insert new entry
        await connection.query(
          'INSERT INTO current_account_balances (account_id, current_balance) VALUES (?, ?)',
          [accountId, account.balance]
        );
        
        console.log(`✅ ${account.code} - ${account.name}: Created with balance $${account.balance}`);
      }
    }

    await connection.commit();
    
    console.log('\n=== SUMMARY ===\n');
    console.log('Updated Balances:');
    console.log('  Petty Cash (10001):      $71.08');
    console.log('  Cash (10002):            $3,268.55');
    console.log('  CBZ Bank Account (10003): $339.75');
    console.log('  CBZ Vault (10004):       $6,280.00');
    console.log('  ─────────────────────────────────');
    const total = 71.08 + 3268.55 + 339.75 + 6280.00;
    console.log(`  TOTAL CASH POSITION:     $${total.toFixed(2)}`);
    console.log('');

    await connection.end();
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

updateCorrectBalances();

