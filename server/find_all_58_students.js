const mysql = require('mysql2/promise');
require('dotenv').config();

async function findAll58Students() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Finding all 58 students in St Kilda...');
    
    // Get St Kilda boarding house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`🏠 St Kilda house ID: ${stKildaId}`);
    
    // Get all students in St Kilda boarding house
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
    
    // Group by enrollment status
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
    
    // Check if there are students in other boarding houses that should be in St Kilda
    console.log('\n🔍 Checking for students in other boarding houses...');
    
    const [otherBoardingHouses] = await connection.execute(`
      SELECT 
        bh.id,
        bh.name,
        COUNT(s.id) as student_count
      FROM boarding_houses bh
      LEFT JOIN students s ON bh.id = s.boarding_house_id AND s.deleted_at IS NULL
      WHERE bh.id != ? AND bh.deleted_at IS NULL
      GROUP BY bh.id, bh.name
      HAVING COUNT(s.id) > 0
      ORDER BY bh.name
    `, [stKildaId]);
    
    console.log('Other boarding houses with students:');
    otherBoardingHouses.forEach(bh => {
      console.log(`  - ${bh.name}: ${bh.student_count} students`);
    });
    
    // Check if there are students without boarding house assignments
    const [studentsWithoutBoardingHouse] = await connection.execute(`
      SELECT 
        s.id,
        s.full_name,
        s.status
      FROM students s
      WHERE s.boarding_house_id IS NULL AND s.deleted_at IS NULL
      ORDER BY s.full_name
    `);
    
    if (studentsWithoutBoardingHouse.length > 0) {
      console.log(`\n⚠️  Students without boarding house assignments (${studentsWithoutBoardingHouse.length}):`);
      studentsWithoutBoardingHouse.forEach(student => {
        console.log(`  - ${student.full_name} (ID: ${student.id}) - Status: ${student.status}`);
      });
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total students in St Kilda: ${allStudents.length}`);
    console.log(`  Enrolled students: ${enrolledStudents.length}`);
    console.log(`  Non-enrolled students: ${nonEnrolledStudents.length}`);
    console.log(`  Students in other boarding houses: ${otherBoardingHouses.reduce((sum, bh) => sum + bh.student_count, 0)}`);
    console.log(`  Students without boarding house: ${studentsWithoutBoardingHouse.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

findAll58Students();
