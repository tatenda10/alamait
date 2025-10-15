const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

async function runBudgetExpenditureMigration() {
  let connection;
  
  try {
    console.log('🔄 Starting budget and expenditure migration...\n');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read and execute budget requests migration
    const budgetMigrationPath = path.join(__dirname, 'src/migrations/create_budget_requests_table.sql');
    const budgetMigrationSQL = fs.readFileSync(budgetMigrationPath, 'utf8');
    
    console.log('📋 Running budget requests migration...');
    
    // Split SQL into individual statements
    const budgetStatements = budgetMigrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${budgetStatements.length} budget statements to execute`);
    console.log('📝 Statements:', budgetStatements.map(stmt => stmt.substring(0, 50) + '...'));
    
    await connection.beginTransaction();
    
    for (let i = 0; i < budgetStatements.length; i++) {
      const statement = budgetStatements[i];
      if (statement.trim()) {
        console.log(`   Executing budget statement ${i + 1}/${budgetStatements.length}...`);
        console.log(`   SQL: ${statement.substring(0, 100)}...`);
        try {
          await connection.execute(statement);
          console.log(`   ✅ Budget statement ${i + 1} executed successfully`);
        } catch (error) {
          console.log(`   ❌ Budget statement ${i + 1} failed: ${error.message}`);
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_ENTRY' || error.code === 'ER_TABLE_EXISTS') {
            console.log(`   ⚠️ Budget statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Budget requests migration completed successfully');

    // Read and execute expenditure requests migration
    const expenditureMigrationPath = path.join(__dirname, 'src/migrations/create_expenditure_requests_table.sql');
    const expenditureMigrationSQL = fs.readFileSync(expenditureMigrationPath, 'utf8');
    
    console.log('📋 Running expenditure requests migration...');
    
    // Split SQL into individual statements
    const expenditureStatements = expenditureMigrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (let i = 0; i < expenditureStatements.length; i++) {
      const statement = expenditureStatements[i];
      if (statement.trim()) {
        console.log(`   Executing expenditure statement ${i + 1}/${expenditureStatements.length}...`);
        try {
          await connection.execute(statement);
          console.log(`   ✅ Expenditure statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_ENTRY' || error.code === 'ER_TABLE_EXISTS') {
            console.log(`   ⚠️ Expenditure statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    await connection.commit();
    console.log('✅ Expenditure requests migration completed successfully');

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads/expenditure-attachments');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory:', uploadsDir);
      } else {
        console.log('📁 Uploads directory already exists:', uploadsDir);
      }
    } catch (error) {
      console.log('⚠️ Could not create uploads directory:', error.message);
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    const [budgetTables] = await connection.execute("SHOW TABLES LIKE 'budget_requests'");
    const [expenditureTables] = await connection.execute("SHOW TABLES LIKE 'expenditure_requests'");
    const [categoryTables] = await connection.execute("SHOW TABLES LIKE 'budget_categories'");
    const [attachmentTables] = await connection.execute("SHOW TABLES LIKE 'expenditure_attachments'");
    
    if (budgetTables.length > 0) {
      console.log('✅ budget_requests table created successfully');
    }
    if (expenditureTables.length > 0) {
      console.log('✅ expenditure_requests table created successfully');
    }
    if (categoryTables.length > 0) {
      console.log('✅ budget_categories table created successfully');
    }
    if (attachmentTables.length > 0) {
      console.log('✅ expenditure_attachments table created successfully');
    }
    
    console.log('\n🎉 Budget and expenditure migration completed successfully!');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runBudgetExpenditureMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error.message);
    process.exit(1);
  });
