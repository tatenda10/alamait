require('dotenv').config();
const mysql = require('mysql2/promise');

async function moveBankPayments() {
  console.log('🏦 Moving Bank Payments to CBZ Bank Account...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Get CBZ Bank Account ID
    const [cbzBank] = await connection.execute(`
      SELECT id FROM chart_of_accounts WHERE code = '10003'
    `);
    const cbzBankId = cbzBank[0].id;

    // Get Cash Account ID
    const [cashAccount] = await connection.execute(`
      SELECT id FROM chart_of_accounts WHERE code = '10002'
    `);
    const cashId = cashAccount[0].id;

    // Find bank payment journal entries
    const [bankPayments] = await connection.execute(`
      SELECT je.id, je.amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN student_payments sp ON sp.transaction_id = t.id
      WHERE sp.payment_method = 'bank'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND je.entry_type = 'debit'
        AND je.account_id = ?
    `, [cashId]);

    console.log(`Found ${bankPayments.length} bank payment entries to move`);

    // Move them to CBZ Bank Account
    for (const entry of bankPayments) {
      await connection.execute(`
        UPDATE journal_entries
        SET account_id = ?,
            description = 'Student payment - Debit CBZ Bank Account'
        WHERE id = ?
      `, [cbzBankId, entry.id]);
      
      console.log(`✓ Moved entry ${entry.id} ($${entry.amount}) to CBZ Bank Account`);
    }

    // Recalculate balances
    console.log('\nRecalculating balances...');

    // Update Cash (10002)
    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = (
        SELECT COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
               COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0)
        FROM journal_entries je
        WHERE je.account_id = ? AND je.deleted_at IS NULL
      ),
      updated_at = NOW()
      WHERE account_id = ?
    `, [cashId, cashId]);

    // Update CBZ Bank Account (10003)
    await connection.execute(`
      UPDATE current_account_balances
      SET current_balance = (
        SELECT COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) -
               COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0)
        FROM journal_entries je
        WHERE je.account_id = ? AND je.deleted_at IS NULL
      ),
      updated_at = NOW()
      WHERE account_id = ?
    `, [cbzBankId, cbzBankId]);

    await connection.commit();

    // Show final balances
    console.log('\n📊 UPDATED BALANCES:');
    const [balances] = await connection.execute(`
      SELECT coa.code, coa.name, cab.current_balance
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code IN ('10002', '10003')
      ORDER BY coa.code
    `);
    console.table(balances);

    console.log('\n✅ Bank payments moved to CBZ Bank Account successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

moveBankPayments();

