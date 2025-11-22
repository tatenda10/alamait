const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function checkRevenueAccounts() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');
    console.log('='.repeat(80));
    console.log('REVENUE ACCOUNTS DIAGNOSTIC CHECK');
    console.log('Date Range: 2025-10-01 to 2025-10-31');
    console.log('='.repeat(80));
    console.log('');

    // 1. Check if Revenue accounts exist
    console.log('1️⃣  Checking Revenue Accounts...');
    const [revenueAccounts] = await connection.query(`
      SELECT 
        id,
        code,
        name,
        type,
        created_at,
        deleted_at
      FROM chart_of_accounts
      WHERE type = 'Revenue'
        AND deleted_at IS NULL
      ORDER BY code
    `);
    
    console.log(`   Found ${revenueAccounts.length} revenue account(s):`);
    if (revenueAccounts.length === 0) {
      console.log('   ⚠️  WARNING: No revenue accounts found!');
    } else {
      revenueAccounts.forEach(acc => {
        console.log(`      - ${acc.code} | ${acc.name} (ID: ${acc.id})`);
      });
    }
    console.log('');

    // 2. Check transactions in date range
    console.log('2️⃣  Checking Transactions in Date Range...');
    const [transactions] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted,
        COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as null_status,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        MIN(transaction_date) as earliest_date,
        MAX(transaction_date) as latest_date
      FROM transactions
      WHERE transaction_date >= '2025-10-01'
        AND transaction_date <= '2025-10-31 23:59:59'
        AND deleted_at IS NULL
    `);
    
    const tx = transactions[0];
    console.log(`   Total transactions: ${tx.total}`);
    console.log(`   - Posted: ${tx.posted}`);
    console.log(`   - NULL/Empty status: ${tx.null_status}`);
    console.log(`   - Draft: ${tx.draft}`);
    console.log(`   Date range: ${tx.earliest_date} to ${tx.latest_date}`);
    console.log('');

    // 2b. List all transactions in date range
    console.log('2️⃣b Listing All Transactions in Date Range...');
    const [allTransactions] = await connection.query(`
      SELECT 
        id,
        transaction_type,
        transaction_date,
        status,
        reference,
        description,
        amount,
        currency,
        boarding_house_id,
        created_at
      FROM transactions
      WHERE transaction_date >= '2025-10-01'
        AND transaction_date <= '2025-10-31 23:59:59'
        AND deleted_at IS NULL
      ORDER BY transaction_date, id
    `);
    
    console.log(`   Found ${allTransactions.length} transaction(s):`);
    if (allTransactions.length === 0) {
      console.log('   ⚠️  No transactions found!');
    } else {
      allTransactions.forEach((t, idx) => {
        console.log(`   ${idx + 1}. Transaction #${t.id}`);
        console.log(`      Type: ${t.transaction_type}`);
        console.log(`      Date: ${t.transaction_date}`);
        console.log(`      Status: ${t.status || 'NULL'}`);
        console.log(`      Reference: ${t.reference || 'N/A'}`);
        console.log(`      Description: ${t.description || 'N/A'}`);
        console.log(`      Amount: ${t.amount || 'N/A'} ${t.currency || ''}`);
        console.log(`      Boarding House ID: ${t.boarding_house_id || 'N/A'}`);
        console.log(`      Created: ${t.created_at}`);
        console.log('');
      });
    }
    console.log('');

    // 3. Check ALL journal entries for these transactions
    console.log('3️⃣  Checking ALL Journal Entries for These Transactions...');
    const [allJournalEntries] = await connection.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT je.transaction_id) as unique_transactions,
        COUNT(CASE WHEN je.entry_type = 'debit' THEN 1 END) as debit_entries,
        COUNT(CASE WHEN je.entry_type = 'credit' THEN 1 END) as credit_entries
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31 23:59:59'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `);
    
    const allJe = allJournalEntries[0];
    console.log(`   Total journal entries: ${allJe.total_entries}`);
    console.log(`   Unique transactions with entries: ${allJe.unique_transactions}`);
    console.log(`   Debit entries: ${allJe.debit_entries}`);
    console.log(`   Credit entries: ${allJe.credit_entries}`);
    console.log(`   Transactions WITHOUT entries: ${74 - allJe.unique_transactions}`);
    console.log('');

    // 3b. Check journal entries by account type
    console.log('3️⃣b Journal Entries by Account Type...');
    const [entriesByType] = await connection.query(`
      SELECT 
        coa.type as account_type,
        je.entry_type,
        COUNT(*) as entry_count,
        COUNT(DISTINCT je.transaction_id) as transaction_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31 23:59:59'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type, je.entry_type
      ORDER BY coa.type, je.entry_type
    `);
    
    if (entriesByType.length === 0) {
      console.log('   ⚠️  No journal entries found for any account type!');
    } else {
      entriesByType.forEach(entry => {
        console.log(`   ${entry.account_type} - ${entry.entry_type}:`);
        console.log(`      Entries: ${entry.entry_count}`);
        console.log(`      Transactions: ${entry.transaction_count}`);
        console.log(`      Total: $${parseFloat(entry.total_amount).toFixed(2)}`);
        console.log('');
      });
    }
    console.log('');

    // 3c. Check journal entries for revenue accounts specifically
    console.log('3️⃣c Checking Revenue Journal Entries (Credit)...');
    const [journalEntries] = await connection.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT je.transaction_id) as unique_transactions,
        COALESCE(SUM(je.amount), 0) as total_amount,
        COUNT(DISTINCT je.account_id) as unique_accounts
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31 23:59:59'
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `);
    
    const je = journalEntries[0];
    console.log(`   Total revenue journal entries: ${je.total_entries}`);
    console.log(`   Unique transactions: ${je.unique_transactions}`);
    console.log(`   Total amount: $${parseFloat(je.total_amount).toFixed(2)}`);
    console.log(`   Unique accounts: ${je.unique_accounts}`);
    console.log('');

    // 4. Check journal entries with status breakdown
    console.log('4️⃣  Checking Revenue Entries by Status...');
    const [statusBreakdown] = await connection.query(`
      SELECT 
        COALESCE(t.status, 'NULL') as transaction_status,
        COUNT(*) as entry_count,
        COUNT(DISTINCT je.transaction_id) as transaction_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31 23:59:59'
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY t.status
    `);
    
    if (statusBreakdown.length === 0) {
      console.log('   ⚠️  No revenue entries found with any status!');
    } else {
      statusBreakdown.forEach(sb => {
        console.log(`   Status "${sb.transaction_status}":`);
        console.log(`      - Entries: ${sb.entry_count}`);
        console.log(`      - Transactions: ${sb.transaction_count}`);
        console.log(`      - Total: $${parseFloat(sb.total_amount).toFixed(2)}`);
      });
    }
    console.log('');

    // 5. Check with status filter (matching the controller query)
    console.log('5️⃣  Checking Revenue with Status Filter (Posted or NULL)...');
    const [filteredEntries] = await connection.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT je.transaction_id) as unique_transactions,
        COALESCE(SUM(je.amount), 0) as total_amount,
        COUNT(DISTINCT coa.id) as unique_accounts
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31 23:59:59'
        AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `);
    
    const fe = filteredEntries[0];
    console.log(`   Total entries: ${fe.total_entries}`);
    console.log(`   Unique transactions: ${fe.unique_transactions}`);
    console.log(`   Total amount: $${parseFloat(fe.total_amount).toFixed(2)}`);
    console.log(`   Unique accounts: ${fe.unique_accounts}`);
    console.log('');

    // 6. Final revenue query (exact match to controller)
    console.log('6️⃣  Final Revenue Query (Exact Controller Match)...');
    const [finalRevenue] = await connection.query(`
      SELECT 
        coa.id as account_id,
        coa.name as account_name,
        coa.type as account_type,
        coa.code as account_code,
        bh.id as boarding_house_id,
        bh.name as boarding_house_name,
        COALESCE(SUM(je.amount), 0) as amount,
        COUNT(DISTINCT t.id) as transaction_count
      FROM journal_entries je
      INNER JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL
      INNER JOIN chart_of_accounts coa ON je.account_id = coa.id AND coa.deleted_at IS NULL
      INNER JOIN boarding_houses bh ON je.boarding_house_id = bh.id AND bh.deleted_at IS NULL
      WHERE t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
        AND je.entry_type = 'credit'
        AND UPPER(TRIM(coa.type)) = 'REVENUE'
        AND je.deleted_at IS NULL
      GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name
      ORDER BY coa.code, bh.name
    `, ['2025-10-01', '2025-10-31 23:59:59']);
    
    if (finalRevenue.length === 0) {
      console.log('   ⚠️  WARNING: Final query returned 0 results!');
      console.log('   This matches what the API is returning.');
    } else {
      console.log(`   Found ${finalRevenue.length} revenue account(s):`);
      let total = 0;
      finalRevenue.forEach(rev => {
        const amount = parseFloat(rev.amount);
        total += amount;
        console.log(`      - ${rev.account_code} | ${rev.account_name}`);
        console.log(`        Boarding House: ${rev.boarding_house_name}`);
        console.log(`        Amount: $${amount.toFixed(2)}`);
        console.log(`        Transactions: ${rev.transaction_count}`);
        console.log('');
      });
      console.log(`   📊 TOTAL REVENUE: $${total.toFixed(2)}`);
    }
    console.log('');

    // 7. Sample transactions
    console.log('7️⃣  Sample Revenue Transactions (Last 5)...');
    const [samples] = await connection.query(`
      SELECT 
        t.id as transaction_id,
        t.transaction_type,
        t.transaction_date,
        COALESCE(t.status, 'NULL') as status,
        t.reference,
        t.description,
        coa.code as account_code,
        coa.name as account_name,
        je.entry_type,
        je.amount,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31 23:59:59'
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date DESC
      LIMIT 5
    `);
    
    if (samples.length === 0) {
      console.log('   ⚠️  No sample transactions found!');
    } else {
      samples.forEach((sample, idx) => {
        console.log(`   ${idx + 1}. Transaction #${sample.transaction_id}`);
        console.log(`      Type: ${sample.transaction_type}`);
        console.log(`      Date: ${sample.transaction_date}`);
        console.log(`      Status: ${sample.status}`);
        console.log(`      Account: ${sample.account_code} - ${sample.account_name}`);
        console.log(`      Amount: $${parseFloat(sample.amount).toFixed(2)}`);
        console.log(`      Boarding House: ${sample.boarding_house_name || 'N/A'}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('✅ Diagnostic check completed!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error running diagnostic:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the diagnostic
checkRevenueAccounts().catch(console.error);

