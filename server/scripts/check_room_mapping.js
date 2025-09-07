const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait_db',
  port: process.env.DB_PORT || 3306
};

// Rooms from your Excel data
const excelRooms = [
  'Ext 2', 'M4', 'M7', 'M1', 'EXT 1', 'M8', 'Bus 2', 'Bus 1', 'M5', 'M2', 'M6'
];

// Your existing rooms (from the data you provided)
const existingRooms = [
  { id: 5, name: 'Room A', boarding_house_id: 6 },
  { id: 6, name: 'Room B', boarding_house_id: 6 },
  { id: 7, name: 'Room C', boarding_house_id: 6 },
  { id: 8, name: 'M5', boarding_house_id: 4 },
  { id: 9, name: 'BUS2', boarding_house_id: 4 },
  { id: 10, name: 'BUS1', boarding_house_id: 4 },
  { id: 11, name: 'M4', boarding_house_id: 4 },
  { id: 12, name: 'M3', boarding_house_id: 4 },
  { id: 13, name: 'Upstairs 2', boarding_house_id: 4 },
  { id: 14, name: 'M6', boarding_house_id: 4 },
  { id: 15, name: 'EXT2', boarding_house_id: 4 },
  { id: 16, name: 'EXT1', boarding_house_id: 4 },
  { id: 17, name: 'M7', boarding_house_id: 4 },
  { id: 18, name: 'C1', boarding_house_id: 4 },
  { id: 19, name: 'M2', boarding_house_id: 4 },
  { id: 20, name: 'M8', boarding_house_id: 4 },
  { id: 21, name: 'C2', boarding_house_id: 4 },
  { id: 22, name: 'Executive', boarding_house_id: 4 },
  { id: 23, name: 'M1', boarding_house_id: 4 },
  { id: 24, name: 'Upstairs 1', boarding_house_id: 4 }
];

async function checkRoomMapping() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking room mapping for Boarding House 4...\n');
    
    // Get actual rooms from database for boarding house 4
    const [dbRooms] = await connection.query(
      'SELECT id, name, capacity, available_beds, price_per_bed FROM rooms WHERE boarding_house_id = 4 AND deleted_at IS NULL ORDER BY name'
    );
    
    console.log('📋 Rooms in Database (Boarding House 4):');
    dbRooms.forEach(room => {
      console.log(`   ID: ${room.id} | Name: ${room.name} | Capacity: ${room.capacity} | Available: ${room.available_beds} | Price: $${room.price_per_bed}`);
    });
    
    console.log('\n📊 Excel Room Mapping Analysis:');
    console.log('┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Excel Room  │ DB Room     │ Status      │ ID          │ Price       │');
    console.log('├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤');
    
    const roomMapping = {};
    const missingRooms = [];
    
    excelRooms.forEach(excelRoom => {
      // Try to find matching room (case insensitive)
      const dbRoom = dbRooms.find(r => 
        r.name.toLowerCase() === excelRoom.toLowerCase() ||
        r.name.toLowerCase() === excelRoom.toLowerCase().replace(' ', '') ||
        (excelRoom === 'Bus 2' && r.name === 'BUS2') ||
        (excelRoom === 'Bus 1' && r.name === 'BUS1') ||
        (excelRoom === 'Ext 2' && r.name === 'EXT2') ||
        (excelRoom === 'EXT 1' && r.name === 'EXT1')
      );
      
      if (dbRoom) {
        roomMapping[excelRoom] = {
          id: dbRoom.id,
          name: dbRoom.name,
          price: dbRoom.price_per_bed,
          available: dbRoom.available_beds
        };
        console.log(`│ ${excelRoom.padEnd(11)} │ ${dbRoom.name.padEnd(11)} │ ✅ Found    │ ${String(dbRoom.id).padEnd(11)} │ $${dbRoom.price_per_bed.padEnd(10)} │`);
      } else {
        missingRooms.push(excelRoom);
        console.log(`│ ${excelRoom.padEnd(11)} │ N/A         │ ❌ Missing  │ N/A         │ N/A         │`);
      }
    });
    
    console.log('└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘');
    
    if (missingRooms.length > 0) {
      console.log('\n⚠️  Missing Rooms:');
      missingRooms.forEach(room => console.log(`   - ${room}`));
    } else {
      console.log('\n✅ All Excel rooms found in database!');
    }
    
    console.log('\n📋 Room Mapping for Script:');
    Object.entries(roomMapping).forEach(([excelRoom, dbRoom]) => {
      console.log(`   '${excelRoom}' → Room ID ${dbRoom.id} (${dbRoom.name}) - $${dbRoom.price}`);
    });
    
    return { roomMapping, missingRooms, dbRooms };
    
  } catch (error) {
    console.error('❌ Error checking room mapping:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  checkRoomMapping()
    .then((result) => {
      console.log('\n✅ Room mapping check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Room mapping check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkRoomMapping };
