const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

async function runBAPaymentsMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting BA payments table migration...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connected to database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'create_ba_payments_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded');

    // Execute the migration SQL
    console.log('🔄 Executing migration...');
    await connection.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify the table creation
    const [tables] = await connection.query("SHOW TABLES LIKE 'ba_payments'");
    if (tables.length > 0) {
      console.log('📊 BA payments table created successfully');
      
      // Show table structure
      const [columns] = await connection.query("DESCRIBE ba_payments");
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('❌ Failed to create BA payments table');
    }

  } catch (error) {
    console.error('💥 Migration process failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

runBAPaymentsMigration().then(() => {
  console.log('🎉 BA payments migration completed');
}).catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
