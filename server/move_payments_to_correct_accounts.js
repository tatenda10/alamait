require('dotenv').config();
const mysql = require('mysql2/promise');

async function movePaymentsToCorrectAccounts() {
  console.log('🔧 Moving Payment Journal Entries to Correct Accounts...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // 1. Get the correct account IDs
    console.log('1️⃣ Getting account IDs...');
    const [accounts] = await connection.execute(`
      SELECT id, code, name FROM chart_of_accounts
      WHERE code IN ('10001', '10002', '10003')
      ORDER BY code
    `);
    console.table(accounts);

    const pettyCashId = accounts.find(a => a.code === '10001').id;  // 10001 = Petty Cash
    const cashId = accounts.find(a => a.code === '10002').id;       // 10002 = Cash
    const cbzBankId = accounts.find(a => a.code === '10003')?.id;   // 10003 = CBZ Bank Account/Vault

    // 2. Find all October payment journal entries currently in Petty Cash (10001)
    console.log('\n2️⃣ Finding payment entries in wrong accounts...');
    const [wrongEntries] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        je.account_id,
        coa.code,
        coa.name,
        je.entry_type,
        je.amount,
        sp.payment_method
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN student_payments sp ON sp.transaction_id = t.id
      WHERE t.transaction_type = 'payment'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND je.entry_type = 'debit'
        AND je.account_id = ?
    `, [pettyCashId]);

    console.log(`Found ${wrongEntries.length} payment entries in Petty Cash (10001)`);

    // 3. Update entries to correct accounts based on payment method
    console.log('\n3️⃣ Moving entries to correct accounts...');
    let movedToCash = 0;
    let movedToBank = 0;

    for (const entry of wrongEntries) {
      let newAccountId;
      let newDescription;

      if (entry.payment_method === 'bank') {
        // Bank payments go to CBZ Bank Account (10003) or Cash (10002) if 10003 doesn't exist
        newAccountId = cbzBankId || cashId;
        newDescription = cbzBankId 
          ? 'Student payment - Debit CBZ Bank Account'
          : 'Student payment - Debit Cash (Bank Transfer)';
        movedToBank++;
      } else {
        // Cash payments go to Cash (10002)
        newAccountId = cashId;
        newDescription = 'Student payment - Debit Cash';
        movedToCash++;
      }

      await connection.execute(`
        UPDATE journal_entries
        SET account_id = ?,
            description = ?
        WHERE id = ?
      `, [newAccountId, newDescription, entry.id]);

      console.log(`✓ Moved entry ${entry.id} ($${entry.amount}) from Petty Cash to ${entry.payment_method === 'bank' ? 'Bank' : 'Cash'}`);
    }

    console.log(`\n✅ Moved ${movedToCash} entries to Cash (10002)`);
    console.log(`✅ Moved ${movedToBank} entries to Bank (10003)`);

    // 4. Recalculate account balances
    console.log('\n4️⃣ Recalculating account balances...');

    // Petty Cash (10001)
    const [pettyCashBalance] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
      FROM journal_entries je
      WHERE je.account_id = ?
        AND je.deleted_at IS NULL
    `, [pettyCashId]);

    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = ?,
          updated_at = NOW()
      WHERE account_id = ?
    `, [pettyCashBalance[0].balance, pettyCashId]);

    console.log(`✓ Petty Cash (10001) balance: $${parseFloat(pettyCashBalance[0].balance).toFixed(2)}`);

    // Cash (10002)
    const [cashBalance] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
      FROM journal_entries je
      WHERE je.account_id = ?
        AND je.deleted_at IS NULL
    `, [cashId]);

    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = ?,
          updated_at = NOW()
      WHERE account_id = ?
    `, [cashBalance[0].balance, cashId]);

    console.log(`✓ Cash (10002) balance: $${parseFloat(cashBalance[0].balance).toFixed(2)}`);

    // CBZ Bank Account (10003) if it exists
    if (cbzBankId) {
      const [cbzBalance] = await connection.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
        FROM journal_entries je
        WHERE je.account_id = ?
          AND je.deleted_at IS NULL
      `, [cbzBankId]);

      await connection.execute(`
        UPDATE current_account_balances
        SET current_balance = ?,
            updated_at = NOW()
        WHERE account_id = ?
      `, [cbzBalance[0].balance, cbzBankId]);

      console.log(`✓ CBZ Bank Account (10003) balance: $${parseFloat(cbzBalance[0].balance).toFixed(2)}`);
    }

    // Accounts Receivable (10005)
    const [arAccount] = await connection.execute(`
      SELECT id FROM chart_of_accounts WHERE code = '10005'
    `);
    
    if (arAccount.length > 0) {
      const [arBalance] = await connection.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
        FROM journal_entries je
        WHERE je.account_id = ?
          AND je.deleted_at IS NULL
      `, [arAccount[0].id]);

      await connection.execute(`
        UPDATE current_account_balances
        SET current_balance = ?,
            updated_at = NOW()
        WHERE account_id = ?
      `, [arBalance[0].balance, arAccount[0].id]);

      console.log(`✓ Accounts Receivable (10005) balance: $${parseFloat(arBalance[0].balance).toFixed(2)}`);
    }

    await connection.commit();

    // 5. Show final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL ACCOUNT BALANCES:');
    const [finalBalances] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        cab.current_balance
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code IN ('10001', '10002', '10003', '10005')
      ORDER BY coa.code
    `);
    console.table(finalBalances);

    // 6. Verify journal entries are now in correct accounts
    console.log('\n📊 OCTOBER PAYMENTS BY ACCOUNT:');
    const [entriesByAccount] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        COUNT(*) as entry_count,
        SUM(je.amount) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_type = 'payment'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND je.entry_type = 'debit'
      GROUP BY coa.code, coa.name
      ORDER BY coa.code
    `);
    console.table(entriesByAccount);

    console.log('\n✅ All payment entries moved to correct accounts!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

movePaymentsToCorrectAccounts();

