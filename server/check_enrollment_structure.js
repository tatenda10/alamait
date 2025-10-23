const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEnrollmentStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking student_enrollments table structure...');
    
    // Check table structure
    const [structure] = await connection.execute('DESCRIBE student_enrollments');
    console.log('\n📋 student_enrollments table structure:');
    structure.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check sample data
    const [sampleData] = await connection.execute(`
      SELECT * FROM student_enrollments 
      WHERE deleted_at IS NULL 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample enrollment data:');
    sampleData.forEach((row, index) => {
      console.log(`\nEnrollment ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
    // Check if there are any bed assignments
    const [bedAssignments] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM student_enrollments 
      WHERE bed_id IS NOT NULL AND deleted_at IS NULL
    `);
    
    console.log(`\n📊 Students with bed assignments: ${bedAssignments[0].count}`);
    
    // Check rooms with enrollments
    const [roomEnrollments] = await connection.execute(`
      SELECT 
        r.id,
        r.name,
        COUNT(se.id) as enrollment_count,
        COUNT(b.id) as bed_count
      FROM rooms r
      LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
      GROUP BY r.id, r.name
      HAVING COUNT(se.id) > 0
      ORDER BY enrollment_count DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Top 10 rooms with enrollments:');
    roomEnrollments.forEach(room => {
      console.log(`  ${room.name}: ${room.enrollment_count} enrollments, ${room.bed_count} beds`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkEnrollmentStructure();
