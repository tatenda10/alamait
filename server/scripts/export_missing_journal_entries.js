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

async function exportMissingJournalEntries() {
  let localhostConn, onlineConn;
  
  try {
    console.log('🔍 Connecting to databases...\n');
    
    // Connect to localhost
    if (!localhostConfig) {
      console.error('❌ Localhost config not set!');
      console.error('');
      console.error('   To export missing journal entries, you need to set these in your .env file:');
      console.error('   LOCAL_DB_HOST=localhost');
      console.error('   LOCAL_DB_USER=root (or your localhost MySQL user)');
      console.error('   LOCAL_DB_PASSWORD=your_password');
      console.error('   LOCAL_DB_NAME=alamait');
      console.error('');
      console.error('   Alternatively, you can manually export from localhost using:');
      console.error('   mysqldump -u root -p alamait journal_entries --where="transaction_id IN (SELECT id FROM transactions WHERE transaction_date >= \'2025-10-01\' AND transaction_date <= \'2025-10-31 23:59:59\')" > journal_entries_export.sql');
      console.error('');
      process.exit(1);
    }
    
    console.log('📊 Connecting to LOCALHOST...');
    try {
      localhostConn = await mysql.createConnection(localhostConfig);
      console.log('✅ Connected to localhost\n');
    } catch (error) {
      console.error('❌ Failed to connect to localhost:', error.message);
      console.error('   Please check your LOCAL_DB_* environment variables');
      process.exit(1);
    }
    
    // Connect to online
    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    console.log('✅ Connected to online server\n');
    
    console.log('='.repeat(80));
    console.log('EXPORTING MISSING JOURNAL ENTRIES');
    console.log('Date Range: 2025-10-01 to 2025-10-31');
    console.log('='.repeat(80));
    console.log('');

    const startDate = '2025-10-01';
    const endDate = '2025-10-31 23:59:59';

    // 1. Get all journal entries from localhost in date range
    console.log('1️⃣  Fetching journal entries from LOCALHOST...');
    const [localhostEntries] = await localhostConn.query(`
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
        je.updated_at,
        t.transaction_date,
        t.reference as transaction_reference
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY je.transaction_id, je.id
    `, [startDate, endDate]);
    
    console.log(`   Found ${localhostEntries.length} journal entries on localhost`);
    console.log('');

    // 2. Get all journal entries from online in date range
    console.log('2️⃣  Fetching journal entries from ONLINE SERVER...');
    const [onlineEntries] = await onlineConn.query(`
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
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);
    
    console.log(`   Found ${onlineEntries.length} journal entries on online server`);
    console.log('');

    // 3. Create a set of existing entries on online (by transaction_id, account_id, entry_type, amount)
    console.log('3️⃣  Identifying missing entries...');
    const onlineEntryKeys = new Set();
    onlineEntries.forEach(entry => {
      // Use a combination of fields to identify unique entries
      const key = `${entry.transaction_id}_${entry.account_id}_${entry.entry_type}_${entry.amount}`;
      onlineEntryKeys.add(key);
    });

    // 4. Find missing entries
    const missingEntries = [];
    localhostEntries.forEach(entry => {
      const key = `${entry.transaction_id}_${entry.account_id}_${entry.entry_type}_${entry.amount}`;
      if (!onlineEntryKeys.has(key)) {
        missingEntries.push(entry);
      }
    });

    console.log(`   Found ${missingEntries.length} missing journal entries`);
    console.log('');

    // 5. Check if transactions exist on online server
    console.log('4️⃣  Checking if corresponding transactions exist on online server...');
    const transactionIds = [...new Set(missingEntries.map(e => e.transaction_id))];
    const [onlineTransactions] = await onlineConn.query(`
      SELECT id, reference, transaction_type, transaction_date
      FROM transactions
      WHERE id IN (?)
        AND deleted_at IS NULL
    `, [transactionIds]);
    
    const onlineTransactionIds = new Set(onlineTransactions.map(t => t.id));
    const missingTransactionIds = transactionIds.filter(id => !onlineTransactionIds.has(id));
    
    console.log(`   Transactions found on online: ${onlineTransactions.length}/${transactionIds.length}`);
    if (missingTransactionIds.length > 0) {
      console.log(`   ⚠️  WARNING: ${missingTransactionIds.length} transactions are missing on online server:`);
      missingTransactionIds.slice(0, 10).forEach(id => {
        const entry = missingEntries.find(e => e.transaction_id === id);
        console.log(`      - Transaction ID: ${id} (from entry: ${entry?.transaction_reference || 'N/A'})`);
      });
      if (missingTransactionIds.length > 10) {
        console.log(`      ... and ${missingTransactionIds.length - 10} more`);
      }
    }
    console.log('');

    // 6. Filter entries to only include those with existing transactions
    const exportableEntries = missingEntries.filter(entry => 
      onlineTransactionIds.has(entry.transaction_id)
    );
    
    const skippedEntries = missingEntries.filter(entry => 
      !onlineTransactionIds.has(entry.transaction_id)
    );

    console.log(`5️⃣  Preparing export...`);
    console.log(`   Exportable entries (transaction exists): ${exportableEntries.length}`);
    console.log(`   Skipped entries (transaction missing): ${skippedEntries.length}`);
    console.log('');
    
    if (exportableEntries.length === 0 && skippedEntries.length > 0) {
      console.log('   ⚠️  CRITICAL: All missing journal entries reference transactions that don\'t exist on online server!');
      console.log('   📋 You need to export and import the missing transactions FIRST, then the journal entries.');
      console.log('');
      
      // Get transaction details from localhost
      console.log('   Fetching missing transaction details from localhost...');
      const [missingTransactions] = await localhostConn.query(`
        SELECT DISTINCT
          t.id,
          t.transaction_type,
          t.transaction_date,
          t.reference,
          t.description,
          t.amount,
          t.currency,
          t.status,
          t.boarding_house_id,
          t.created_by,
          t.created_at
        FROM transactions t
        WHERE t.id IN (?)
          AND t.deleted_at IS NULL
        ORDER BY t.transaction_date, t.id
      `, [missingTransactionIds]);
      
      console.log(`   Found ${missingTransactions.length} missing transactions`);
      console.log('');
      
      // Export missing transactions to SQL
      const txTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const txFilename = `missing_transactions_${txTimestamp}.sql`;
      const txFilepath = path.join(__dirname, txFilename);
      
      let txSqlContent = `-- Missing Transactions Export\n`;
      txSqlContent += `-- Generated: ${new Date().toISOString()}\n`;
      txSqlContent += `-- Total transactions: ${missingTransactions.length}\n`;
      txSqlContent += `-- Date range: ${startDate} to ${endDate}\n\n`;
      txSqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
      
      missingTransactions.forEach(tx => {
        txSqlContent += `-- Transaction: ${tx.reference || tx.id} (${tx.transaction_type})\n`;
        txSqlContent += `INSERT INTO transactions (\n`;
        txSqlContent += `  transaction_type,\n`;
        txSqlContent += `  transaction_date,\n`;
        txSqlContent += `  reference,\n`;
        txSqlContent += `  description,\n`;
        txSqlContent += `  amount,\n`;
        txSqlContent += `  currency,\n`;
        txSqlContent += `  status,\n`;
        txSqlContent += `  boarding_house_id,\n`;
        txSqlContent += `  created_by,\n`;
        txSqlContent += `  created_at\n`;
        txSqlContent += `) VALUES (\n`;
        txSqlContent += `  '${tx.transaction_type}',\n`;
        txSqlContent += `  '${tx.transaction_date.toISOString().slice(0, 19).replace('T', ' ')}',\n`;
        txSqlContent += `  ${tx.reference ? `'${tx.reference.replace(/'/g, "''")}'` : 'NULL'},\n`;
        txSqlContent += `  ${tx.description ? `'${tx.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
        txSqlContent += `  ${tx.amount || 'NULL'},\n`;
        txSqlContent += `  '${tx.currency || 'USD'}',\n`;
        txSqlContent += `  '${tx.status || 'posted'}',\n`;
        txSqlContent += `  ${tx.boarding_house_id || 'NULL'},\n`;
        txSqlContent += `  ${tx.created_by || 1},\n`;
        txSqlContent += `  '${tx.created_at.toISOString().slice(0, 19).replace('T', ' ')}'\n`;
        txSqlContent += `);\n\n`;
      });
      
      txSqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
      txSqlContent += `-- Export completed: ${missingTransactions.length} transactions\n`;
      
      fs.writeFileSync(txFilepath, txSqlContent, 'utf8');
      console.log(`   ✅ Missing transactions SQL file created: ${txFilename}`);
      console.log(`   📁 Full path: ${txFilepath}`);
      console.log('');
      console.log('   ⚠️  IMPORTANT: Import the transactions file FIRST, then run this script again to export journal entries.');
      console.log('');
    }

    // 7. Check if accounts exist on online server
    console.log('6️⃣  Checking if accounts exist on online server...');
    const accountIds = [...new Set(exportableEntries.map(e => e.account_id))];
    
    let onlineAccounts = [];
    if (accountIds.length > 0) {
      const [accounts] = await onlineConn.query(`
        SELECT id, code, name, type
        FROM chart_of_accounts
        WHERE id IN (?)
          AND deleted_at IS NULL
      `, [accountIds]);
      onlineAccounts = accounts;
    } else {
      console.log('   No exportable entries, skipping account check');
    }
    
    const onlineAccountIds = new Set(onlineAccounts.map(a => a.id));
    const missingAccountIds = accountIds.filter(id => !onlineAccountIds.has(id));
    
    console.log(`   Accounts found on online: ${onlineAccounts.length}/${accountIds.length}`);
    if (missingAccountIds.length > 0) {
      console.log(`   ⚠️  WARNING: ${missingAccountIds.length} accounts are missing on online server:`);
      missingAccountIds.forEach(id => {
        console.log(`      - Account ID: ${id}`);
      });
    }
    console.log('');

    // 8. Filter entries to only include those with existing accounts
    const finalExportableEntries = exportableEntries.filter(entry => 
      onlineAccountIds.has(entry.account_id)
    );
    
    const skippedAccountEntries = exportableEntries.filter(entry => 
      !onlineAccountIds.has(entry.account_id)
    );

    console.log(`7️⃣  Final export list...`);
    console.log(`   Final exportable entries: ${finalExportableEntries.length}`);
    if (skippedAccountEntries.length > 0) {
      console.log(`   Skipped (account missing): ${skippedAccountEntries.length}`);
    }
    console.log('');

    // 9. Generate SQL INSERT statements
    console.log('8️⃣  Generating SQL export file...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `missing_journal_entries_${timestamp}.sql`;
    const filepath = path.join(__dirname, filename);

    let sqlContent = `-- Missing Journal Entries Export\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Total entries: ${finalExportableEntries.length}\n`;
    sqlContent += `-- Date range: ${startDate} to ${endDate}\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // Group by transaction for better organization
    const entriesByTransaction = {};
    finalExportableEntries.forEach(entry => {
      if (!entriesByTransaction[entry.transaction_id]) {
        entriesByTransaction[entry.transaction_id] = [];
      }
      entriesByTransaction[entry.transaction_id].push(entry);
    });

    let entryCount = 0;
    Object.keys(entriesByTransaction).sort().forEach(transactionId => {
      const entries = entriesByTransaction[transactionId];
      sqlContent += `-- Transaction ID: ${transactionId} (${entries.length} entries)\n`;
      
      entries.forEach(entry => {
        // Get the account info for reference
        const account = onlineAccounts.find(a => a.id === entry.account_id);
        const accountInfo = account ? `${account.code} - ${account.name} (${account.type})` : `ID: ${entry.account_id}`;
        
        sqlContent += `-- Entry: ${entry.entry_type.toUpperCase()} ${accountInfo}, Amount: $${parseFloat(entry.amount).toFixed(2)}\n`;
        sqlContent += `INSERT INTO journal_entries (\n`;
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
        sqlContent += `  ${entry.transaction_id},\n`;
        sqlContent += `  ${entry.account_id},\n`;
        sqlContent += `  '${entry.entry_type}',\n`;
        sqlContent += `  ${entry.amount},\n`;
        sqlContent += `  ${entry.description ? `'${entry.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sqlContent += `  ${entry.boarding_house_id || 'NULL'},\n`;
        sqlContent += `  ${entry.created_by || 1},\n`;
        sqlContent += `  '${entry.created_at.toISOString().slice(0, 19).replace('T', ' ')}',\n`;
        sqlContent += `  '${entry.updated_at ? entry.updated_at.toISOString().slice(0, 19).replace('T', ' ') : entry.created_at.toISOString().slice(0, 19).replace('T', ' ')}'\n`;
        sqlContent += `);\n\n`;
        entryCount++;
      });
    });

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    sqlContent += `-- Export completed: ${entryCount} entries\n`;

    // Write to file
    fs.writeFileSync(filepath, sqlContent, 'utf8');
    console.log(`   ✅ SQL file created: ${filename}`);
    console.log(`   📁 Full path: ${filepath}`);
    console.log('');

    // 10. Summary by account type
    console.log('9️⃣  Summary by Account Type...');
    const summaryByType = {};
    finalExportableEntries.forEach(entry => {
      const account = onlineAccounts.find(a => a.id === entry.account_id);
      const type = account ? account.type : 'Unknown';
      if (!summaryByType[type]) {
        summaryByType[type] = { count: 0, total: 0, entries: [] };
      }
      summaryByType[type].count++;
      summaryByType[type].total += parseFloat(entry.amount);
      summaryByType[type].entries.push(entry.entry_type);
    });

    Object.keys(summaryByType).sort().forEach(type => {
      const summary = summaryByType[type];
      const debitCount = summary.entries.filter(e => e === 'debit').length;
      const creditCount = summary.entries.filter(e => e === 'credit').length;
      console.log(`   ${type}:`);
      console.log(`      Total entries: ${summary.count} (${debitCount} debit, ${creditCount} credit)`);
      console.log(`      Total amount: $${summary.total.toFixed(2)}`);
    });
    console.log('');

    // 11. Revenue entries specifically
    const revenueEntries = finalExportableEntries.filter(entry => {
      const account = onlineAccounts.find(a => a.id === entry.account_id);
      return account && account.type === 'Revenue' && entry.entry_type === 'credit';
    });

    if (revenueEntries.length > 0) {
      console.log('🔟 Revenue Entries to Export...');
      console.log(`   Revenue credit entries: ${revenueEntries.length}`);
      const revenueTotal = revenueEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      console.log(`   Total revenue amount: $${revenueTotal.toFixed(2)}`);
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ Export completed successfully!');
    console.log('='.repeat(80));
    console.log('');
    console.log('📋 Next Steps:');
    console.log(`   1. Review the SQL file: ${filename}`);
    console.log('   2. Import it to your online server using MySQL Workbench or command line');
    console.log('   3. Run: mysql -h [host] -u [user] -p [database] < ' + filename);
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

// Run the export
exportMissingJournalEntries().catch(console.error);

