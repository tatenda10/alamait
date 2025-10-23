const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugDashboardStudents() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Debugging dashboard student count...');
    
    // Get St Kilda boarding house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`🏠 St Kilda house ID: ${stKildaId}`);
    
    // Check students in St Kilda boarding house
    const [studentsInBoardingHouse] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM students 
      WHERE boarding_house_id = ? AND deleted_at IS NULL
    `, [stKildaId]);
    
    console.log(`👥 Students in St Kilda boarding house: ${studentsInBoardingHouse[0].count}`);
    
    // Check student enrollments in St Kilda rooms
    const [enrollmentsInStKildaRooms] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM student_enrollments se
      JOIN rooms r ON se.room_id = r.id
      WHERE r.boarding_house_id = ? AND se.deleted_at IS NULL AND se.checkout_date IS NULL
    `, [stKildaId]);
    
    console.log(`📋 Student enrollments in St Kilda rooms: ${enrollmentsInStKildaRooms[0].count}`);
    
    // Check what the dashboard query is actually counting
    const [dashboardQuery] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_students
      FROM student_enrollments 
      WHERE boarding_house_id = ? 
      AND deleted_at IS NULL 
      AND checkout_date IS NULL
    `, [stKildaId]);
    
    console.log(`📊 Dashboard query result:`, dashboardQuery[0]);
    
    // Check if there are students enrolled in rooms from other boarding houses
    const [studentsInOtherRooms] = await connection.execute(`
      SELECT 
        COUNT(*) as count,
        GROUP_CONCAT(DISTINCT r.boarding_house_id) as other_boarding_houses
      FROM student_enrollments se
      JOIN rooms r ON se.room_id = r.id
      WHERE se.student_id IN (
        SELECT id FROM students WHERE boarding_house_id = ?
      ) AND r.boarding_house_id != ? AND se.deleted_at IS NULL
    `, [stKildaId, stKildaId]);
    
    console.log(`🔄 Students from St Kilda enrolled in other boarding house rooms: ${studentsInOtherRooms[0].count}`);
    if (studentsInOtherRooms[0].other_boarding_houses) {
      console.log(`   Other boarding house IDs: ${studentsInOtherRooms[0].other_boarding_houses}`);
    }
    
    // Check the actual student enrollments for St Kilda students
    const [stKildaStudentEnrollments] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        se.room_id,
        r.name as room_name,
        r.boarding_house_id as room_boarding_house_id,
        bh.name as room_boarding_house_name
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n👥 St Kilda students and their enrollments:`);
    stKildaStudentEnrollments.forEach(student => {
      const enrollmentInfo = student.room_name ? 
        `${student.room_name} (${student.room_boarding_house_name})` : 
        'No enrollment';
      console.log(`  - ${student.full_name}: ${enrollmentInfo}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugDashboardStudents();
