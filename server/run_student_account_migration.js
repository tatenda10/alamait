const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runStudentAccountMigration() {
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
    const sql = fs.readFileSync('./src/migrations/create_student_account_system.sql', 'utf8');
    
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
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Student account system created successfully!');
    
    // Verify tables were created
    const [tables] = await connection.execute("SHOW TABLES LIKE 'student_account_balances'");
    if (tables.length > 0) {
      console.log('✅ student_account_balances table created');
      
      // Show table structure
      const [structure] = await connection.execute("DESCRIBE student_account_balances");
      console.log('\n📋 student_account_balances structure:');
      console.table(structure);
    }

    const [invoiceTables] = await connection.execute("SHOW TABLES LIKE 'student_invoices'");
    if (invoiceTables.length > 0) {
      console.log('✅ student_invoices table created');
      
      // Show table structure
      const [invoiceStructure] = await connection.execute("DESCRIBE student_invoices");
      console.log('\n📋 student_invoices structure:');
      console.table(invoiceStructure);
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
runStudentAccountMigration()
  .then(() => {
    console.log('🎉 Student account system migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
