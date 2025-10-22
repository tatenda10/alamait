const db = require('../src/services/db');

async function testRoomImages() {
  try {
    console.log('🔍 Testing room images for room 25...');
    
    // Check if room_images table has data for room 25
    const [images] = await db.query(
      'SELECT * FROM room_images WHERE room_id = 25 AND deleted_at IS NULL'
    );
    
    console.log('Room images found:', images.length);
    if (images.length > 0) {
      console.table(images);
    } else {
      console.log('No images found for room 25');
    }
    
    // Check if room exists
    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE id = 25 AND deleted_at IS NULL'
    );
    
    console.log('Room exists:', rooms.length > 0);
    if (rooms.length > 0) {
      console.table(rooms);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testRoomImages();
