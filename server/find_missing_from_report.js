require('dotenv').config();
const mysql = require('mysql2/promise');

async function findMissingFromReport() {
  console.log('🔍 Finding Students That Should Be In Report But Are Not...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Students marked as "Should Be In Report"
    const shouldBeInReport = [
      { student_id: 151, name: 'Alicia Mutamuko', enrollment_id: 151, balance: 200 },
      { student_id: 143, name: 'Christine Mutsikwa', enrollment_id: 143, balance: 180 },
      { student_id: 144, name: 'Bertha Mwangu', enrollment_id: 144, balance: 180 },
      { student_id: 153, name: 'Bertha Majoni', enrollment_id: 153, balance: 180 },
      { student_id: 178, name: 'Agape Chiware', enrollment_id: 178, balance: 180 },
      { student_id: 169, name: 'Chantelle Gora', enrollment_id: 169, balance: 110 },
      { student_id: 186, name: 'Dion sengamai', enrollment_id: 186, balance: 20 }
    ];

    for (const student of shouldBeInReport) {
      console.log(`\n━━━ ${student.name} (ID: ${student.student_id}, Enrollment: ${student.enrollment_id}) ━━━`);
      
      // Check full enrollment details
      const [enrollment] = await connection.execute(`
        SELECT 
          se.id,
          se.student_id,
          se.room_id,
          se.boarding_house_id,
          se.expected_end_date,
          se.deleted_at as enrollment_deleted,
          s.full_name,
          s.status as student_status,
          s.deleted_at as student_deleted,
          r.name as room_name,
          r.deleted_at as room_deleted,
          sab.current_balance,
          sab.deleted_at as balance_deleted
        FROM student_enrollments se
        JOIN students s ON se.student_id = s.id
        LEFT JOIN rooms r ON se.room_id = r.id
        LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
        WHERE se.id = ?
      `, [student.enrollment_id]);

      if (enrollment.length === 0) {
        console.log('   ❌ Enrollment NOT FOUND');
        continue;
      }

      const e = enrollment[0];
      
      console.log('   📋 Enrollment Details:');
      console.log(`      Student ID: ${e.student_id} (Expected: ${student.student_id})`);
      console.log(`      Full Name: ${e.full_name}`);
      console.log(`      Student Status: ${e.student_status || 'NULL'}`);
      console.log(`      Student Deleted: ${e.student_deleted ? '❌ YES' : '✅ NO'}`);
      console.log(`      Room ID: ${e.room_id || '❌ NULL'}`);
      console.log(`      Room Name: ${e.room_name || '❌ NULL'}`);
      console.log(`      Room Deleted: ${e.room_deleted ? '❌ YES' : (e.room_id ? '✅ NO' : 'N/A')}`);
      console.log(`      Boarding House ID: ${e.boarding_house_id || '❌ NULL'}`);
      console.log(`      Expected End Date: ${e.expected_end_date || 'NULL (OK)'}`);
      console.log(`      Enrollment Deleted: ${e.enrollment_deleted ? '❌ YES' : '✅ NO'}`);
      console.log(`      Balance: $${e.current_balance || '❌ NULL'}`);
      console.log(`      Balance Deleted: ${e.balance_deleted ? '❌ YES' : (e.current_balance ? '✅ NO' : 'N/A')}`);

      // Check JOIN conditions
      console.log('\n   🔍 JOIN Requirements:');
      const issues = [];
      
      if (e.student_deleted) issues.push('Student is soft deleted');
      if (e.enrollment_deleted) issues.push('Enrollment is soft deleted');
      if (!e.room_id) issues.push('❌ NO ROOM ASSIGNED (JOIN will fail)');
      if (e.room_deleted) issues.push('Room is soft deleted');
      if (!e.boarding_house_id) issues.push('No boarding house assigned');
      if (e.student_status !== 'Active' && e.student_status !== null) issues.push(`Student status is '${e.student_status}' (not Active)`);
      if (e.expected_end_date && new Date(e.expected_end_date) < new Date()) issues.push('Enrollment expired');
      if (!e.current_balance || parseFloat(e.current_balance) <= 0) issues.push('Balance not positive');
      if (e.balance_deleted) issues.push('Balance record is soft deleted');

      if (issues.length > 0) {
        console.log('      ❌ ISSUES FOUND:');
        issues.forEach(issue => console.log(`         • ${issue}`));
      } else {
        console.log('      ✅ All requirements met - should be in report!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

findMissingFromReport();
