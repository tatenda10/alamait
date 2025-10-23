const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBus1Enrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking BUS1 enrollments and beds...');
    
    // Check all BUS1 rooms
    const [bus1Rooms] = await connection.execute(`
      SELECT 
        r.id,
        r.name,
        COUNT(se.id) as enrollments,
        COUNT(b.id) as beds
      FROM rooms r
      LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.name LIKE '%BUS1%' AND r.deleted_at IS NULL
      GROUP BY r.id, r.name
      ORDER BY r.id
    `);
    
    console.log('\n📋 All BUS1 rooms:');
    bus1Rooms.forEach(room => {
      console.log(`  Room ID ${room.id}: ${room.name} - ${room.enrollments} enrollments, ${room.beds} beds`);
    });
    
    // Check specific BUS1 room (ID 28) that should have 6 beds
    console.log('\n🔍 Detailed analysis for BUS1 (ID 28):');
    const [bus1Details] = await connection.execute(`
      SELECT 
        se.id as enrollment_id,
        s.full_name,
        se.start_date,
        b.bed_number,
        b.status
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      LEFT JOIN beds b ON se.room_id = b.room_id
      JOIN rooms r ON se.room_id = r.id
      WHERE r.id = 28 AND se.deleted_at IS NULL
      ORDER BY se.id
    `);
    
    console.log(`Found ${bus1Details.length} enrollments in BUS1 (ID 28):`);
    bus1Details.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. ${enrollment.full_name} - Bed: ${enrollment.bed_number || 'Not assigned'} (${enrollment.status || 'No bed'})`);
    });
    
    // Check all beds in BUS1 (ID 28)
    const [bus1Beds] = await connection.execute(`
      SELECT 
        b.id,
        b.bed_number,
        b.status
      FROM beds b
      WHERE b.room_id = 28 AND b.deleted_at IS NULL
      ORDER BY b.bed_number
    `);
    
    console.log(`\n🛏️ All beds in BUS1 (ID 28):`);
    bus1Beds.forEach(bed => {
      console.log(`  Bed ${bed.bed_number}: ${bed.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkBus1Enrollments();
