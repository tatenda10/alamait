const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runStudentApplicationsMigration() {
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
    const sql = fs.readFileSync('./src/migrations/create_student_applications_table.sql', 'utf8');
    
    console.log('Executing migration...');
    await connection.execute(sql);
    
    console.log('✅ Student applications table created successfully!');
    
    // Verify table was created
    const [tables] = await connection.execute("SHOW TABLES LIKE 'student_applications'");
    if (tables.length > 0) {
      console.log('✅ Table verification successful');
      
      // Show table structure
      const [structure] = await connection.execute("DESCRIBE student_applications");
      console.log('\n📋 Table structure:');
      console.table(structure);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table already exists, skipping creation');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
runStudentApplicationsMigration()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
