const fs = require('fs');
const path = require('path');
const db = require('../src/services/db');

async function updatePettyCashAccountsTable() {
  try {
    console.log('🔧 Updating petty_cash_accounts table...');
    
    // Add petty_cash_user_id column
    await db.query('ALTER TABLE petty_cash_accounts ADD COLUMN petty_cash_user_id INT NULL AFTER user_id');
    console.log('✅ Added petty_cash_user_id column');
    
    // Add index for the new column
    await db.query('ALTER TABLE petty_cash_accounts ADD INDEX idx_petty_cash_user_id (petty_cash_user_id)');
    console.log('✅ Added index for petty_cash_user_id');
    
    // Add foreign key constraint
    await db.query('ALTER TABLE petty_cash_accounts ADD CONSTRAINT fk_petty_cash_accounts_user FOREIGN KEY (petty_cash_user_id) REFERENCES petty_cash_users(id)');
    console.log('✅ Added foreign key constraint');
    
    console.log('✅ petty_cash_accounts table updated successfully');
    
    // Verify column was added
    const [columns] = await db.query("SHOW COLUMNS FROM petty_cash_accounts LIKE 'petty_cash_user_id'");
    if (columns.length > 0) {
      console.log('✅ petty_cash_user_id column added successfully');
    } else {
      console.log('❌ Column addition verification failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating petty_cash_accounts table:', error.message);
    process.exit(1);
  }
}

updatePettyCashAccountsTable();
