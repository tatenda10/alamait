const db = require('../src/services/db');

async function testBedsAPI() {
  try {
    console.log('🔍 Testing beds API...');
    
    // Check if beds exist in the database
    const [beds] = await db.query('SELECT * FROM beds WHERE deleted_at IS NULL LIMIT 5');
    console.log('Beds in database:');
    console.table(beds);
    
    // Check if there are any rooms with beds
    const [roomsWithBeds] = await db.query(`
      SELECT r.id, r.name, COUNT(b.id) as bed_count
      FROM rooms r
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
      GROUP BY r.id, r.name
      HAVING bed_count > 0
    `);
    
    console.log('Rooms with beds:');
    console.table(roomsWithBeds);
    
    // Test the specific endpoint that the frontend is calling
    if (roomsWithBeds.length > 0) {
      const roomId = roomsWithBeds[0].id;
      console.log(`\n🔍 Testing beds for room ${roomId}:`);
      
      const [roomBeds] = await db.query(`
        SELECT b.*, s.first_name, s.last_name, s.student_id
        FROM beds b
        LEFT JOIN students s ON b.student_id = s.id AND s.deleted_at IS NULL
        WHERE b.room_id = ? AND b.deleted_at IS NULL
        ORDER BY b.bed_number
      `, [roomId]);
      
      console.log(`Beds for room ${roomId}:`);
      console.table(roomBeds);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testBedsAPI();
