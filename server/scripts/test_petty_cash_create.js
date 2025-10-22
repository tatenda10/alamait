const db = require('../src/services/db');

async function testPettyCashCreate() {
  try {
    console.log('🔍 Testing petty cash account creation...');
    
    // Check if users exist
    const [users] = await db.query(
      'SELECT id, username, role FROM users WHERE role = "petty_cash_user" AND deleted_at IS NULL LIMIT 5'
    );
    console.log('Available users:', users.length);
    if (users.length > 0) {
      console.table(users);
    }
    
    // Check if boarding houses exist
    const [boardingHouses] = await db.query(
      'SELECT id, name FROM boarding_houses WHERE deleted_at IS NULL LIMIT 5'
    );
    console.log('Available boarding houses:', boardingHouses.length);
    if (boardingHouses.length > 0) {
      console.table(boardingHouses);
    }
    
    // Check if petty_cash_accounts table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'petty_cash_accounts'");
    console.log('petty_cash_accounts table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check table structure
      const [columns] = await db.query("DESCRIBE petty_cash_accounts");
      console.log('petty_cash_accounts table structure:');
      console.table(columns);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testPettyCashCreate();
