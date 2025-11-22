require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Database configurations
// Use dateStrings: true to return DATE/DATETIME/TIMESTAMP as strings (YYYY-MM-DD format)
// This prevents timezone conversion issues when syncing dates
const localhostConfig = process.env.LOCAL_DB_HOST ? {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '',
  database: process.env.LOCAL_DB_NAME || 'alamait',
  dateStrings: true // Return dates as strings to prevent timezone conversion
} : null;

const onlineConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  multipleStatements: true,
  dateStrings: true // Return dates as strings to prevent timezone conversion
};

async function syncFullDatabase() {
  let localhostConn, onlineConn;

  try {
    console.log('='.repeat(80));
    console.log('FULL DATABASE SYNC: Localhost → Online');
    console.log('='.repeat(80));
    console.log('');

    if (!localhostConfig) {
      throw new Error('Localhost config not set! Please set LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_NAME in .env');
    }

    // Connect to databases
    console.log('📊 Connecting to LOCALHOST...');
    localhostConn = await mysql.createConnection(localhostConfig);
    // Set timezone to UTC to prevent date conversion issues
    await localhostConn.query("SET time_zone = '+00:00'");
    console.log('✅ Connected to localhost\n');

    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    // Set timezone to UTC to prevent date conversion issues
    await onlineConn.query("SET time_zone = '+00:00'");
    console.log('✅ Connected to online server\n');

    // Get all tables from localhost
    console.log('📋 Getting all tables from localhost...');
    const [tables] = await localhostConn.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `, [localhostConfig.database]);

    console.log(`   Found ${tables.length} tables`);
    tables.forEach((table, idx) => {
      console.log(`   ${idx + 1}. ${table.TABLE_NAME}`);
    });
    console.log('');

    // Create tables on online database if they don't exist
    console.log('🔨 Creating tables on online database...');
    
    // Disable foreign key checks for table creation
    await onlineConn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const failedTables = [];
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`   Creating table: ${tableName}...`);
      
      // Get CREATE TABLE statement from localhost
      const [createTableResult] = await localhostConn.query(`
        SHOW CREATE TABLE \`${tableName}\`
      `);
      
      if (createTableResult.length > 0) {
        const createTableSQL = createTableResult[0]['Create Table'];
        
        // Check if table exists on online
        try {
          await onlineConn.query(`SELECT 1 FROM \`${tableName}\` LIMIT 1`);
          console.log(`     ✅ Table ${tableName} already exists`);
        } catch (error) {
          // Table doesn't exist, create it
          try {
            await onlineConn.query(createTableSQL);
            console.log(`     ✅ Created table ${tableName}`);
          } catch (createError) {
            console.log(`     ⚠️  Error creating ${tableName}: ${createError.message}`);
            failedTables.push({ tableName, createTableSQL });
          }
        }
      }
    }
    
    // Retry failed tables
    if (failedTables.length > 0) {
      console.log(`\n   Retrying ${failedTables.length} failed tables...`);
      for (const failed of failedTables) {
        try {
          await onlineConn.query(failed.createTableSQL);
          console.log(`     ✅ Created table ${failed.tableName} (retry)`);
        } catch (createError) {
          console.log(`     ❌ Still failed: ${failed.tableName} - ${createError.message}`);
        }
      }
    }
    
    // Re-enable foreign key checks
    await onlineConn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('');

    // Generate SQL file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `sync_full_database_${timestamp}.sql`;
    const filepath = path.join(__dirname, filename);

    let sqlContent = `-- Full Database Sync: Localhost → Online\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Total Tables: ${tables.length}\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sqlContent += `SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n`;

    // Process each table
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i].TABLE_NAME;
      console.log(`📦 Processing table ${i + 1}/${tables.length}: ${tableName}...`);

      // Get all data from localhost
      const [rows] = await localhostConn.query(`SELECT * FROM ??`, [tableName]);
      console.log(`   Found ${rows.length} rows`);

      if (rows.length === 0) {
        console.log(`   ⚠️  Table is empty, skipping\n`);
        continue;
      }

      // Get column names
      const [columns] = await localhostConn.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [localhostConfig.database, tableName]);

      const columnNames = columns.map(col => col.COLUMN_NAME);

      // Delete all existing data from online table (if it exists)
      sqlContent += `-- Table: ${tableName}\n`;
      sqlContent += `DELETE FROM \`${tableName}\` WHERE 1=1;\n\n`;

      // Generate INSERT statements
      sqlContent += `-- Inserting ${rows.length} rows into ${tableName}\n`;
      
      // Insert in batches of 100 to avoid huge SQL files
      const batchSize = 100;
      for (let j = 0; j < rows.length; j += batchSize) {
        const batch = rows.slice(j, j + batchSize);
        
        sqlContent += `INSERT INTO \`${tableName}\` (\`${columnNames.join('`, `')}\`) VALUES\n`;
        
        const values = batch.map((row, rowIdx) => {
          const rowValues = columnNames.map(colName => {
            const value = row[colName];
            
            if (value === null || value === undefined) {
              return 'NULL';
            }
            
            const column = columns.find(c => c.COLUMN_NAME === colName);
            const dataType = column ? column.DATA_TYPE.toUpperCase() : '';
            
            // Handle different data types
            if (dataType.includes('INT') || dataType.includes('DECIMAL') || dataType.includes('FLOAT') || dataType.includes('DOUBLE')) {
              return value;
            } else if (dataType === 'BIT') {
              return value ? 1 : 0;
            } else if (dataType === 'DATE' || dataType === 'DATETIME' || dataType === 'TIMESTAMP') {
              // With dateStrings: true, MySQL returns dates as strings in YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format
              // Use the string directly to preserve the original date value without timezone conversion
              if (typeof value === 'string') {
                // Already a string from MySQL - use it directly
                return `'${value.replace(/'/g, "''")}'`;
              } else if (value instanceof Date) {
                // Fallback: if somehow we still get a Date object, format it carefully
                if (dataType === 'DATE') {
                  // For DATE columns, format as YYYY-MM-DD from local date (not UTC)
                  const year = value.getFullYear();
                  const month = String(value.getMonth() + 1).padStart(2, '0');
                  const day = String(value.getDate()).padStart(2, '0');
                  return `'${year}-${month}-${day}'`;
                } else {
                  // For DATETIME/TIMESTAMP, format as YYYY-MM-DD HH:MM:SS
                  return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                }
              } else {
                return 'NULL';
              }
            } else if (value instanceof Date) {
              // Handle Date objects for other column types (shouldn't happen with dateStrings: true)
              return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            } else if (dataType === 'JSON' || colName.toLowerCase().includes('json') || colName.toLowerCase().includes('api_response')) {
              // Handle JSON columns - validate JSON or set to NULL if invalid
              try {
                if (typeof value === 'string') {
                  JSON.parse(value); // Validate JSON
                  const escaped = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
                  return `'${escaped}'`;
                } else if (value !== null && value !== undefined) {
                  const jsonStr = JSON.stringify(value);
                  const escaped = jsonStr.replace(/'/g, "''").replace(/\\/g, '\\\\');
                  return `'${escaped}'`;
                } else {
                  return 'NULL';
                }
              } catch (jsonError) {
                // Invalid JSON - set to NULL
                return 'NULL';
              }
            } else {
              // String - escape single quotes
              const escaped = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
              return `'${escaped}'`;
            }
          });
          
          return `(${rowValues.join(', ')})`;
        });
        
        sqlContent += values.join(',\n') + ';\n\n';
      }
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    sqlContent += `-- Sync completed: ${tables.length} tables\n`;

    // Write to file
    fs.writeFileSync(filepath, sqlContent, 'utf8');
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ SQL FILE GENERATED');
    console.log('='.repeat(80));
    console.log(`   File: ${filename}`);
    console.log(`   Path: ${filepath}`);
    console.log(`   Size: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // Import directly to online database
    console.log('⚙️  Importing to online database...');
    console.log('   This may take a few moments...');
    console.log('');

    const startTime = Date.now();
    await onlineConn.query(sqlContent);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`   ✅ Import completed in ${duration} seconds`);
    console.log('');

    // Verify import
    console.log('🔍 Verifying import...');
    let totalRows = 0;
    for (const table of tables) {
      const [count] = await onlineConn.query(`SELECT COUNT(*) as count FROM ??`, [table.TABLE_NAME]);
      const rowCount = count[0].count;
      totalRows += rowCount;
      console.log(`   ${table.TABLE_NAME}: ${rowCount} rows`);
    }
    console.log(`   Total rows across all tables: ${totalRows}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ FULL DATABASE SYNC COMPLETED');
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

// Run the sync
syncFullDatabase()
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

