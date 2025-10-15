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

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting expenditure requests actioned status migration...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connected to database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'add_actioned_status_to_expenditure_requests.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');

    // Execute the migration
    console.log('🔄 Executing migration...');
    await connection.execute(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Added "actioned" status to expenditure_requests table');

    // Verify the change
    console.log('🔍 Verifying migration...');
    const [result] = await connection.execute(
      "SHOW COLUMNS FROM expenditure_requests LIKE 'status'"
    );
    
    if (result.length > 0) {
      console.log('✅ Status column updated successfully');
      console.log('📋 New status options:', result[0].Type);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⚠️ Migration may have already been applied');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
