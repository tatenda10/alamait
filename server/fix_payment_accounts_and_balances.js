require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixPaymentAccountsAndBalances() {
  console.log('🔧 Fixing Payment Accounts and Recalculating Balances...\n');

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
      WHERE code IN ('10001', '10002', '10005')
      ORDER BY code
    `);
    console.table(accounts);

    const cashAccountId = accounts.find(a => a.code === '10001').id;  // Cash
    const cbzBankAccountId = accounts.find(a => a.code === '10002').id;  // CBZ Bank Account
    const accountsReceivableId = accounts.find(a => a.code === '10005').id;  // Accounts Receivable

    // 2. Check current October payment journal entries
    console.log('\n2️⃣ Checking October payment journal entries...');
    const [currentEntries] = await connection.execute(`
      SELECT 
        je.id,
        je.account_id,
        coa.code,
        coa.name,
        je.entry_type,
        t.id as transaction_id,
        sp.payment_method
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN student_payments sp ON sp.transaction_id = t.id
      WHERE t.transaction_type = 'payment'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND je.entry_type = 'debit'
        AND coa.code != '10005'
      ORDER BY je.id
    `);

    console.log(`Found ${currentEntries.length} debit entries to check`);

    // 3. Update journal entries based on payment method
    console.log('\n3️⃣ Updating journal entries to correct accounts...');
    let cashUpdates = 0;
    let bankUpdates = 0;

    for (const entry of currentEntries) {
      const correctAccountId = entry.payment_method === 'bank' ? cbzBankAccountId : cashAccountId;
      
      if (entry.account_id !== correctAccountId) {
        await connection.execute(`
          UPDATE journal_entries
          SET account_id = ?,
              description = ?
          WHERE id = ?
        `, [
          correctAccountId,
          entry.payment_method === 'bank' 
            ? 'Student payment - Debit CBZ Bank Account'
            : 'Student payment - Debit Cash',
          entry.id
        ]);

        if (entry.payment_method === 'bank') {
          bankUpdates++;
          console.log(`✓ Updated entry ${entry.id} to CBZ Bank Account`);
        } else {
          cashUpdates++;
          console.log(`✓ Updated entry ${entry.id} to Cash`);
        }
      }
    }

    console.log(`\nUpdated ${cashUpdates} entries to Cash, ${bankUpdates} entries to CBZ Bank`);

    // 4. Recalculate current_account_balances from journal_entries
    console.log('\n4️⃣ Recalculating account balances from journal entries...');

    // For Cash (10001)
    const [cashBalance] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
      FROM journal_entries je
      WHERE je.account_id = ?
        AND je.deleted_at IS NULL
    `, [cashAccountId]);

    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = ?,
          updated_at = NOW()
      WHERE account_id = ?
    `, [cashBalance[0].balance, cashAccountId]);

    console.log(`✓ Cash (10001) balance updated to: $${parseFloat(cashBalance[0].balance).toFixed(2)}`);

    // For CBZ Bank Account (10002)
    const [bankBalance] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
      FROM journal_entries je
      WHERE je.account_id = ?
        AND je.deleted_at IS NULL
    `, [cbzBankAccountId]);

    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = ?,
          updated_at = NOW()
      WHERE account_id = ?
    `, [bankBalance[0].balance, cbzBankAccountId]);

    console.log(`✓ CBZ Bank Account (10002) balance updated to: $${parseFloat(bankBalance[0].balance).toFixed(2)}`);

    // For Accounts Receivable (10005)
    const [arBalance] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as balance
      FROM journal_entries je
      WHERE je.account_id = ?
        AND je.deleted_at IS NULL
    `, [accountsReceivableId]);

    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = ?,
          updated_at = NOW()
      WHERE account_id = ?
    `, [arBalance[0].balance, accountsReceivableId]);

    console.log(`✓ Accounts Receivable (10005) balance updated to: $${parseFloat(arBalance[0].balance).toFixed(2)}`);

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
      WHERE coa.code IN ('10001', '10002', '10005')
      ORDER BY coa.code
    `);
    console.table(finalBalances);

    // 6. Show October payment summary by method
    console.log('\n📊 OCTOBER PAYMENT SUMMARY BY METHOD:');
    const [paymentSummary] = await connection.execute(`
      SELECT 
        sp.payment_method,
        COUNT(*) as payment_count,
        SUM(sp.amount) as total_amount
      FROM student_payments sp
      WHERE sp.payment_date >= '2025-10-01'
        AND sp.payment_date <= '2025-10-31'
        AND sp.deleted_at IS NULL
      GROUP BY sp.payment_method
    `);
    console.table(paymentSummary);

    console.log('\n✅ Payment accounts and balances fixed successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

fixPaymentAccountsAndBalances();

