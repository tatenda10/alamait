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

async function runPaymentApprovalMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting payment approval fields migration...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connected to database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'add_payment_approval_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded');

    // Execute the migration SQL
    console.log('🔄 Executing migration...');
    await connection.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify the changes
    const [columns] = await connection.query("SHOW COLUMNS FROM payments");
    const approvalColumns = columns.filter(col => 
      ['approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason'].includes(col.Field)
    );
    
    console.log('📊 Added approval fields to payments table:');
    approvalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Check indexes
    const [indexes] = await connection.query("SHOW INDEX FROM payments");
    const approvalIndexes = indexes.filter(idx => 
      ['idx_payments_status', 'idx_payments_approved_by', 'idx_payments_rejected_by'].includes(idx.Key_name)
    );
    
    console.log('📋 Added indexes:');
    approvalIndexes.forEach(idx => {
      console.log(`  - ${idx.Key_name}: ${idx.Column_name}`);
    });

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

runPaymentApprovalMigration().then(() => {
  console.log('🎉 Payment approval migration completed');
}).catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
