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

async function createBelvedereRooms() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🏠 Creating Belvedere rooms (C1 and M1)...\n');
    
    const boardingHouseId = 5; // Belvedere
    
    // Room specifications based on your data
    const rooms = [
      {
        name: 'C1',
        capacity: 10, // Based on 3 students + room for more
        price_per_bed: 150.00,
        description: 'C1 Room - $150 per bed'
      },
      {
        name: 'M1', 
        capacity: 25, // Based on 22 students + room for more
        price_per_bed: 110.00,
        description: 'M1 Room - $110 per bed'
      }
    ];
    
    await connection.beginTransaction();
    
    for (const room of rooms) {
      console.log(`Creating room: ${room.name} (Capacity: ${room.capacity}, Price: $${room.price_per_bed})`);
      
      const [result] = await connection.query(
        `INSERT INTO rooms (
          name, capacity, available_beds, price_per_bed, 
          description, status, boarding_house_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [
          room.name,
          room.capacity,
          room.capacity, // Start with all beds available
          room.price_per_bed,
          room.description,
          boardingHouseId
        ]
      );
      
      console.log(`✅ Created ${room.name} (ID: ${result.insertId})`);
    }
    
    await connection.commit();
    
    // Verify rooms were created
    const [createdRooms] = await connection.query(
      `SELECT id, name, capacity, available_beds, price_per_bed 
       FROM rooms 
       WHERE boarding_house_id = ? AND name IN ('C1', 'M1') 
       ORDER BY name`,
      [boardingHouseId]
    );
    
    console.log('\n📋 Created Rooms:');
    createdRooms.forEach(room => {
      console.log(`   ${room.name}: Capacity ${room.capacity}, Available ${room.available_beds}, Price $${room.price_per_bed}`);
    });
    
    console.log('\n🎉 Belvedere rooms created successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating Belvedere rooms:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  createBelvedereRooms()
    .then(() => {
      console.log('\n✅ Room creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Room creation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createBelvedereRooms };
