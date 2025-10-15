const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

async function runBedsMigration() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🛏️ Starting beds migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'create_beds_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    await connection.beginTransaction();
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    await connection.commit();
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    const [tables] = await connection.execute("SHOW TABLES LIKE 'beds'");
    if (tables.length > 0) {
      console.log('✅ Beds table created successfully');
      
      const [bedCount] = await connection.execute('SELECT COUNT(*) as count FROM beds');
      console.log(`📊 Total beds created: ${bedCount[0].count}`);
      
      const [roomCount] = await connection.execute('SELECT COUNT(*) as count FROM rooms WHERE deleted_at IS NULL');
      console.log(`🏠 Total rooms: ${roomCount[0].count}`);
      
      // Show sample beds
      const [sampleBeds] = await connection.execute(`
        SELECT 
          b.bed_number,
          b.price,
          b.status,
          r.name as room_name,
          bh.name as boarding_house_name
        FROM beds b
        JOIN rooms r ON b.room_id = r.id
        JOIN boarding_houses bh ON r.boarding_house_id = bh.id
        LIMIT 5
      `);
      
      if (sampleBeds.length > 0) {
        console.log('\n📋 Sample beds created:');
        sampleBeds.forEach(bed => {
          console.log(`   ${bed.bed_number} in ${bed.room_name} (${bed.boarding_house_name}) - $${bed.price} - ${bed.status}`);
        });
      }
    } else {
      console.log('❌ Beds table was not created');
    }
    
    console.log('\n🎉 Beds migration completed successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
runBedsMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
