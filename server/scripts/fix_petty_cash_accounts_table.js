const db = require('../src/services/db');

async function fixPettyCashAccountsTable() {
  try {
    console.log('🔧 Fixing petty_cash_accounts table...');
    
    // First, let's see the current structure
    const [columns] = await db.query("SHOW COLUMNS FROM petty_cash_accounts");
    console.log('Current columns:', columns.map(col => col.Field));
    
    // Make user_id nullable or remove it
    try {
      // Try to make user_id nullable first
      await db.query('ALTER TABLE petty_cash_accounts MODIFY COLUMN user_id INT NULL');
      console.log('✅ Made user_id nullable');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ Cannot modify user_id, trying to drop it...');
        // Try to drop the user_id column
        await db.query('ALTER TABLE petty_cash_accounts DROP COLUMN user_id');
        console.log('✅ Dropped user_id column');
      } else {
        throw error;
      }
    }
    
    // Verify the structure
    const [updatedColumns] = await db.query("SHOW COLUMNS FROM petty_cash_accounts");
    console.log('Updated columns:', updatedColumns.map(col => col.Field));
    
    console.log('✅ petty_cash_accounts table fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing petty_cash_accounts table:', error.message);
    process.exit(1);
  }
}

fixPettyCashAccountsTable();
