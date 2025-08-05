const fs = require('fs');
const path = require('path');
const db = require('../services/db');

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = [
      'create_supplier_payments_table.sql',
      'create_saved_income_statements_table.sql',
      // 'update_suppliers_table_simplified.sql', // Commented out due to column issues
      'add_petty_cash_account_to_supplier_payments.sql'
    ];
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          if (statement.trim()) {
            await db.query(statement);
          }
        }
        
        console.log(`✓ Migration completed: ${file}`);
      } else {
        console.log(`⚠ Migration file not found: ${file}`);
      }
    }
    
    console.log('All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };