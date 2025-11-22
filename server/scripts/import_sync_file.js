require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importSyncFile() {
  let onlineConn = null;

  try {
    // Online database configuration
    const onlineConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true, // Allow multiple SQL statements
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    if (!onlineConfig.host || !onlineConfig.user || !onlineConfig.database) {
      throw new Error('Missing required environment variables: DB_HOST, DB_USER, DB_NAME');
    }

    console.log('='.repeat(80));
    console.log('IMPORTING SYNC FILE TO ONLINE DATABASE');
    console.log('='.repeat(80));
    console.log('');

    // Find the most recent sync file
    const scriptsDir = __dirname;
    const files = fs.readdirSync(scriptsDir)
      .filter(file => file.startsWith('sync_database_') && file.endsWith('.sql'))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error('No sync_database_*.sql file found in scripts directory');
    }

    const syncFile = files[0];
    const filepath = path.join(scriptsDir, syncFile);

    console.log(`📄 Found sync file: ${syncFile}`);
    console.log(`📁 Full path: ${filepath}`);
    console.log('');

    // Read the SQL file
    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync(filepath, 'utf8');
    const fileSize = (sqlContent.length / 1024).toFixed(2);
    console.log(`   File size: ${fileSize} KB`);
    console.log('');

    // Connect to online database
    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    console.log('✅ Connected to online server');
    console.log('');

    // Execute the SQL
    console.log('⚙️  Executing SQL statements...');
    console.log('   This may take a few moments...');
    console.log('');

    const startTime = Date.now();
    
    try {
      // Execute entire SQL file at once (multipleStatements is enabled)
      await onlineConn.query(sqlContent);
      console.log('   ✅ All SQL statements executed successfully');
    } catch (error) {
      console.error(`   ❌ Error executing SQL: ${error.message}`);
      throw error;
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('='.repeat(80));
    console.log('✅ IMPORT COMPLETED');
    console.log('='.repeat(80));
    console.log(`   Duration: ${duration} seconds`);
    console.log('');

    // Verify the import
    console.log('🔍 Verifying import...');
    const [transactionCount] = await onlineConn.query(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE deleted_at IS NULL
    `);

    const [journalEntryCount] = await onlineConn.query(`
      SELECT COUNT(*) as count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `);

    console.log(`   Transactions in database: ${transactionCount[0].count}`);
    console.log(`   Journal entries in database: ${journalEntryCount[0].count}`);
    console.log('');

    // Check revenue entries
    const [revenueData] = await onlineConn.query(`
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

    console.log(`   Revenue entries: ${revenueData[0].count}`);
    console.log(`   Total revenue: $${parseFloat(revenueData[0].total).toFixed(2)}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Import verification complete!');
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
    if (onlineConn) {
      await onlineConn.end();
      console.log('');
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the import
importSyncFile()
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

