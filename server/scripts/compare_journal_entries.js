const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configurations
// For localhost, use separate env vars if available, otherwise skip localhost comparison
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

async function compareJournalEntries() {
  let localhostConn, onlineConn;
  
  try {
    console.log('🔍 Connecting to databases...\n');
    
    // Connect to localhost (if configured)
    let useLocalhost = false;
    if (localhostConfig) {
      try {
        console.log('📊 Connecting to LOCALHOST...');
        localhostConn = await mysql.createConnection(localhostConfig);
        console.log('✅ Connected to localhost\n');
        useLocalhost = true;
      } catch (error) {
        console.log('⚠️  Could not connect to localhost, will only check online server\n');
        console.log('   (Set LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_NAME in .env to enable)\n');
      }
    } else {
      console.log('⚠️  Localhost config not set, will only check online server\n');
      console.log('   (Set LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_NAME in .env to enable)\n');
    }
    
    // Connect to online
    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    console.log('✅ Connected to online server\n');
    
    console.log('='.repeat(80));
    console.log('JOURNAL ENTRIES COMPARISON');
    console.log('Date Range: 2025-10-01 to 2025-10-31');
    console.log('='.repeat(80));
    console.log('');

    const startDate = '2025-10-01';
    const endDate = '2025-10-31 23:59:59';

    // 1. Total journal entries comparison
    console.log('1️⃣  Total Journal Entries...');
    const [onlineTotal] = await onlineConn.query(`
      SELECT COUNT(*) as total
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Online: ${onlineTotal[0].total} entries`);
    
    if (useLocalhost) {
      const [localhostTotal] = await localhostConn.query(`
        SELECT COUNT(*) as total
        FROM journal_entries je
        JOIN transactions t ON je.transaction_id = t.id
        WHERE t.transaction_date >= ? 
          AND t.transaction_date <= ?
          AND je.deleted_at IS NULL
          AND t.deleted_at IS NULL
      `, [startDate, endDate]);
      
      console.log(`   Localhost: ${localhostTotal[0].total} entries`);
      console.log(`   Difference: ${localhostTotal[0].total - onlineTotal[0].total} entries missing`);
      console.log(`   Expected: 392 entries (you mentioned)`);
      console.log(`   Missing: ${392 - onlineTotal[0].total} entries`);
    } else {
      console.log(`   Expected: 392 entries (you mentioned)`);
      console.log(`   Missing: ${392 - onlineTotal[0].total} entries`);
    }
    console.log('');

    // 2. Journal entries by account type
    if (useLocalhost) {
      console.log('2️⃣  Journal Entries by Account Type (Localhost)...');
      const [localhostByType] = await localhostConn.query(`
      SELECT 
        coa.type as account_type,
        je.entry_type,
        COUNT(*) as entry_count,
        COUNT(DISTINCT je.transaction_id) as transaction_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type, je.entry_type
      ORDER BY coa.type, je.entry_type
    `, [startDate, endDate]);
    
    console.log('   Localhost breakdown:');
    localhostByType.forEach(entry => {
        console.log(`      ${entry.account_type} - ${entry.entry_type}: ${entry.entry_count} entries, $${parseFloat(entry.total_amount).toFixed(2)}`);
      });
      console.log('');
    }
    
    console.log(`${useLocalhost ? '2️⃣b' : '2️⃣'} Journal Entries by Account Type (Online)...`);
    const [onlineByType] = await onlineConn.query(`
      SELECT 
        coa.type as account_type,
        je.entry_type,
        COUNT(*) as entry_count,
        COUNT(DISTINCT je.transaction_id) as transaction_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type, je.entry_type
      ORDER BY coa.type, je.entry_type
    `, [startDate, endDate]);
    
    console.log('   Online breakdown:');
    onlineByType.forEach(entry => {
      console.log(`      ${entry.account_type} - ${entry.entry_type}: ${entry.entry_count} entries, $${parseFloat(entry.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 3. Revenue entries specifically
    console.log('3️⃣  Revenue Journal Entries...');
    const [onlineRevenue] = await onlineConn.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT je.transaction_id) as unique_transactions,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Online Revenue entries: ${onlineRevenue[0].total_entries}`);
    console.log(`   Online Revenue amount: $${parseFloat(onlineRevenue[0].total_amount).toFixed(2)}`);
    
    if (useLocalhost) {
      const [localhostRevenue] = await localhostConn.query(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT je.transaction_id) as unique_transactions,
          COALESCE(SUM(je.amount), 0) as total_amount
        FROM journal_entries je
        JOIN transactions t ON je.transaction_id = t.id
        JOIN chart_of_accounts coa ON je.account_id = coa.id
        WHERE t.transaction_date >= ? 
          AND t.transaction_date <= ?
          AND je.entry_type = 'credit'
          AND coa.type = 'Revenue'
          AND je.deleted_at IS NULL
          AND t.deleted_at IS NULL
          AND coa.deleted_at IS NULL
      `, [startDate, endDate]);
      
      console.log(`   Localhost Revenue entries: ${localhostRevenue[0].total_entries}`);
      console.log(`   Localhost Revenue amount: $${parseFloat(localhostRevenue[0].total_amount).toFixed(2)}`);
      console.log(`   Missing Revenue entries: ${localhostRevenue[0].total_entries - onlineRevenue[0].total_entries}`);
    }
    console.log('');

    // 4. Check transaction IDs that have journal entries on localhost but not online
    if (useLocalhost) {
      console.log('4️⃣  Finding Transactions with Missing Journal Entries on Online...');
      const [missingEntries] = await localhostConn.query(`
      SELECT 
        t.id as transaction_id,
        t.transaction_type,
        t.transaction_date,
        t.reference,
        COUNT(je.id) as localhost_entry_count
      FROM transactions t
      LEFT JOIN journal_entries je ON je.transaction_id = t.id AND je.deleted_at IS NULL
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND t.deleted_at IS NULL
      GROUP BY t.id, t.transaction_type, t.transaction_date, t.reference
      HAVING localhost_entry_count > 0
      ORDER BY t.transaction_date, t.id
    `, [startDate, endDate]);
    
    console.log(`   Found ${missingEntries.length} transactions with entries on localhost`);
    console.log('   Checking which ones are missing on online...\n');
    
    let missingCount = 0;
    for (const tx of missingEntries) {
      const [onlineEntries] = await onlineConn.query(`
        SELECT COUNT(*) as count
        FROM journal_entries
        WHERE transaction_id = ?
          AND deleted_at IS NULL
      `, [tx.transaction_id]);
      
      if (onlineEntries[0].count === 0) {
        missingCount++;
        if (missingCount <= 10) {
          console.log(`   ⚠️  Transaction #${tx.transaction_id} (${tx.transaction_type}) - ${tx.localhost_entry_count} entries on localhost, 0 on online`);
        }
      }
    }
    
    if (missingCount > 10) {
      console.log(`   ... and ${missingCount - 10} more transactions with missing entries`);
    }
      console.log(`   Total transactions with missing entries: ${missingCount}`);
      console.log('');
    }

    // 5. Check if transaction IDs match between servers
    console.log(`${useLocalhost ? '5️⃣' : '4️⃣'} Checking Transaction ID Ranges...`);
    const [onlineTxRange] = await onlineConn.query(`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        COUNT(*) as total
      FROM transactions
      WHERE transaction_date >= ? 
        AND transaction_date <= ?
        AND deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Online: IDs ${onlineTxRange[0].min_id} to ${onlineTxRange[0].max_id} (${onlineTxRange[0].total} transactions)`);
    
    if (useLocalhost) {
      const [localhostTxRange] = await localhostConn.query(`
        SELECT 
          MIN(id) as min_id,
          MAX(id) as max_id,
          COUNT(*) as total
        FROM transactions
        WHERE transaction_date >= ? 
          AND transaction_date <= ?
          AND deleted_at IS NULL
      `, [startDate, endDate]);
      
      console.log(`   Localhost: IDs ${localhostTxRange[0].min_id} to ${localhostTxRange[0].max_id} (${localhostTxRange[0].total} transactions)`);
    }
    console.log('');

    // 6. Sample revenue entries from localhost
    if (useLocalhost) {
      console.log('6️⃣  Sample Revenue Entries from Localhost (First 5)...');
      const [localhostSamples] = await localhostConn.query(`
      SELECT 
        je.id as entry_id,
        je.transaction_id,
        je.account_id,
        coa.code as account_code,
        coa.name as account_name,
        je.entry_type,
        je.amount,
        t.transaction_type,
        t.transaction_date
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, je.id
      LIMIT 5
    `, [startDate, endDate]);
    
    if (localhostSamples.length > 0) {
      console.log('   Sample entries that should exist on online:');
      localhostSamples.forEach((sample, idx) => {
        console.log(`   ${idx + 1}. Entry ID: ${sample.entry_id}, Transaction: ${sample.transaction_id}`);
        console.log(`      Account: ${sample.account_code} - ${sample.account_name}`);
        console.log(`      Amount: $${parseFloat(sample.amount).toFixed(2)}`);
        console.log(`      Date: ${sample.transaction_date}`);
        console.log('');
      });
      } else {
        console.log('   ⚠️  No revenue entries found on localhost either!');
      }
    }

    // 7. Summary and recommendations
    console.log(`${useLocalhost ? '7️⃣' : '5️⃣'} Summary and Recommendations...`);
    console.log(`   Current online entries: ${onlineTotal[0].total}`);
    console.log(`   Expected entries: 392`);
    console.log(`   Missing entries: ${392 - onlineTotal[0].total}`);
    console.log('');
    console.log('   💡 Possible causes:');
    console.log('      1. Journal entries were not exported from localhost');
    console.log('      2. Journal entries failed to import (foreign key constraints)');
    console.log('      3. Transaction IDs changed during import');
    console.log('      4. Journal entries were soft-deleted during import');
    console.log('      5. Export query filtered out some entries');
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Comparison completed!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (localhostConn) await localhostConn.end();
    if (onlineConn) await onlineConn.end();
    console.log('\n🔌 Database connections closed.');
  }
}

// Run the comparison
compareJournalEntries().catch(console.error);

