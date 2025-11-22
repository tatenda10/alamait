require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');

// Database configurations
const localhostConfig = process.env.LOCAL_DB_HOST ? {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '',
  database: process.env.LOCAL_DB_NAME || 'alamait'
} : null;

const onlineConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait'
};

async function compareRevenue() {
  let localhostConn, onlineConn;

  try {
    console.log('='.repeat(80));
    console.log('COMPARING REVENUE: Localhost vs Online');
    console.log('='.repeat(80));
    console.log('');

    if (!localhostConfig) {
      throw new Error('Localhost config not set! Please set LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_NAME in .env');
    }

    // Connect to databases
    console.log('📊 Connecting to LOCALHOST...');
    localhostConn = await mysql.createConnection(localhostConfig);
    console.log('✅ Connected to localhost\n');

    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    console.log('✅ Connected to online server\n');

    const startDate = '2025-10-01';
    const endDate = '2025-10-31';

    // 1. Compare transactions in date range
    console.log('1️⃣  Comparing transactions in date range...');
    const [localhostTx] = await localhostConn.query(`
      SELECT COUNT(*) as total
      FROM transactions
      WHERE transaction_date >= ? 
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `, [startDate, endDate]);

    const [onlineTx] = await onlineConn.query(`
      SELECT COUNT(*) as total
      FROM transactions
      WHERE transaction_date >= ? 
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `, [startDate, endDate]);

    console.log(`   Localhost: ${localhostTx[0].total} transactions`);
    console.log(`   Online: ${onlineTx[0].total} transactions`);
    console.log(`   Difference: ${localhostTx[0].total - onlineTx[0].total}`);
    console.log('');

    // 2. Compare journal entries
    console.log('2️⃣  Comparing journal entries...');
    const [localhostJE] = await localhostConn.query(`
      SELECT COUNT(*) as total
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);

    const [onlineJE] = await onlineConn.query(`
      SELECT COUNT(*) as total
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);

    console.log(`   Localhost: ${localhostJE[0].total} journal entries`);
    console.log(`   Online: ${onlineJE[0].total} journal entries`);
    console.log(`   Difference: ${localhostJE[0].total - onlineJE[0].total}`);
    console.log('');

    // 3. Compare credit entries by account type (LOCALHOST)
    console.log('3️⃣  Credit entries by account type - LOCALHOST...');
    const [localhostCreditByType] = await localhostConn.query(`
      SELECT 
        coa.type as account_type,
        COUNT(*) as entry_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type
      ORDER BY entry_count DESC
    `, [startDate, endDate]);

    console.log('   Localhost credit entries:');
    localhostCreditByType.forEach(ct => {
      console.log(`     ${ct.account_type}: ${ct.entry_count} entries, $${parseFloat(ct.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 4. Compare credit entries by account type (ONLINE)
    console.log('4️⃣  Credit entries by account type - ONLINE...');
    const [onlineCreditByType] = await onlineConn.query(`
      SELECT 
        coa.type as account_type,
        COUNT(*) as entry_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type
      ORDER BY entry_count DESC
    `, [startDate, endDate]);

    console.log('   Online credit entries:');
    onlineCreditByType.forEach(ct => {
      console.log(`     ${ct.account_type}: ${ct.entry_count} entries, $${parseFloat(ct.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 5. Compare revenue entries specifically
    console.log('5️⃣  Revenue entries comparison...');
    const [localhostRevenue] = await localhostConn.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(je.amount), 0) as total_amount,
        COUNT(DISTINCT t.id) as transaction_count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `, [startDate, endDate]);

    const [onlineRevenue] = await onlineConn.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(je.amount), 0) as total_amount,
        COUNT(DISTINCT t.id) as transaction_count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `, [startDate, endDate]);

    console.log('   LOCALHOST:');
    console.log(`     Revenue entries: ${localhostRevenue[0].total}`);
    console.log(`     Total revenue: $${parseFloat(localhostRevenue[0].total_amount).toFixed(2)}`);
    console.log(`     Transactions: ${localhostRevenue[0].transaction_count}`);
    console.log('');
    console.log('   ONLINE:');
    console.log(`     Revenue entries: ${onlineRevenue[0].total}`);
    console.log(`     Total revenue: $${parseFloat(onlineRevenue[0].total_amount).toFixed(2)}`);
    console.log(`     Transactions: ${onlineRevenue[0].transaction_count}`);
    console.log('');

    // 6. Sample revenue transactions from LOCALHOST
    console.log('6️⃣  Sample revenue transactions from LOCALHOST...');
    const [localhostSample] = await localhostConn.query(`
      SELECT 
        t.id as transaction_id,
        t.transaction_type,
        t.transaction_date,
        t.status,
        t.reference,
        coa.code as account_code,
        coa.name as account_name,
        je.amount,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, t.id
      LIMIT 10
    `, [startDate, endDate]);

    console.log(`   Found ${localhostSample.length} revenue transactions on localhost:`);
    localhostSample.forEach((tx, idx) => {
      console.log(`   ${idx + 1}. Txn ${tx.transaction_id} | ${tx.transaction_type} | ${tx.transaction_date} | Status: "${tx.status || 'NULL'}" | $${tx.amount} | ${tx.account_code} - ${tx.account_name} | ${tx.boarding_house_name}`);
    });
    console.log('');

    // 7. Check if these transactions exist on ONLINE
    if (localhostSample.length > 0) {
      console.log('7️⃣  Checking if these transactions exist on ONLINE...');
      const transactionIds = localhostSample.map(tx => tx.transaction_id);
      const [onlineExists] = await onlineConn.query(`
        SELECT id, transaction_type, transaction_date, status, reference
        FROM transactions
        WHERE id IN (?)
          AND deleted_at IS NULL
      `, [transactionIds]);

      console.log(`   Found ${onlineExists.length} of ${transactionIds.length} transactions on online:`);
      onlineExists.forEach(tx => {
        console.log(`     ✅ Txn ${tx.id}: ${tx.transaction_type} | ${tx.transaction_date} | Status: "${tx.status || 'NULL'}"`);
      });

      const missingIds = transactionIds.filter(id => !onlineExists.find(tx => tx.id === id));
      if (missingIds.length > 0) {
        console.log(`\n   ❌ Missing transactions on online: ${missingIds.join(', ')}`);
      }

      // Check journal entries for these transactions on online
      if (onlineExists.length > 0) {
        const existingIds = onlineExists.map(tx => tx.id);
        const [onlineJEForTx] = await onlineConn.query(`
          SELECT 
            je.entry_type,
            coa.type as account_type,
            COUNT(*) as count,
            COALESCE(SUM(je.amount), 0) as total
          FROM journal_entries je
          JOIN transactions t ON je.transaction_id = t.id
          JOIN chart_of_accounts coa ON je.account_id = coa.id
          WHERE t.id IN (?)
            AND je.deleted_at IS NULL
            AND t.deleted_at IS NULL
            AND coa.deleted_at IS NULL
          GROUP BY je.entry_type, coa.type
        `, [existingIds]);

        console.log('\n   Journal entries for these transactions on ONLINE:');
        onlineJEForTx.forEach(je => {
          console.log(`     ${je.entry_type} → ${je.account_type}: ${je.count} entries, $${parseFloat(je.total).toFixed(2)}`);
        });
      }
      console.log('');
    }

    // 8. Compare transaction IDs in range
    console.log('8️⃣  Comparing transaction ID ranges...');
    const [localhostTxRange] = await localhostConn.query(`
      SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total
      FROM transactions
      WHERE transaction_date >= ? 
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `, [startDate, endDate]);

    const [onlineTxRange] = await onlineConn.query(`
      SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total
      FROM transactions
      WHERE transaction_date >= ? 
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `, [startDate, endDate]);

    console.log('   LOCALHOST:');
    console.log(`     ID Range: ${localhostTxRange[0].min_id} - ${localhostTxRange[0].max_id}`);
    console.log(`     Total: ${localhostTxRange[0].total}`);
    console.log('');
    console.log('   ONLINE:');
    console.log(`     ID Range: ${onlineTxRange[0].min_id} - ${onlineTxRange[0].max_id}`);
    console.log(`     Total: ${onlineTxRange[0].total}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ COMPARISON COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (localhostConn) {
      await localhostConn.end();
    }
    if (onlineConn) {
      await onlineConn.end();
    }
    console.log('');
    console.log('🔌 Database connections closed.');
  }
}

// Run the comparison
compareRevenue()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

