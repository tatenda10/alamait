const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function removeServiceMonthMigration() {
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
    const sql = fs.readFileSync('./src/migrations/remove_service_month_from_payments.sql', 'utf8');
    
    console.log('Executing migration...');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        try {
          await connection.execute(statement.trim());
        } catch (error) {
          if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('ℹ️  Field or index already removed, skipping...');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Service month fields removed successfully!');
    
    // Verify columns were removed
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
removeServiceMonthMigration()
  .then(() => {
    console.log('🎉 Service month removal migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
