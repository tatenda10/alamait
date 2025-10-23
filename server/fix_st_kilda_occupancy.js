const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixStKildaOccupancy() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Fixing St Kilda room occupancy issues...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Issue 1: M1 has 3 occupied beds but 0 student enrollments
      console.log('\n🏠 Fixing M1 (ID: 23) - beds should be available:');
      const [m1Beds] = await connection.execute(`
        UPDATE beds 
        SET status = 'available'
        WHERE room_id = 23 AND deleted_at IS NULL
      `);
      console.log(`✅ Updated ${m1Beds.affectedRows} beds in M1 to available`);
      
      // Issue 2: EXT1 has 11 students but only 6 beds - need to move excess students
      console.log('\n🏠 Fixing EXT1 (ID: 16) - moving excess students:');
      
      // Get students in EXT1
      const [ext1Students] = await connection.execute(`
        SELECT se.id, se.student_id, s.full_name
        FROM student_enrollments se
        JOIN students s ON se.student_id = s.id
        WHERE se.room_id = 16 AND se.deleted_at IS NULL
        ORDER BY se.id
      `);
      
      console.log(`Found ${ext1Students.length} students in EXT1`);
      
      // Keep first 6 students in EXT1, move the rest to available rooms
      if (ext1Students.length > 6) {
        const studentsToMove = ext1Students.slice(6); // Students 7-11
        console.log(`Moving ${studentsToMove.length} excess students from EXT1`);
        
        // Find available rooms with capacity
        const [availableRooms] = await connection.execute(`
          SELECT 
            r.id,
            r.name,
            r.capacity,
            COUNT(b.id) as total_beds,
            COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds
          FROM rooms r
          LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
          WHERE r.boarding_house_id = 4 
            AND r.deleted_at IS NULL
            AND r.id != 16
          GROUP BY r.id, r.name, r.capacity
          HAVING COUNT(CASE WHEN b.status = 'available' THEN 1 END) > 0
          ORDER BY available_beds DESC
        `);
        
        console.log(`Found ${availableRooms.length} rooms with available beds`);
        
        let studentIndex = 0;
        for (const room of availableRooms) {
          if (studentIndex >= studentsToMove.length) break;
          
          const studentsForThisRoom = Math.min(room.available_beds, studentsToMove.length - studentIndex);
          console.log(`Moving ${studentsForThisRoom} students to ${room.name}`);
          
          for (let i = 0; i < studentsForThisRoom; i++) {
            const student = studentsToMove[studentIndex];
            await connection.execute(`
              UPDATE student_enrollments 
              SET room_id = ?
              WHERE id = ?
            `, [room.id, student.id]);
            
            console.log(`  - Moved ${student.full_name} to ${room.name}`);
            studentIndex++;
          }
        }
      }
      
      // Issue 3: Upstairs 1 has 2 students but only 1 bed - move 1 student
      console.log('\n🏠 Fixing Upstairs 1 (ID: 24) - moving excess student:');
      
      const [upstairs1Students] = await connection.execute(`
        SELECT se.id, se.student_id, s.full_name
        FROM student_enrollments se
        JOIN students s ON se.student_id = s.id
        WHERE se.room_id = 24 AND se.deleted_at IS NULL
        ORDER BY se.id
      `);
      
      if (upstairs1Students.length > 1) {
        const studentToMove = upstairs1Students[1]; // Second student
        console.log(`Moving ${studentToMove.full_name} from Upstairs 1`);
        
        // Find a room with available beds
        const [targetRoom] = await connection.execute(`
          SELECT 
            r.id,
            r.name,
            COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds
          FROM rooms r
          LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
          WHERE r.boarding_house_id = 4 
            AND r.deleted_at IS NULL
            AND r.id != 24
          GROUP BY r.id, r.name
          HAVING COUNT(CASE WHEN b.status = 'available' THEN 1 END) > 0
          ORDER BY available_beds DESC
          LIMIT 1
        `);
        
        if (targetRoom.length > 0) {
          await connection.execute(`
            UPDATE student_enrollments 
            SET room_id = ?
            WHERE id = ?
          `, [targetRoom[0].id, studentToMove.id]);
          
          console.log(`  - Moved ${studentToMove.full_name} to ${targetRoom[0].name}`);
        }
      }
      
      // Update bed statuses for all affected rooms
      console.log('\n🔄 Updating bed statuses for all affected rooms...');
      
      const [allRooms] = await connection.execute(`
        SELECT 
          r.id,
          r.name,
          COUNT(se.id) as enrollment_count,
          COUNT(b.id) as total_beds
        FROM rooms r
        LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL
        LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
        WHERE r.boarding_house_id = 4 AND r.deleted_at IS NULL
        GROUP BY r.id, r.name
        HAVING COUNT(se.id) > 0
        ORDER BY r.name
      `);
      
      for (const room of allRooms) {
        const bedsToOccupy = Math.min(room.enrollment_count, room.total_beds);
        
        if (bedsToOccupy > 0) {
          // Set first N beds to occupied
          await connection.execute(`
            UPDATE beds 
            SET status = 'occupied'
            WHERE room_id = ? AND deleted_at IS NULL
            ORDER BY bed_number
            LIMIT ${bedsToOccupy}
          `, [room.id]);
          
          // Set remaining beds to available
          await connection.execute(`
            UPDATE beds 
            SET status = 'available'
            WHERE room_id = ? AND deleted_at IS NULL
            ORDER BY bed_number
            LIMIT 999999 OFFSET ${bedsToOccupy}
          `, [room.id]);
          
          console.log(`✅ Updated ${room.name}: ${bedsToOccupy}/${room.total_beds} beds occupied`);
        }
      }
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 All fixes applied successfully!');
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('❌ Error during fix, transaction rolled back:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixStKildaOccupancy();
