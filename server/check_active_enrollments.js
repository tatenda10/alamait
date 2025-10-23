const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkActiveEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking active enrollments...');
    
    // Get St Kilda boarding house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`🏠 St Kilda house ID: ${stKildaId}`);
    
    // Check all enrollments for St Kilda (including deleted ones)
    const [allEnrollments] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
      FROM student_enrollments 
      WHERE boarding_house_id = ?
    `, [stKildaId]);
    
    console.log(`📋 All enrollments for St Kilda:`, allEnrollments[0]);
    
    // Check active enrollments
    const [activeEnrollments] = await connection.execute(`
      SELECT 
        se.id,
        se.student_id,
        s.full_name,
        se.room_id,
        r.name as room_name,
        se.deleted_at
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      WHERE se.boarding_house_id = ? AND se.deleted_at IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n👥 Active enrollments (${activeEnrollments.length}):`);
    activeEnrollments.forEach(enrollment => {
      console.log(`  - ${enrollment.full_name} in ${enrollment.room_name}`);
    });
    
    // Check if there are students without enrollments
    const [studentsWithoutEnrollments] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL AND se.id IS NULL
      ORDER BY s.full_name
    `, [stKildaId]);
    
    console.log(`\n❌ Students without active enrollments (${studentsWithoutEnrollments.length}):`);
    studentsWithoutEnrollments.forEach(student => {
      console.log(`  - ${student.full_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkActiveEnrollments();
