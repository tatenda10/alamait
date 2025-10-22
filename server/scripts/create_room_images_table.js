const db = require('../src/services/db');
const fs = require('fs');
const path = require('path');

async function createRoomImagesTable() {
  const conn = await db.getConnection();
  try {
    console.log('🏠 Creating room_images table...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/migrations/create_room_images_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await conn.query(migrationSQL);
    
    console.log('✅ room_images table created successfully');
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, '../uploads/room-images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads/room-images directory');
    }
    
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating room_images table:', error.message);
    conn.release();
    process.exit(1);
  }
}

createRoomImagesTable();
