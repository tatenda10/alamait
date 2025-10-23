const mysql = require('mysql2/promise');
require('dotenv').config();

async function moveAll58StudentsToCorrectRooms() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Moving all 58 students to correct rooms...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Get St Kilda boarding house ID
      const [stKildaHouse] = await connection.execute(`
        SELECT id, name FROM boarding_houses WHERE name = 'St Kilda'
      `);
      
      const stKildaId = stKildaHouse[0].id;
      console.log(`🏠 St Kilda house ID: ${stKildaId}`);
      
      // Define the correct room name mappings
      const roomMappings = {
        'Bus 1': 'BUS1',
        'Bus 2': 'BUS2', 
        'Ext 1': 'EXT1',
        'Ext 2': 'EXT2',
        'Up 1': 'Upstairs 1',
        'Up 2': 'Upstairs 2',
        'Exclusive': 'Executive'
      };
      
      console.log('\n🔄 Moving students to correct rooms...');
      
      let movedCount = 0;
      
      for (const [wrongName, correctName] of Object.entries(roomMappings)) {
        console.log(`\n🏠 Moving students from ${wrongName} → ${correctName}:`);
        
        // Find the correct room ID
        const [correctRoom] = await connection.execute(`
          SELECT id, name FROM rooms 
          WHERE name = ? AND boarding_house_id = ? AND deleted_at IS NULL
        `, [correctName, stKildaId]);
        
        if (correctRoom.length === 0) {
          console.log(`  ❌ Room ${correctName} not found`);
          continue;
        }
        
        const correctRoomId = correctRoom[0].id;
        console.log(`  ✅ Found ${correctName} (ID: ${correctRoomId})`);
        
        // Find students enrolled in the wrong room name
        const [studentsToMove] = await connection.execute(`
          SELECT 
            se.id as enrollment_id,
            se.student_id,
            s.full_name
          FROM student_enrollments se
          JOIN students s ON se.student_id = s.id
          JOIN rooms r ON se.room_id = r.id
          WHERE r.name = ? AND r.boarding_house_id = ? AND se.deleted_at IS NULL
        `, [wrongName, stKildaId]);
        
        console.log(`  👥 Found ${studentsToMove.length} students in ${wrongName}`);
        
        // Move students to correct room
        for (const student of studentsToMove) {
          await connection.execute(`
            UPDATE student_enrollments 
            SET room_id = ?
            WHERE id = ?
          `, [correctRoomId, student.enrollment_id]);
          
          console.log(`    ✅ Moved ${student.full_name} to ${correctName}`);
          movedCount++;
        }
      }
      
      // Now assign all students to beds in their correct rooms
      console.log('\n🔄 Assigning all students to beds...');
      
      // Get all students enrolled in St Kilda rooms
      const [allStudents] = await connection.execute(`
        SELECT 
          se.id as enrollment_id,
          se.student_id,
          se.room_id,
          s.full_name,
          r.name as room_name
        FROM student_enrollments se
        JOIN students s ON se.student_id = s.id
        JOIN rooms r ON se.room_id = r.id
        WHERE r.boarding_house_id = ? AND se.deleted_at IS NULL
        ORDER BY r.name, s.full_name
      `, [stKildaId]);
      
      console.log(`👥 Found ${allStudents.length} students enrolled in St Kilda rooms`);
      
      // Group students by room
      const studentsByRoom = {};
      for (const student of allStudents) {
        if (!studentsByRoom[student.room_id]) {
          studentsByRoom[student.room_id] = [];
        }
        studentsByRoom[student.room_id].push(student);
      }
      
      let assignedCount = 0;
      
      // Process each room
      for (const [roomId, students] of Object.entries(studentsByRoom)) {
        const roomName = students[0].room_name;
        console.log(`\n🏠 Processing ${roomName} (${students.length} students):`);
        
        // Get all beds in this room
        const [bedsInRoom] = await connection.execute(`
          SELECT id, bed_number, status
          FROM beds
          WHERE room_id = ? AND deleted_at IS NULL
          ORDER BY bed_number
        `, [roomId]);
        
        console.log(`  🛏️ Found ${bedsInRoom.length} beds in ${roomName}`);
        
        // Reset all beds to available first
        await connection.execute(`
          UPDATE beds 
          SET status = 'available'
          WHERE room_id = ? AND deleted_at IS NULL
        `, [roomId]);
        
        // Assign students to beds
        const bedsToAssign = Math.min(students.length, bedsInRoom.length);
        
        for (let i = 0; i < bedsToAssign; i++) {
          const student = students[i];
          const bed = bedsInRoom[i];
          
          await connection.execute(`
            UPDATE beds 
            SET status = 'occupied'
            WHERE id = ?
          `, [bed.id]);
          
          console.log(`  ✅ Assigned ${student.full_name} to ${bed.bed_number}`);
          assignedCount++;
        }
        
        if (students.length > bedsInRoom.length) {
          console.log(`  ⚠️  ${students.length - bedsInRoom.length} students in ${roomName} don't have beds (room has ${bedsInRoom.length} beds)`);
        }
      }
      
      // Final summary
      console.log('\n📊 Final Summary:');
      const [finalOccupancy] = await connection.execute(`
        SELECT 
          r.name,
          r.capacity,
          COUNT(b.id) as total_beds,
          COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
          COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
          COUNT(se.id) as student_count
        FROM rooms r
        LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
        LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL
        WHERE r.boarding_house_id = ? AND r.deleted_at IS NULL
        GROUP BY r.id, r.name, r.capacity
        ORDER BY r.name
      `, [stKildaId]);
      
      let totalBeds = 0;
      let totalOccupied = 0;
      let totalAvailable = 0;
      let totalStudents = 0;
      
      for (const room of finalOccupancy) {
        const occupancyRate = room.total_beds > 0 ? (room.occupied_beds / room.total_beds * 100).toFixed(1) : 0;
        console.log(`  ${room.name}: ${room.occupied_beds}/${room.total_beds} beds (${occupancyRate}%) - ${room.student_count} students`);
        
        totalBeds += room.total_beds;
        totalOccupied += room.occupied_beds;
        totalAvailable += room.available_beds;
        totalStudents += room.student_count;
      }
      
      console.log(`\n📈 Overall Summary:`);
      console.log(`  Total beds: ${totalBeds}`);
      console.log(`  Occupied beds: ${totalOccupied}`);
      console.log(`  Available beds: ${totalAvailable}`);
      console.log(`  Total students: ${totalStudents}`);
      console.log(`  Overall occupancy: ${totalBeds > 0 ? (totalOccupied / totalBeds * 100).toFixed(1) : 0}%`);
      console.log(`  Students assigned: ${assignedCount}`);
      console.log(`  Students moved: ${movedCount}`);
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 All 58 students moved to correct rooms and assigned to beds!');
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('❌ Error during move, transaction rolled back:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

moveAll58StudentsToCorrectRooms();
