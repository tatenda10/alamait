const mysql = require('mysql2/promise');
require('dotenv').config();

async function createMissingEnrollments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Creating missing enrollments for St Kilda students...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Get St Kilda boarding house ID
      const [stKildaHouse] = await connection.execute(`
        SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
      `);
      
      const stKildaId = stKildaHouse[0].id;
      console.log(`🏠 St Kilda house ID: ${stKildaId}`);
      
      // Find students in St Kilda who don't have active enrollments
      const [studentsWithoutEnrollments] = await connection.execute(`
        SELECT 
          s.id,
          s.full_name
        FROM students s
        LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
        WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL AND se.id IS NULL
        ORDER BY s.full_name
      `, [stKildaId]);
      
      console.log(`👥 Found ${studentsWithoutEnrollments.length} students without active enrollments`);
      
      if (studentsWithoutEnrollments.length === 0) {
        console.log('✅ All students already have active enrollments');
        await connection.commit();
        return;
      }
      
      // Create enrollments for these students
      let createdCount = 0;
      
      for (const student of studentsWithoutEnrollments) {
        // Find which room this student should be in (from our previous assignment)
        // We need to check which room has a bed assigned to this student
        const [bedAssignment] = await connection.execute(`
          SELECT b.room_id, r.name as room_name, r.price_per_bed
          FROM beds b
          JOIN rooms r ON b.room_id = r.id
          WHERE b.student_id = ? AND b.deleted_at IS NULL
        `, [student.id]);
        
        if (bedAssignment.length === 0) {
          console.log(`  ❌ No bed assignment found for ${student.full_name}`);
          continue;
        }
        
        const bed = bedAssignment[0];
        
        // Create enrollment
        await connection.execute(`
          INSERT INTO student_enrollments (
            student_id,
            room_id,
            boarding_house_id,
            start_date,
            expected_end_date,
            agreed_amount,
            currency,
            admin_fee,
            security_deposit,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          student.id,
          bed.room_id,
          stKildaId,
          new Date().toISOString().split('T')[0], // Today's date
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
          bed.price_per_bed || 0,
          'USD',
          20.00, // Default admin fee
          0.00  // Default security deposit
        ]);
        
        console.log(`  ✅ Created enrollment for ${student.full_name} in ${bed.room_name}`);
        createdCount++;
      }
      
      // Final verification
      const [finalCount] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM student_enrollments 
        WHERE boarding_house_id = ? AND deleted_at IS NULL
      `, [stKildaId]);
      
      console.log(`\n📊 Final enrollment count: ${finalCount[0].count}`);
      console.log(`✅ Created ${createdCount} new enrollments`);
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 All missing enrollments created successfully!');
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('❌ Error during enrollment creation, transaction rolled back:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createMissingEnrollments();
