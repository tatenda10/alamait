const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCashBalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    console.log('\n=== UPDATING CASH ACCOUNT BALANCES ===\n');

    const balancesToUpdate = [
      { code: '10002', name: 'Cash', balance: 3353.55 },
      { code: '10004', name: 'CBZ Vault', balance: 1780.00 },
    ];

    // Update Cash and CBZ Vault in current_account_balances
    for (const account of balancesToUpdate) {
      console.log(`\n--- Updating ${account.name} (${account.code}) ---`);
      
      // Find the account
      const [coaAccounts] = await connection.query(
        `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
        [account.code]
      );

      if (coaAccounts.length === 0) {
        console.log(`❌ Account ${account.code} not found. Skipping.`);
        continue;
      }

      const coaId = coaAccounts[0].id;
      const coaCode = coaAccounts[0].code;
      const coaName = coaAccounts[0].name;
      const coaType = coaAccounts[0].type;

      // Get current balance
      const [currentBalanceResult] = await connection.query(
        `SELECT current_balance FROM current_account_balances WHERE account_id = ?`,
        [coaId]
      );

      let currentBalance = 0;
      if (currentBalanceResult.length > 0) {
        currentBalance = parseFloat(currentBalanceResult[0].current_balance);
      }

      console.log(`   Current Balance: $${currentBalance.toFixed(2)}`);
      console.log(`   New Balance: $${account.balance.toFixed(2)}`);

      // Update current_account_balances
      if (currentBalanceResult.length > 0) {
        await connection.query(
          `UPDATE current_account_balances 
           SET current_balance = ?, updated_at = NOW()
           WHERE account_id = ?`,
          [account.balance, coaId]
        );
        console.log(`   ✅ Updated balance in current_account_balances`);
      } else {
        await connection.query(
          `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [coaId, coaCode, coaName, coaType, account.balance]
        );
        console.log(`   ✅ Inserted new balance into current_account_balances`);
      }
    }

    // Update Petty Cash (sum of all petty_cash_accounts)
    console.log(`\n--- Updating Petty Cash (10001) ---`);
    
    // Find Petty Cash COA
    const [pettyCashCOA] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashCOA.length > 0) {
      const pcCoaId = pettyCashCOA[0].id;
      const targetPettyCashBalance = 71.08;

      // Get current sum from petty_cash_accounts
      const [currentPettyCashSum] = await connection.query(
        `SELECT COALESCE(SUM(current_balance), 0) as total FROM petty_cash_accounts WHERE deleted_at IS NULL AND status = 'active'`
      );
      const currentSum = parseFloat(currentPettyCashSum[0].total || 0);

      console.log(`   Current Sum (from petty_cash_accounts): $${currentSum.toFixed(2)}`);
      console.log(`   Target Balance: $${targetPettyCashBalance.toFixed(2)}`);

      // Calculate difference needed
      const difference = targetPettyCashBalance - currentSum;

      if (Math.abs(difference) > 0.01) {
        // Find the sysadmin petty cash account (or first active account)
        const [pettyCashAccounts] = await connection.query(
          `SELECT id, current_balance, petty_cash_user_id FROM petty_cash_accounts WHERE deleted_at IS NULL AND status = 'active' ORDER BY id LIMIT 1`
        );

        if (pettyCashAccounts.length > 0) {
          const pca = pettyCashAccounts[0];
          const newPCABalance = parseFloat(pca.current_balance) + difference;
          
          await connection.query(
            `UPDATE petty_cash_accounts SET current_balance = ?, updated_at = NOW() WHERE id = ?`,
            [newPCABalance, pca.id]
          );
          console.log(`   ✅ Updated petty_cash_accounts balance: $${parseFloat(pca.current_balance).toFixed(2)} → $${newPCABalance.toFixed(2)}`);
        } else {
          console.log(`   ⚠️  No active petty cash accounts found. Cannot update.`);
        }
      } else {
        console.log(`   ℹ️  Petty cash balance already matches target.`);
      }

      // Update current_account_balances for Petty Cash COA
      const [pcCabResult] = await connection.query(
        `SELECT current_balance FROM current_account_balances WHERE account_id = ?`,
        [pcCoaId]
      );

      if (pcCabResult.length > 0) {
        await connection.query(
          `UPDATE current_account_balances 
           SET current_balance = ?, updated_at = NOW()
           WHERE account_id = ?`,
          [targetPettyCashBalance, pcCoaId]
        );
        console.log(`   ✅ Updated Petty Cash COA balance in current_account_balances`);
      } else {
        await connection.query(
          `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [pcCoaId, pettyCashCOA[0].code, pettyCashCOA[0].name, pettyCashCOA[0].type, targetPettyCashBalance]
        );
        console.log(`   ✅ Inserted Petty Cash COA balance into current_account_balances`);
      }
    } else {
      console.log(`   ❌ Petty Cash COA (10001) not found. Skipping.`);
    }

    await connection.commit();

    console.log('\n✅ ALL CASH BALANCES UPDATED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`- Cash (10002): $3,353.55`);
    console.log(`- CBZ Vault (10004): $1,780.00`);
    console.log(`- Petty Cash (10001): $71.08`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error updating cash balances:', error);
    process.exit(1);
  } finally {
    connection.end();
  }
}

updateCashBalances();

