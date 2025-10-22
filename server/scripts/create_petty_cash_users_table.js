const mysql = require('mysql2/promise');
require('dotenv').config();

async function createPettyCashUsersTable() {
  console.log('🔌 Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });
  console.log('✅ Database connected successfully!');

  try {
    console.log('🔧 Creating petty_cash_users table...');

    // Create the petty_cash_users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS petty_cash_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        boarding_house_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_username (username),
        INDEX idx_boarding_house (boarding_house_id),
        INDEX idx_created_by (created_by),
        INDEX idx_deleted_at (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ petty_cash_users table created successfully!');

    // Show table structure
    const [columns] = await connection.execute('DESCRIBE petty_cash_users');
    console.log('\n📋 Table Structure:');
    console.table(columns);

    // Check if there are any existing petty cash users
    const [existingUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM petty_cash_users WHERE deleted_at IS NULL'
    );
    
    console.log(`\n📊 Current petty cash users: ${existingUsers[0].count}`);

  } catch (error) {
    console.error('❌ Error creating petty_cash_users table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
createPettyCashUsersTable()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
