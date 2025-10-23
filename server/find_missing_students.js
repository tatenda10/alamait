const mysql = require('mysql2/promise');
require('dotenv').config();

async function findMissingStudents() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Finding all St Kilda students...');
    
    // Get St Kilda boarding house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`🏠 St Kilda house ID: ${stKildaId}`);
    
    // Get all students in St Kilda (not just enrolled ones)
    const [allStudents] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        s.status,
        se.id as enrollment_id,
        se.room_id,
        r.name as room_name
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n👥 Found ${allStudents.length} students in St Kilda boarding house`);
    
    // Separate enrolled vs non-enrolled students
    const enrolledStudents = allStudents.filter(student => student.enrollment_id);
    const nonEnrolledStudents = allStudents.filter(student => !student.enrollment_id);
    
    console.log(`\n📋 Enrolled students (${enrolledStudents.length}):`);
    enrolledStudents.forEach(student => {
      console.log(`  - ${student.full_name} in ${student.room_name || 'No room'}`);
    });
    
    console.log(`\n❌ Non-enrolled students (${nonEnrolledStudents.length}):`);
    nonEnrolledStudents.forEach(student => {
      console.log(`  - ${student.full_name} (ID: ${student.id}) - Status: ${student.status}`);
    });
    
    // Get available rooms with beds
    const [availableRooms] = await connection.execute(`
      SELECT 
        r.id,
        r.name,
        r.capacity,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
        COUNT(se.id) as student_count
      FROM rooms r
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL
      WHERE r.boarding_house_id = ? AND r.deleted_at IS NULL
      GROUP BY r.id, r.name, r.capacity
      HAVING COUNT(CASE WHEN b.status = 'available' THEN 1 END) > 0
      ORDER BY available_beds DESC, r.name
    `, [stKildaId]);
    
    console.log(`\n🏠 Available rooms with beds:`);
    availableRooms.forEach(room => {
      console.log(`  - ${room.name}: ${room.available_beds} available beds, ${room.student_count} current students`);
    });
    
    // Check if we have enough available beds for non-enrolled students
    const totalAvailableBeds = availableRooms.reduce((sum, room) => sum + room.available_beds, 0);
    console.log(`\n📊 Summary:`);
    console.log(`  Total students in St Kilda: ${allStudents.length}`);
    console.log(`  Enrolled students: ${enrolledStudents.length}`);
    console.log(`  Non-enrolled students: ${nonEnrolledStudents.length}`);
    console.log(`  Available beds: ${totalAvailableBeds}`);
    
    if (nonEnrolledStudents.length > totalAvailableBeds) {
      console.log(`  ⚠️  Not enough beds for all non-enrolled students!`);
      console.log(`  Need ${nonEnrolledStudents.length} beds but only have ${totalAvailableBeds} available`);
    } else {
      console.log(`  ✅ Enough beds available for all non-enrolled students`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

findMissingStudents();
