const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCBZVaultBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    const vaultAccountCode = '10004';
    const newBalance = 1780.00;

    console.log('\n=== UPDATING CBZ VAULT BALANCE ===\n');

    // 1. Find the CBZ Vault account in Chart of Accounts
    const [vaultAccount] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [vaultAccountCode]
    );

    if (vaultAccount.length === 0) {
      throw new Error(`CBZ Vault account (${vaultAccountCode}) not found in Chart of Accounts.`);
    }
    const coaId = vaultAccount[0].id;
    const coaCode = vaultAccount[0].code;
    const coaName = vaultAccount[0].name;
    const coaType = vaultAccount[0].type;

    console.log(`✅ Found CBZ Vault COA: ${coaCode} - ${coaName} (ID: ${coaId})\n`);

    // 2. Calculate current balance from journal entries
    const [calculatedBalanceResult] = await connection.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE -je.amount END), 0) as calculated_balance
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE je.account_id = ? AND je.deleted_at IS NULL AND t.deleted_at IS NULL AND t.status = 'posted'`,
      [coaId]
    );

    const calculatedBalance = parseFloat(calculatedBalanceResult[0].calculated_balance || 0);
    console.log(`📊 Current Balance from Journal Entries: $${calculatedBalance.toFixed(2)}`);
    console.log(`📊 Target Balance: $${newBalance.toFixed(2)}\n`);

    // 3. Get current balance from current_account_balances
    const [currentBalanceResult] = await connection.query(
      `SELECT current_balance FROM current_account_balances WHERE account_id = ?`,
      [coaId]
    );

    let storedBalance = 0;
    if (currentBalanceResult.length > 0) {
      storedBalance = parseFloat(currentBalanceResult[0].current_balance);
      console.log(`💾 Current Balance in DB (current_account_balances): $${storedBalance.toFixed(2)}\n`);
    } else {
      console.log('⚠️  CBZ Vault not found in current_account_balances. Will insert new record.\n');
    }

    // 4. Calculate the difference needed
    const difference = newBalance - calculatedBalance;
    console.log(`📊 Difference needed: $${difference.toFixed(2)}`);
    console.log(`   (This represents the adjustment needed in journal entries)\n`);

    if (Math.abs(difference) < 0.01) {
      console.log('ℹ️  Balance from journal entries already matches target. Only updating current_account_balances.\n');
    } else {
      console.log(`⚠️  Note: Balance from journal entries is $${calculatedBalance.toFixed(2)}, but target is $${newBalance.toFixed(2)}.`);
      console.log(`   This script will update current_account_balances, but you may need to create an adjusting journal entry`);
      console.log(`   to reconcile the difference of $${Math.abs(difference).toFixed(2)}.\n`);
    }

    // 5. Update current_account_balances
    if (currentBalanceResult.length > 0) {
      await connection.query(
        `UPDATE current_account_balances 
         SET current_balance = ?, updated_at = NOW()
         WHERE account_id = ?`,
        [newBalance, coaId]
      );
      console.log(`✅ Updated existing CBZ Vault balance in current_account_balances.\n`);
    } else {
      await connection.query(
        `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [coaId, coaCode, coaName, coaType, newBalance]
      );
      console.log(`✅ Inserted new CBZ Vault balance into current_account_balances.\n`);
    }

    // 6. Verify update
    const [updatedBalanceResult] = await connection.query(
      `SELECT current_balance FROM current_account_balances WHERE account_id = ?`,
      [coaId]
    );
    console.log(`📊 Verified Updated Balance: $${parseFloat(updatedBalanceResult[0].current_balance).toFixed(2)}\n`);

    await connection.commit();
    
    console.log('✅ CBZ VAULT BALANCE UPDATED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`- Balance in current_account_balances: $${newBalance.toFixed(2)}`);
    console.log(`- Balance from journal entries: $${calculatedBalance.toFixed(2)}`);
    if (Math.abs(difference) > 0.01) {
      console.log(`- ⚠️  Difference: $${Math.abs(difference).toFixed(2)}`);
      console.log(`- Consider creating an adjusting journal entry to reconcile this difference.`);
    }

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error updating CBZ Vault balance:', error);
    process.exit(1);
  } finally {
    connection.end();
  }
}

updateCBZVaultBalance();

