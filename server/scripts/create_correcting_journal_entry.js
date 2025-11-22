require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function createCorrectingJournalEntry() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('CREATING CORRECTING JOURNAL ENTRY');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    await connection.beginTransaction();

    // Get account IDs
    console.log('1️⃣  Fetching account information...\n');
    
    const [openingBalanceEquity] = await connection.query(
      `SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE code = '30004' AND type = 'Equity' AND deleted_at IS NULL`
    );

    const [revenue] = await connection.query(
      `SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE code = '40001' AND type = 'Revenue' AND deleted_at IS NULL`
    );

    if (openingBalanceEquity.length === 0) {
      throw new Error('Opening Balance Equity account (30004) not found');
    }

    if (revenue.length === 0) {
      throw new Error('Revenue account (40001) not found');
    }

    const openingBalanceEquityId = openingBalanceEquity[0].id;
    const revenueId = revenue[0].id;
    const correctionAmount = 2966.00; // Updated after deleting duplicate

    // Get a valid boarding house ID
    const [boardingHouses] = await connection.query(
      `SELECT id FROM boarding_houses WHERE deleted_at IS NULL LIMIT 1`
    );
    
    if (boardingHouses.length === 0) {
      throw new Error('No boarding houses found');
    }
    
    const boardingHouseId = boardingHouses[0].id;

    console.log(`   Opening Balance Equity (30004): ID ${openingBalanceEquityId}`);
    console.log(`   Revenue (40001): ID ${revenueId}`);
    console.log(`   Boarding House ID: ${boardingHouseId}`);
    console.log(`   Correction Amount: $${correctionAmount.toFixed(2)}\n`);

    // Create transaction
    console.log('2️⃣  Creating transaction...\n');
    
    // Use September 29, 2025 as the transaction date
    const transactionDate = '2025-09-29';
    const referenceNo = `CORR-${Date.now()}`;
    const description = 'Correcting entry: Reclassify student opening balances from Revenue to Opening Balance Equity';

    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        transaction_date,
        reference,
        description,
        amount,
        boarding_house_id,
        status,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'posted', 1, NOW())`,
      ['adjustment', transactionDate, referenceNo, description, 0, boardingHouseId]
    );

    const transactionId = transactionResult.insertId;
    console.log(`   ✅ Transaction created: ID ${transactionId}`);
    console.log(`   Reference: ${referenceNo}`);
    console.log(`   Date: ${transactionDate}\n`);

    // Create journal entries
    console.log('3️⃣  Creating journal entries...\n');

    // Debit: Opening Balance Equity
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
      [
        transactionId,
        openingBalanceEquityId,
        correctionAmount,
        'Reclassify student opening balances from Revenue to Opening Balance Equity',
        boardingHouseId
      ]
    );
    console.log(`   ✅ Debit: Opening Balance Equity (30004) - $${correctionAmount.toFixed(2)}`);

    // Credit: Revenue
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
      [
        transactionId,
        revenueId,
        correctionAmount,
        'Reclassify student opening balances from Revenue to Opening Balance Equity',
        boardingHouseId
      ]
    );
    console.log(`   ✅ Credit: Revenue (40001) - $${correctionAmount.toFixed(2)}\n`);

    await connection.commit();

    console.log('='.repeat(80));
    console.log('✅ Correcting Journal Entry Created Successfully!');
    console.log('='.repeat(80));
    console.log('');
    console.log('Summary:');
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Reference: ${referenceNo}`);
    console.log(`   Date: ${transactionDate}`);
    console.log(`   Debit:  Opening Balance Equity (30004) - $${correctionAmount.toFixed(2)}`);
    console.log(`   Credit: Revenue (40001) - $${correctionAmount.toFixed(2)}`);
    console.log('');

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error creating correcting journal entry:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('🔌 Database connection closed.\n');
  }
}

createCorrectingJournalEntry();

