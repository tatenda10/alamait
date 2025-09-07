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

async function checkBelvedereSetup() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🏠 Checking Belvedere Boarding House Setup (ID: 5)...\n');
    
    // 1. Check if boarding house exists
    const [boardingHouses] = await connection.query(
      'SELECT id, name FROM boarding_houses WHERE id = 5 AND deleted_at IS NULL'
    );
    
    if (boardingHouses.length === 0) {
      console.log('❌ Belvedere boarding house (ID: 5) not found');
      return;
    }
    
    console.log(`✅ Found boarding house: ${boardingHouses[0].name} (ID: 5)`);
    
    // 2. Check available rooms
    const [rooms] = await connection.query(
      `SELECT id, name, capacity, available_beds, price_per_bed 
       FROM rooms 
       WHERE boarding_house_id = 5 AND deleted_at IS NULL 
       ORDER BY name`
    );
    
    console.log(`\n🏠 Available Rooms in Belvedere:`);
    rooms.forEach(room => {
      console.log(`   ${room.name}: Capacity ${room.capacity}, Available ${room.available_beds}, Price $${room.price_per_bed}`);
    });
    
    // 3. Check petty cash account
    const [pettyCashAccounts] = await connection.query(
      'SELECT * FROM petty_cash_accounts WHERE boarding_house_id = 5'
    );
    
    if (pettyCashAccounts.length === 0) {
      console.log('\n💰 No petty cash account found for Belvedere');
      console.log('   Will create one during registration');
    } else {
      const account = pettyCashAccounts[0];
      console.log(`\n💰 Petty Cash Account Status:`);
      console.log(`   Current Balance: $${account.current_balance}`);
      console.log(`   Total Inflows: $${account.total_inflows}`);
      console.log(`   Total Outflows: $${account.total_outflows}`);
    }
    
    // 4. Check required rooms (C1, M1)
    const requiredRooms = ['C1', 'M1'];
    const availableRooms = rooms.map(r => r.name);
    const missingRooms = requiredRooms.filter(room => !availableRooms.includes(room));
    
    if (missingRooms.length > 0) {
      console.log(`\n⚠️  Missing required rooms: ${missingRooms.join(', ')}`);
      console.log('   Please create these rooms before proceeding');
    } else {
      console.log(`\n✅ All required rooms (C1, M1) are available`);
    }
    
    // 5. Check room capacity vs student count
    const c1Room = rooms.find(r => r.name === 'C1');
    const m1Room = rooms.find(r => r.name === 'M1');
    
    if (c1Room) {
      console.log(`\n📊 C1 Room Analysis:`);
      console.log(`   Capacity: ${c1Room.capacity}`);
      console.log(`   Available: ${c1Room.available_beds}`);
      console.log(`   Students needed: 3`);
      console.log(`   Status: ${c1Room.available_beds >= 3 ? '✅ Sufficient' : '❌ Insufficient'}`);
    }
    
    if (m1Room) {
      console.log(`\n📊 M1 Room Analysis:`);
      console.log(`   Capacity: ${m1Room.capacity}`);
      console.log(`   Available: ${m1Room.available_beds}`);
      console.log(`   Students needed: 22`);
      console.log(`   Status: ${m1Room.available_beds >= 22 ? '✅ Sufficient' : '❌ Insufficient'}`);
    }
    
    console.log('\n🎯 Ready for Belvedere student registration!');
    
  } catch (error) {
    console.error('❌ Error checking Belvedere setup:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  checkBelvedereSetup()
    .then(() => {
      console.log('\n✅ Setup check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkBelvedereSetup };
