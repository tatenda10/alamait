const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runServiceMonthMigration() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Reading migration file...');
    const sql = fs.readFileSync('./src/migrations/add_service_month_to_payments.sql', 'utf8');
    
    console.log('Executing migration...');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        try {
          await connection.execute(statement.trim());
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Column already exists, skipping...');
          } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  Index already exists, skipping...');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Service month fields added successfully!');
    
    // Verify columns were added
    const [columns] = await connection.execute("DESCRIBE student_payments");
    console.log('\n📋 Updated student_payments structure:');
    console.table(columns);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
runServiceMonthMigration()
  .then(() => {
    console.log('🎉 Service month migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
