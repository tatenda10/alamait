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
    console.log('🔧 Creating basic petty_cash_users table...');

    // Drop table if exists first
    await connection.execute('DROP TABLE IF EXISTS petty_cash_users');
    console.log('🗑️ Dropped existing table (if any)');

    // Create the most basic table
    await connection.execute(`
      CREATE TABLE petty_cash_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        boarding_house_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    console.log('✅ petty_cash_users table created successfully!');

    // Show table structure
    const [columns] = await connection.execute('DESCRIBE petty_cash_users');
    console.log('\n📋 Table Structure:');
    console.table(columns);

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
