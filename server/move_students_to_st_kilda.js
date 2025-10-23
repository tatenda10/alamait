const mysql = require('mysql2/promise');
require('dotenv').config();

async function moveStudentsToStKilda() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔄 Moving students from "test" boarding house to "St Kilda"...');
    
    // Get students currently in "test" house
    const [studentsInTest] = await connection.execute(`
      SELECT s.id, s.full_name, s.status
      FROM students s 
      JOIN boarding_houses bh ON s.boarding_house_id = bh.id
      WHERE bh.name = 'test'
      ORDER BY s.full_name
    `);
    
    console.log(`\n📋 Found ${studentsInTest.length} students in "test" house:`);
    studentsInTest.forEach(student => {
      console.log(`  - ${student.full_name} (ID: ${student.id})`);
    });

    if (studentsInTest.length === 0) {
      console.log('✅ No students found in "test" house. Nothing to move.');
      return;
    }

    // Get St Kilda house ID
    const [stKildaHouse] = await connection.execute(`
      SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
    `);
    
    if (stKildaHouse.length === 0) {
      console.log('❌ St Kilda boarding house not found!');
      return;
    }
    
    const stKildaId = stKildaHouse[0].id;
    console.log(`\n🏠 St Kilda house ID: ${stKildaId}`);

    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Update students to St Kilda
      const studentIds = studentsInTest.map(s => s.id);
      const placeholders = studentIds.map(() => '?').join(',');
      
      const [updateResult] = await connection.execute(`
        UPDATE students 
        SET boarding_house_id = ?
        WHERE id IN (${placeholders})
      `, [stKildaId, ...studentIds]);
      
      console.log(`\n✅ Successfully moved ${updateResult.affectedRows} students to St Kilda`);
      
      // Verify the move
      const [movedStudents] = await connection.execute(`
        SELECT s.id, s.full_name, bh.name as boarding_house_name
        FROM students s 
        JOIN boarding_houses bh ON s.boarding_house_id = bh.id
        WHERE s.id IN (${placeholders})
        ORDER BY s.full_name
      `, [...studentIds]);
      
      console.log('\n📋 Verification - Students now in St Kilda:');
      movedStudents.forEach(student => {
        console.log(`  - ${student.full_name} (ID: ${student.id}) - ${student.boarding_house_name}`);
      });
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 Transaction committed successfully!');
      
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

moveStudentsToStKilda();
