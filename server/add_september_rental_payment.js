require('dotenv').config();
const mysql = require('mysql2/promise');

async function addSeptemberRentalPayment() {
  console.log('💰 Adding September Rental Payment Journal Entry...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    const amount = 140.00;
    const transactionDate = '2025-09-30'; // End of September
    const description = 'September rental payment';

    // Get account IDs
    const [cashAccount] = await connection.execute(`
      SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL
    `);

    const [arAccount] = await connection.execute(`
      SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL
    `);

    if (cashAccount.length === 0 || arAccount.length === 0) {
      throw new Error('Required accounts not found');
    }

    const cashAccountId = cashAccount[0].id;
    const arAccountId = arAccount[0].id;

    console.log('Account IDs:');
    console.log(`  Cash (10002): ${cashAccountId}`);
    console.log(`  Accounts Receivable (10005): ${arAccountId}`);

    // Get boarding house ID (use St Kilda as default)
    const [boardingHouse] = await connection.execute(`
      SELECT id FROM boarding_houses WHERE name = 'St Kilda' LIMIT 1
    `);

    const boardingHouseId = boardingHouse.length > 0 ? boardingHouse[0].id : 4;

    // Create transaction record
    console.log('\n📝 Creating transaction record...');
    const [transactionResult] = await connection.execute(`
      INSERT INTO transactions (
        transaction_type,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'rental_payment',
      `RENT-SEP-${Date.now()}`,
      amount,
      'USD',
      description,
      transactionDate,
      boardingHouseId,
      1 // Default user
    ]);

    const transactionId = transactionResult.insertId;
    console.log(`✓ Transaction created with ID: ${transactionId}`);

    // Create journal entries
    console.log('\n📚 Creating journal entries...');

    // 1. Debit: Cash (Asset increases)
    await connection.execute(`
      INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      transactionId,
      cashAccountId,
      'debit',
      amount,
      'Rental payment - Debit Cash',
      boardingHouseId,
      1
    ]);
    console.log(`✓ Debit Cash: $${amount.toFixed(2)}`);

    // 2. Credit: Accounts Receivable (Asset decreases)
    await connection.execute(`
      INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      transactionId,
      arAccountId,
      'credit',
      amount,
      'Rental payment - Credit Accounts Receivable',
      boardingHouseId,
      1
    ]);
    console.log(`✓ Credit Accounts Receivable: $${amount.toFixed(2)}`);

    // Update current_account_balances
    console.log('\n💼 Updating account balances...');

    // Update Cash balance
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
    `, [cashAccountId, cashAccountId]);
    console.log('✓ Cash balance updated');

    // Update Accounts Receivable balance
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
    `, [arAccountId, arAccountId]);
    console.log('✓ Accounts Receivable balance updated');

    await connection.commit();

    // Show updated balances
    console.log('\n' + '='.repeat(80));
    console.log('📊 UPDATED ACCOUNT BALANCES:');
    const [balances] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        cab.current_balance
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code IN ('10002', '10005')
      ORDER BY coa.code
    `);
    console.table(balances);

    console.log('\n✅ September rental payment journal entry created successfully!');
    console.log(`📅 Transaction Date: ${transactionDate}`);
    console.log(`💵 Amount: $${amount.toFixed(2)}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

addSeptemberRentalPayment();

