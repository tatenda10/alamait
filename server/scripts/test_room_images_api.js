const db = require('../src/services/db');

async function testRoomImagesAPI() {
  try {
    console.log('🔍 Testing room images API...');
    
    // Check if room_images table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'room_images'");
    console.log('room_images table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check table structure
      const [columns] = await db.query("DESCRIBE room_images");
      console.log('room_images table structure:');
      console.table(columns);
      
      // Check if there are any images for room 25
      const [images] = await db.query(
        'SELECT * FROM room_images WHERE room_id = 25 AND deleted_at IS NULL'
      );
      console.log('Images for room 25:');
      console.table(images);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testRoomImagesAPI();
