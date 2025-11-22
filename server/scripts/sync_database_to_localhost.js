const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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

async function syncDatabaseToLocalhost() {
  let localhostConn, onlineConn;
  
  try {
    console.log('🔄 Starting Database Sync: Online → Localhost');
    console.log('='.repeat(80));
    console.log('');

    if (!localhostConfig) {
      console.error('❌ Localhost config not set!');
      console.error('   Please set LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_NAME in .env');
      process.exit(1);
    }

    console.log('📊 Connecting to LOCALHOST...');
    localhostConn = await mysql.createConnection(localhostConfig);
    console.log('✅ Connected to localhost\n');
    
    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    console.log('✅ Connected to online server\n');
    
    console.log('='.repeat(80));
    console.log('SYNCING DATABASE - ALL DATA');
    console.log('Syncing ALL transactions and journal entries from localhost to online');
    console.log('='.repeat(80));
    console.log('');

    // 1. Get ALL transactions from localhost
    console.log('1️⃣  Fetching ALL transactions from LOCALHOST...');
    const [localhostTransactions] = await localhostConn.query(`
      SELECT 
        id,
        transaction_type,
        transaction_date,
        reference,
        description,
        amount,
        currency,
        status,
        boarding_house_id,
        created_by,
        created_at
      FROM transactions
      WHERE deleted_at IS NULL
      ORDER BY transaction_date, id
    `);
    
    console.log(`   Found ${localhostTransactions.length} transactions on localhost`);
    console.log('');

    // 2. Get ALL journal entries from localhost
    console.log('2️⃣  Fetching ALL journal entries from LOCALHOST...');
    const [localhostJournalEntries] = await localhostConn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.account_id,
        je.entry_type,
        je.amount,
        je.description,
        je.boarding_house_id,
        je.created_by,
        je.created_at,
        je.updated_at
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY je.transaction_id, je.id
    `);
    
    console.log(`   Found ${localhostJournalEntries.length} journal entries on localhost`);
    console.log('');

    // 3. Get ALL existing transactions on online (to delete)
    console.log('3️⃣  Checking ALL existing transactions on ONLINE SERVER...');
    const [onlineTransactions] = await onlineConn.query(`
      SELECT id
      FROM transactions
      WHERE deleted_at IS NULL
    `);
    
    console.log(`   Found ${onlineTransactions.length} existing transactions on online server`);
    console.log('');

    // 4. Get ALL existing journal entries on online (to delete)
    console.log('4️⃣  Checking ALL existing journal entries on ONLINE SERVER...');
    const [onlineJournalEntries] = await onlineConn.query(`
      SELECT je.id
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `);
    
    console.log(`   Found ${onlineJournalEntries.length} existing journal entries on online server`);
    console.log('');

    // 4b. Get valid boarding house IDs from online server
    console.log('4️⃣b Checking valid boarding houses on ONLINE SERVER...');
    const [onlineBoardingHouses] = await onlineConn.query(`
      SELECT id
      FROM boarding_houses
      WHERE deleted_at IS NULL
    `);
    const validBoardingHouseIds = new Set(onlineBoardingHouses.map(bh => bh.id));
    const firstValidBoardingHouseId = onlineBoardingHouses.length > 0 ? onlineBoardingHouses[0].id : null;
    console.log(`   Found ${validBoardingHouseIds.size} valid boarding houses on online server`);
    if (firstValidBoardingHouseId) {
      console.log(`   Default boarding house ID: ${firstValidBoardingHouseId}`);
    }
    console.log('');

    // 5. Generate SQL sync file
    console.log('5️⃣  Generating SQL sync file...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `sync_database_${timestamp}.sql`;
    const filepath = path.join(__dirname, filename);

    let sqlContent = `-- Database Sync Script: Online → Localhost (ALL DATA)\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Syncing ALL transactions and journal entries (no date filter)\n`;
    sqlContent += `-- Transactions: ${localhostTransactions.length}\n`;
    sqlContent += `-- Journal Entries: ${localhostJournalEntries.length}\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sqlContent += `SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n`;

    // Delete ALL existing journal entries first (due to foreign keys)
    sqlContent += `-- Delete ALL existing journal entries\n`;
    sqlContent += `DELETE FROM journal_entries;\n\n`;

    // Delete ALL existing transactions
    sqlContent += `-- Delete ALL existing transactions\n`;
    sqlContent += `DELETE FROM transactions;\n\n`;

    // Insert transactions from localhost
    sqlContent += `-- Insert transactions from localhost\n`;
    localhostTransactions.forEach(tx => {
      sqlContent += `INSERT INTO transactions (\n`;
      sqlContent += `  id,\n`;
      sqlContent += `  transaction_type,\n`;
      sqlContent += `  transaction_date,\n`;
      sqlContent += `  reference,\n`;
      sqlContent += `  description,\n`;
      sqlContent += `  amount,\n`;
      sqlContent += `  currency,\n`;
      sqlContent += `  status,\n`;
      sqlContent += `  boarding_house_id,\n`;
      sqlContent += `  created_by,\n`;
      sqlContent += `  created_at\n`;
      sqlContent += `) VALUES (\n`;
      sqlContent += `  ${tx.id},\n`;
      sqlContent += `  '${tx.transaction_type.replace(/'/g, "''")}',\n`;
      sqlContent += `  '${tx.transaction_date.toISOString().slice(0, 10)}',\n`;
      sqlContent += `  ${tx.reference ? `'${tx.reference.replace(/'/g, "''")}'` : 'NULL'},\n`;
      sqlContent += `  ${tx.description ? `'${tx.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
      sqlContent += `  ${tx.amount || 'NULL'},\n`;
      sqlContent += `  '${tx.currency || 'USD'}',\n`;
      sqlContent += `  '${tx.status || 'posted'}',\n`;
      sqlContent += `  ${tx.boarding_house_id || 'NULL'},\n`;
      sqlContent += `  ${tx.created_by || 1},\n`;
      sqlContent += `  '${tx.created_at.toISOString().slice(0, 19).replace('T', ' ')}'\n`;
      sqlContent += `);\n\n`;
    });

    // Insert journal entries from localhost
    sqlContent += `-- Insert journal entries from localhost\n`;
    let invalidBoardingHouseCount = 0;
    localhostJournalEntries.forEach(entry => {
      // Validate boarding_house_id - use first valid one if it doesn't exist on online server
      let boardingHouseId = entry.boarding_house_id;
      if (boardingHouseId && !validBoardingHouseIds.has(boardingHouseId)) {
        boardingHouseId = firstValidBoardingHouseId;
        invalidBoardingHouseCount++;
      } else if (!boardingHouseId) {
        // If NULL, use first valid boarding house
        boardingHouseId = firstValidBoardingHouseId;
      }

      sqlContent += `INSERT INTO journal_entries (\n`;
      sqlContent += `  id,\n`;
      sqlContent += `  transaction_id,\n`;
      sqlContent += `  account_id,\n`;
      sqlContent += `  entry_type,\n`;
      sqlContent += `  amount,\n`;
      sqlContent += `  description,\n`;
      sqlContent += `  boarding_house_id,\n`;
      sqlContent += `  created_by,\n`;
      sqlContent += `  created_at,\n`;
      sqlContent += `  updated_at\n`;
      sqlContent += `) VALUES (\n`;
      sqlContent += `  ${entry.id},\n`;
      sqlContent += `  ${entry.transaction_id},\n`;
      sqlContent += `  ${entry.account_id},\n`;
      sqlContent += `  '${entry.entry_type}',\n`;
      sqlContent += `  ${entry.amount},\n`;
      sqlContent += `  ${entry.description ? `'${entry.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
      sqlContent += `  ${boardingHouseId || firstValidBoardingHouseId || 1},\n`;
      sqlContent += `  ${entry.created_by || 1},\n`;
      sqlContent += `  '${entry.created_at.toISOString().slice(0, 19).replace('T', ' ')}',\n`;
      sqlContent += `  '${entry.updated_at ? entry.updated_at.toISOString().slice(0, 19).replace('T', ' ') : entry.created_at.toISOString().slice(0, 19).replace('T', ' ')}'\n`;
      sqlContent += `);\n\n`;
    });

    if (invalidBoardingHouseCount > 0) {
      sqlContent += `-- Note: ${invalidBoardingHouseCount} journal entries had invalid boarding_house_id set to NULL\n`;
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    sqlContent += `-- Sync completed\n`;
    sqlContent += `-- Transactions synced: ${localhostTransactions.length}\n`;
    sqlContent += `-- Journal entries synced: ${localhostJournalEntries.length}\n`;

    // Write to file
    fs.writeFileSync(filepath, sqlContent, 'utf8');
    console.log(`   ✅ SQL sync file created: ${filename}`);
    console.log(`   📁 Full path: ${filepath}`);
    console.log('');

    // 6. Summary
    console.log('6️⃣  Summary...');
    console.log(`   Transactions to sync: ${localhostTransactions.length}`);
    console.log(`   Journal entries to sync: ${localhostJournalEntries.length}`);
    console.log(`   Transactions to delete on online: ${onlineTransactions.length}`);
    console.log(`   Journal entries to delete on online: ${onlineJournalEntries.length}`);
    console.log('');

    // 7. Breakdown by account type
    console.log('7️⃣  Journal Entries Breakdown (from localhost)...');
    const [entriesByType] = await localhostConn.query(`
      SELECT 
        coa.type as account_type,
        je.entry_type,
        COUNT(*) as entry_count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type, je.entry_type
      ORDER BY coa.type, je.entry_type
    `);
    
    entriesByType.forEach(entry => {
      console.log(`   ${entry.account_type} - ${entry.entry_type}: ${entry.entry_count} entries, $${parseFloat(entry.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 8. Revenue entries specifically
    const revenueEntries = localhostJournalEntries.filter(entry => {
      // We'll check this by querying
      return true; // Will filter in the query
    });
    
    const [revenueData] = await localhostConn.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(je.amount), 0) as total
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
    `);
    
    console.log('8️⃣  Revenue Entries (from localhost)...');
    console.log(`   Revenue credit entries: ${revenueData[0].count}`);
    console.log(`   Total revenue amount: $${parseFloat(revenueData[0].total).toFixed(2)}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Sync file generated successfully!');
    console.log('='.repeat(80));
    console.log('');
    console.log('📋 Next Steps:');
    console.log(`   1. Review the SQL file: ${filename}`);
    console.log('   2. IMPORTANT: Backup your online database first!');
    console.log('   3. Import the SQL file to your online server using MySQL Workbench');
    console.log('   4. The script will:');
    console.log('      - Delete existing transactions and journal entries in date range');
    console.log('      - Insert all transactions and journal entries from localhost');
    console.log('   5. After import, verify the data matches localhost');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (localhostConn) await localhostConn.end();
    if (onlineConn) await onlineConn.end();
    console.log('🔌 Database connections closed.');
  }
}

// Run the sync
syncDatabaseToLocalhost().catch(console.error);

