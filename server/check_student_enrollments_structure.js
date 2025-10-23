const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudentEnrollmentsStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking student_enrollments table structure...');
    
    // Check table structure
    const [structure] = await connection.execute(`
      DESCRIBE student_enrollments
    `);
    
    console.log('📋 student_enrollments table structure:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check if boarding_house_id column exists
    const hasBoardingHouseId = structure.some(col => col.Field === 'boarding_house_id');
    console.log(`\n🏠 Has boarding_house_id column: ${hasBoardingHouseId}`);
    
    // Check sample data
    const [sampleData] = await connection.execute(`
      SELECT * FROM student_enrollments LIMIT 3
    `);
    
    console.log('\n📊 Sample student_enrollments data:');
    console.log(JSON.stringify(sampleData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStudentEnrollmentsStructure();
