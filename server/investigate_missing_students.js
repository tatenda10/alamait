require('dotenv').config();
const mysql = require('mysql2/promise');

async function investigateMissingStudents() {
  console.log('🔍 Investigating Why Students Are Missing From Creditors Report...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // List of students with positive balances not in creditors report
    const studentsToCheck = [
      { name: 'Agape Chiware', enrollment_id: 178, balance: 180 },
      { name: 'Bertha Majoni', enrollment_id: 153, balance: 180 },
      { name: 'Bertha Mwangu', enrollment_id: 144, balance: 180 },
      { name: 'Christine Mutsikwa', enrollment_id: 143, balance: 180 },
      { name: 'Chantelle Gora', enrollment_id: 169, balance: 110 },
      { name: 'Alicia Mutamuko', enrollment_id: 151, balance: 200 },
      { name: 'Dion sengamai', enrollment_id: 186, balance: 20 }
    ];

    console.log('🔎 Checking each student...\n');

    for (const student of studentsToCheck) {
      console.log(`\n━━━ ${student.name} (Enrollment ${student.enrollment_id}, Balance: $${student.balance}) ━━━`);
      
      // Check if enrollment exists
      const [enrollment] = await connection.execute(`
        SELECT 
          id,
          student_id,
          room_id,
          boarding_house_id,
          expected_end_date,
          deleted_at
        FROM student_enrollments
        WHERE id = ?
      `, [student.enrollment_id]);

      if (enrollment.length === 0) {
        console.log('   ❌ Enrollment NOT FOUND');
        continue;
      }

      const enroll = enrollment[0];
      console.log('   ✅ Enrollment exists:');
      console.log(`      - Student ID: ${enroll.student_id}`);
      console.log(`      - Room ID: ${enroll.room_id || '❌ NOT ASSIGNED'}`);
      console.log(`      - Boarding House ID: ${enroll.boarding_house_id || '❌ NOT ASSIGNED'}`);
      console.log(`      - Expected End Date: ${enroll.expected_end_date || 'No end date'}`);
      console.log(`      - Deleted: ${enroll.deleted_at ? '❌ YES (SOFT DELETED)' : '✅ No'}`);

      // Check student status
      const [studentInfo] = await connection.execute(`
        SELECT id, full_name, status, deleted_at
        FROM students
        WHERE id = ?
      `, [enroll.student_id]);

      if (studentInfo.length > 0) {
        const s = studentInfo[0];
        console.log('   📋 Student Info:');
        console.log(`      - Name: ${s.full_name}`);
        console.log(`      - Status: ${s.status || '❌ NULL'}`);
        console.log(`      - Deleted: ${s.deleted_at ? '❌ YES (SOFT DELETED)' : '✅ No'}`);
      }

      // Check if room exists
      if (enroll.room_id) {
        const [room] = await connection.execute(`
          SELECT id, name, deleted_at
          FROM rooms
          WHERE id = ?
        `, [enroll.room_id]);

        if (room.length > 0) {
          console.log(`   🏠 Room: ${room[0].name} ${room[0].deleted_at ? '(❌ DELETED)' : '(✅ Active)'}`);
        } else {
          console.log('   ❌ Room NOT FOUND in database');
        }
      } else {
        console.log('   ❌ NO ROOM ASSIGNED');
      }

      // Check balance record
      const [balance] = await connection.execute(`
        SELECT current_balance, deleted_at
        FROM student_account_balances
        WHERE student_id = ? AND enrollment_id = ?
      `, [enroll.student_id, student.enrollment_id]);

      if (balance.length > 0) {
        const b = balance[0];
        console.log(`   💰 Balance: $${b.current_balance} ${b.deleted_at ? '(❌ DELETED)' : '(✅ Active)'}`);
      }

      // Determine why not showing
      console.log('\n   🔍 WHY NOT IN REPORT:');
      if (enroll.deleted_at) {
        console.log('      ⚠️  Enrollment is soft deleted');
      }
      if (!enroll.room_id) {
        console.log('      ⚠️  No room assigned (required by JOIN)');
      }
      if (!enroll.boarding_house_id) {
        console.log('      ⚠️  No boarding house assigned');
      }
      if (studentInfo.length > 0 && studentInfo[0].deleted_at) {
        console.log('      ⚠️  Student is soft deleted');
      }
      if (studentInfo.length > 0 && studentInfo[0].status !== 'Active' && studentInfo[0].status !== null) {
        console.log(`      ⚠️  Student status is '${studentInfo[0].status}' (not Active)`);
      }
      if (balance.length > 0 && balance[0].deleted_at) {
        console.log('      ⚠️  Balance record is soft deleted');
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 CREDITORS REPORT REQUIREMENTS:');
    console.log('   1. Student must be Active (or NULL status)');
    console.log('   2. Student must NOT be soft deleted');
    console.log('   3. Enrollment must NOT be soft deleted');
    console.log('   4. Enrollment must have a room_id (JOIN requirement)');
    console.log('   5. Expected end date must be NULL or >= today');
    console.log('   6. Balance must be > 0');
    console.log('   7. Balance must NOT be soft deleted');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

investigateMissingStudents();
