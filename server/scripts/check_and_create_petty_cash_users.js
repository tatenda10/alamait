const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndCreatePettyCashUsers() {
  console.log('🔌 Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });
  console.log('✅ Database connected successfully!');

  try {
    // First, check if the table already exists
    console.log('🔍 Checking if petty_cash_users table exists...');
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'petty_cash_users'
    `);
    
    if (tables[0].count > 0) {
      console.log('✅ petty_cash_users table already exists!');
      
      // Show current table structure
      const [columns] = await connection.execute('DESCRIBE petty_cash_users');
      console.log('\n📋 Current Table Structure:');
      console.table(columns);
      
      // Check if there are any existing users
      const [existingUsers] = await connection.execute(
        'SELECT COUNT(*) as count FROM petty_cash_users WHERE deleted_at IS NULL'
      );
      console.log(`\n📊 Current petty cash users: ${existingUsers[0].count}`);
      
    } else {
      console.log('🔧 Creating petty_cash_users table...');
      
      // Create the table with a simple structure first
      await connection.execute(`
        CREATE TABLE petty_cash_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          boarding_house_id INT NOT NULL,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ petty_cash_users table created successfully!');
      
      // Show the new table structure
      const [columns] = await connection.execute('DESCRIBE petty_cash_users');
      console.log('\n📋 New Table Structure:');
      console.table(columns);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
checkAndCreatePettyCashUsers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
