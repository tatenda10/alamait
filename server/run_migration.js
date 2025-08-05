const db = require('./src/services/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running migration to add withdrawal transaction type...');
    
    const migrationPath = path.join(__dirname, 'src/migrations/add_withdrawal_transaction_type.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    console.log('Added "withdrawal" to transaction_type ENUM in petty_cash_transactions table');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();