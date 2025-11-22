require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function diagnoseRevenue() {
  let connection = null;

  try {
    console.log('='.repeat(80));
    console.log('DIAGNOSING REVENUE ISSUE - OCTOBER 2025');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    const startDate = '2025-10-01';
    const endDate = '2025-10-31';

    // 1. Check transactions in date range
    console.log('1️⃣  Checking transactions in date range...');
    const [transactions] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted,
        COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as null_status,
        COUNT(CASE WHEN status NOT IN ('posted', '') AND status IS NOT NULL THEN 1 END) as other_status
      FROM transactions
      WHERE transaction_date >= ? 
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Total transactions: ${transactions[0].total}`);
    console.log(`   Posted: ${transactions[0].posted}`);
    console.log(`   NULL/Empty status: ${transactions[0].null_status}`);
    console.log(`   Other status: ${transactions[0].other_status}`);
    console.log('');

    // 2. Check journal entries for those transactions
    console.log('2️⃣  Checking journal entries for transactions in date range...');
    const [journalEntries] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN je.entry_type = 'credit' THEN 1 END) as credit_entries,
        COUNT(CASE WHEN je.entry_type = 'debit' THEN 1 END) as debit_entries
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Total journal entries: ${journalEntries[0].total}`);
    console.log(`   Credit entries: ${journalEntries[0].credit_entries}`);
    console.log(`   Debit entries: ${journalEntries[0].debit_entries}`);
    console.log('');

    // 2b. Check what account types credit entries are linked to
    console.log('2️⃣b Checking credit entries by account type...');
    const [creditByType] = await connection.query(`
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
    
    console.log('   Credit entries by account type:');
    creditByType.forEach(ct => {
      console.log(`     ${ct.account_type}: ${ct.entry_count} entries, $${parseFloat(ct.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 3. Check revenue accounts
    console.log('3️⃣  Checking revenue accounts...');
    const [revenueAccounts] = await connection.query(`
      SELECT id, code, name, type
      FROM chart_of_accounts
      WHERE UPPER(TRIM(type)) = 'REVENUE'
        AND deleted_at IS NULL
    `);
    
    console.log(`   Found ${revenueAccounts.length} revenue accounts:`);
    revenueAccounts.forEach(acc => {
      console.log(`     - ${acc.code}: ${acc.name} (type: "${acc.type}")`);
    });
    console.log('');

    // 4. Check credit entries linked to revenue accounts
    console.log('4️⃣  Checking credit entries linked to revenue accounts...');
    const [revenueEntries] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(je.amount), 0) as total_amount,
        COUNT(DISTINCT t.id) as transaction_count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Revenue credit entries: ${revenueEntries[0].total}`);
    console.log(`   Total revenue amount: $${parseFloat(revenueEntries[0].total_amount).toFixed(2)}`);
    console.log(`   Transaction count: ${revenueEntries[0].transaction_count}`);
    console.log('');

    // 5. Check with status filter (as in the actual query)
    console.log('5️⃣  Checking with status filter (posted or NULL)...');
    const [revenueWithStatus] = await connection.query(`
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
    
    console.log(`   Revenue entries (with status filter): ${revenueWithStatus[0].total}`);
    console.log(`   Total revenue amount: $${parseFloat(revenueWithStatus[0].total_amount).toFixed(2)}`);
    console.log(`   Transaction count: ${revenueWithStatus[0].transaction_count}`);
    console.log('');

    // 6. Check transaction statuses for revenue transactions
    console.log('6️⃣  Checking transaction statuses for revenue transactions...');
    const [statusBreakdown] = await connection.query(`
      SELECT 
        t.status,
        COUNT(*) as entry_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY t.status
    `, [startDate, endDate]);
    
    console.log('   Status breakdown:');
    statusBreakdown.forEach(s => {
      console.log(`     Status "${s.status || 'NULL'}": ${s.entry_count} entries, $${parseFloat(s.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 7. Sample transactions (showing both debit and credit)
    console.log('7️⃣  Sample transactions in October (showing journal entries)...');
    const [sampleTransactions] = await connection.query(`
      SELECT 
        t.id as transaction_id,
        t.transaction_type,
        t.transaction_date,
        t.status,
        t.reference,
        t.description,
        je.entry_type,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        je.amount,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.id, je.entry_type
      LIMIT 20
    `, [startDate, endDate]);
    
    console.log(`   Showing ${sampleTransactions.length} journal entries from sample transactions:`);
    let currentTxId = null;
    sampleTransactions.forEach((tx, idx) => {
      if (currentTxId !== tx.transaction_id) {
        console.log(`\n   Transaction ${tx.transaction_id}: ${tx.transaction_type} | ${tx.transaction_date} | Status: "${tx.status || 'NULL'}" | ${tx.reference || 'N/A'}`);
        console.log(`     Description: ${tx.description || 'N/A'}`);
        currentTxId = tx.transaction_id;
      }
      console.log(`     ${tx.entry_type.toUpperCase()}: $${tx.amount} → ${tx.account_code} - ${tx.account_name} (${tx.account_type})`);
    });
    console.log('');

    // 8. Check boarding house filter
    console.log('8️⃣  Checking boarding house filter (St Kilda = ID 10)...');
    const [revenueWithBH] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.boarding_house_id = 10
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND bh.deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Revenue entries (St Kilda only): ${revenueWithBH[0].total}`);
    console.log(`   Total revenue amount: $${parseFloat(revenueWithBH[0].total_amount).toFixed(2)}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ DIAGNOSIS COMPLETE');
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
    if (connection) {
      await connection.end();
      console.log('');
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the diagnosis
diagnoseRevenue()
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

