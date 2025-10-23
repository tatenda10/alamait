const mysql = require('mysql2/promise');
require('dotenv').config();

async function findStudentEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Finding all student enrollments...');
    
    // Get all active enrollments
    const [allEnrollments] = await connection.execute(`
      SELECT 
        se.id,
        se.student_id,
        s.full_name,
        r.name as room_name,
        r.id as room_id,
        se.start_date,
        se.deleted_at
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      WHERE se.deleted_at IS NULL
      ORDER BY r.name, s.full_name
    `);
    
    console.log(`\n📋 Found ${allEnrollments.length} active enrollments:`);
    
    // Group by room
    const roomGroups = {};
    allEnrollments.forEach(enrollment => {
      if (!roomGroups[enrollment.room_name]) {
        roomGroups[enrollment.room_name] = [];
      }
      roomGroups[enrollment.room_name].push(enrollment);
    });
    
    Object.entries(roomGroups).forEach(([roomName, enrollments]) => {
      console.log(`\n🏠 ${roomName} (${enrollments.length} students):`);
      enrollments.forEach(enrollment => {
        console.log(`  - ${enrollment.full_name} (ID: ${enrollment.student_id})`);
      });
    });
    
    // Check if there are any enrollments with deleted_at not null
    const [deletedEnrollments] = await connection.execute(`
      SELECT 
        COUNT(*) as count,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_count
      FROM student_enrollments
    `);
    
    console.log(`\n📊 Enrollment Statistics:`);
    console.log(`Total enrollments: ${deletedEnrollments[0].count}`);
    console.log(`Deleted enrollments: ${deletedEnrollments[0].deleted_count}`);
    console.log(`Active enrollments: ${allEnrollments.length}`);
    
    // Check if students are assigned to boarding houses but not rooms
    const [studentsWithoutRooms] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        bh.name as boarding_house_name
      FROM students s
      JOIN boarding_houses bh ON s.boarding_house_id = bh.id
      WHERE s.id NOT IN (
        SELECT DISTINCT student_id 
        FROM student_enrollments 
        WHERE deleted_at IS NULL
      )
      AND s.status = 'Active'
      LIMIT 10
    `);
    
    if (studentsWithoutRooms.length > 0) {
      console.log(`\n⚠️  Students without room enrollments (showing first 10):`);
      studentsWithoutRooms.forEach(student => {
        console.log(`  - ${student.full_name} (${student.boarding_house_name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

findStudentEnrollments();
