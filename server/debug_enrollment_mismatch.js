const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugEnrollmentMismatch() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Debugging enrollment mismatch...');
    
    // Get St Kilda boarding house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`🏠 St Kilda house ID: ${stKildaId}`);
    
    // Count students in St Kilda boarding house
    const [studentCount] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM students 
      WHERE boarding_house_id = ? AND deleted_at IS NULL
    `, [stKildaId]);
    
    console.log(`👥 Students in St Kilda boarding house: ${studentCount[0].count}`);
    
    // Count active enrollments for St Kilda
    const [enrollmentCount] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM student_enrollments 
      WHERE boarding_house_id = ? AND deleted_at IS NULL
    `, [stKildaId]);
    
    console.log(`📋 Active enrollments for St Kilda: ${enrollmentCount[0].count}`);
    
    // Check if there are students with enrollments in other boarding houses
    const [studentsWithOtherEnrollments] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        se.boarding_house_id,
        bh.name as boarding_house_name
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE s.boarding_house_id = ? AND se.boarding_house_id != ?
      ORDER BY s.full_name
    `, [stKildaId, stKildaId]);
    
    console.log(`\n🔄 Students with enrollments in other boarding houses (${studentsWithOtherEnrollments.length}):`);
    studentsWithOtherEnrollments.forEach(student => {
      console.log(`  - ${student.full_name} enrolled in ${student.boarding_house_name}`);
    });
    
    // Check if there are students with no enrollments at all
    const [studentsWithNoEnrollments] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL AND se.id IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n❌ Students with no enrollments at all (${studentsWithNoEnrollments.length}):`);
    studentsWithNoEnrollments.forEach(student => {
      console.log(`  - ${student.full_name}`);
    });
    
    // Check if there are students with multiple enrollments
    const [studentsWithMultipleEnrollments] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        COUNT(se.id) as enrollment_count
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      WHERE s.boarding_house_id = ?
      GROUP BY s.id, s.full_name
      HAVING COUNT(se.id) > 1
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n🔄 Students with multiple enrollments (${studentsWithMultipleEnrollments.length}):`);
    studentsWithMultipleEnrollments.forEach(student => {
      console.log(`  - ${student.full_name}: ${student.enrollment_count} enrollments`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugEnrollmentMismatch();
