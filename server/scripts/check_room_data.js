const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRoomData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Checking room data for BUS1...');
    
    const [rooms] = await connection.execute(`
      SELECT 
        id, name, capacity, price_per_bed, admin_fee, security_deposit, additional_rent, description
      FROM rooms 
      WHERE name = 'BUS1' AND deleted_at IS NULL
    `);
    
    if (rooms.length > 0) {
      console.log('Room data:', rooms[0]);
    } else {
      console.log('No room found with name BUS1');
    }
    
    // Also check the table structure
    console.log('\n📋 Checking rooms table structure...');
    const [columns] = await connection.execute(`
      DESCRIBE rooms
    `);
    
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkRoomData();
