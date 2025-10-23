const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugStudentEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Debugging student enrollments...');
    
    // Get St Kilda boarding house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`🏠 St Kilda house ID: ${stKildaId}`);
    
    // Get all students in St Kilda boarding house with their enrollments
    const [allStudents] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        s.status,
        se.id as enrollment_id,
        se.room_id,
        r.name as room_name,
        r.boarding_house_id as room_boarding_house_id
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n👥 Found ${allStudents.length} students in St Kilda boarding house`);
    
    // Group by enrollment status
    const enrolledStudents = allStudents.filter(student => student.enrollment_id);
    const nonEnrolledStudents = allStudents.filter(student => !student.enrollment_id);
    
    console.log(`\n📋 Enrolled students (${enrolledStudents.length}):`);
    enrolledStudents.forEach(student => {
      const roomInfo = student.room_name ? `${student.room_name} (BH: ${student.room_boarding_house_id})` : 'No room';
      console.log(`  - ${student.full_name} in ${roomInfo}`);
    });
    
    console.log(`\n❌ Non-enrolled students (${nonEnrolledStudents.length}):`);
    nonEnrolledStudents.forEach(student => {
      console.log(`  - ${student.full_name} (ID: ${student.id}) - Status: ${student.status}`);
    });
    
    // Check what rooms exist in St Kilda
    console.log('\n🏠 Rooms that exist in St Kilda:');
    const [existingRooms] = await connection.execute(`
      SELECT id, name, capacity
      FROM rooms
      WHERE boarding_house_id = ? AND deleted_at IS NULL
      ORDER BY name
    `, [stKildaId]);
    
    existingRooms.forEach(room => {
      console.log(`  - ${room.name} (ID: ${room.id}, Capacity: ${room.capacity})`);
    });
    
    // Check if there are students enrolled in rooms from other boarding houses
    console.log('\n🔍 Students enrolled in rooms from other boarding houses:');
    const [studentsInOtherRooms] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        se.room_id,
        r.name as room_name,
        r.boarding_house_id,
        bh.name as boarding_house_name
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      WHERE s.boarding_house_id = ? AND r.boarding_house_id != ? AND s.deleted_at IS NULL
      ORDER BY s.full_name
    `, [stKildaId, stKildaId]);
    
    if (studentsInOtherRooms.length > 0) {
      console.log(`Found ${studentsInOtherRooms.length} students enrolled in rooms from other boarding houses:`);
      studentsInOtherRooms.forEach(student => {
        console.log(`  - ${student.full_name} in ${student.room_name} (${student.boarding_house_name})`);
      });
    } else {
      console.log('No students enrolled in rooms from other boarding houses');
    }
    
    // Check for students enrolled in non-existent rooms
    console.log('\n🔍 Students enrolled in non-existent rooms:');
    const [studentsInNonExistentRooms] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        se.room_id
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.boarding_house_id = ? AND r.id IS NULL AND s.deleted_at IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    if (studentsInNonExistentRooms.length > 0) {
      console.log(`Found ${studentsInNonExistentRooms.length} students enrolled in non-existent rooms:`);
      studentsInNonExistentRooms.forEach(student => {
        console.log(`  - ${student.full_name} (Room ID: ${student.room_id})`);
      });
    } else {
      console.log('No students enrolled in non-existent rooms');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugStudentEnrollments();
