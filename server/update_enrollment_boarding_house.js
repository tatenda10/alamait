const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateEnrollmentBoardingHouse() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Updating enrollment boarding house for St Kilda students...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Get boarding house IDs
      const [stKildaHouse] = await connection.execute(`
        SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
      `);
      
      const [testHouse] = await connection.execute(`
        SELECT id, name FROM boarding_houses WHERE name = 'test'
      `);
      
      const stKildaId = stKildaHouse[0].id;
      const testId = testHouse[0].id;
      
      console.log(`🏠 St Kilda house ID: ${stKildaId}`);
      console.log(`🏠 Test house ID: ${testId}`);
      
      // Find students who are in St Kilda boarding house but have enrollments in test boarding house
      const [studentsToUpdate] = await connection.execute(`
        SELECT 
          s.id,
          s.full_name,
          se.id as enrollment_id,
          se.room_id,
          r.name as room_name
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
        JOIN rooms r ON se.room_id = r.id
        WHERE s.boarding_house_id = ? AND se.boarding_house_id = ?
        ORDER BY s.full_name
      `, [stKildaId, testId]);
      
      console.log(`👥 Found ${studentsToUpdate.length} students with enrollments in test boarding house`);
      
      if (studentsToUpdate.length === 0) {
        console.log('✅ No students need enrollment updates');
        await connection.commit();
        return;
      }
      
      // Update the boarding_house_id in their enrollments
      let updatedCount = 0;
      
      for (const student of studentsToUpdate) {
        await connection.execute(`
          UPDATE student_enrollments 
          SET boarding_house_id = ?
          WHERE id = ?
        `, [stKildaId, student.enrollment_id]);
        
        console.log(`  ✅ Updated enrollment for ${student.full_name} in ${student.room_name}`);
        updatedCount++;
      }
      
      // Final verification
      const [finalCount] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM student_enrollments 
        WHERE boarding_house_id = ? AND deleted_at IS NULL
      `, [stKildaId]);
      
      console.log(`\n📊 Final enrollment count for St Kilda: ${finalCount[0].count}`);
      console.log(`✅ Updated ${updatedCount} enrollments`);
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 All enrollment boarding house updates completed successfully!');
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('❌ Error during update, transaction rolled back:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateEnrollmentBoardingHouse();
