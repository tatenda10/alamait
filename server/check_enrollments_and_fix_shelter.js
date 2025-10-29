require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAndFix() {
  console.log('🔍 Checking Enrollments and Fixing Data...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // ============================================
    // PART 1: Check Bellis Mapetere enrollments
    // ============================================
    console.log('1️⃣ Checking Bellis Mapetere enrollments...\n');
    
    const [bellisEnrollments] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.full_name,
        se.id as enrollment_id,
        se.start_date,
        se.expected_end_date,
        se.agreed_amount,
        se.currency,
        se.created_at as enrollment_created,
        se.deleted_at as enrollment_deleted,
        r.name as room_name,
        bh.name as boarding_house,
        COALESCE(sab.current_balance, 0) as balance
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.full_name LIKE '%Bellis%Mapetere%'
      ORDER BY se.created_at DESC
    `);

    if (bellisEnrollments.length > 0) {
      console.log(`Found ${bellisEnrollments.length} enrollment(s) for Bellis Mapetere:\n`);
      bellisEnrollments.forEach((enr, index) => {
        console.log(`Enrollment ${index + 1}:`);
        console.log(`  Student ID: ${enr.student_number}`);
        console.log(`  Enrollment ID: ${enr.enrollment_id}`);
        console.log(`  Room: ${enr.room_name || 'N/A'}`);
        console.log(`  Boarding House: ${enr.boarding_house || 'N/A'}`);
        console.log(`  Start Date: ${enr.start_date}`);
        console.log(`  End Date: ${enr.expected_end_date || 'Open'}`);
        console.log(`  Agreed Amount: ${enr.currency} ${enr.agreed_amount}`);
        console.log(`  Balance: ${enr.balance}`);
        console.log(`  Created: ${enr.enrollment_created}`);
        console.log(`  Deleted: ${enr.enrollment_deleted || 'Active'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No enrollments found for Bellis Mapetere\n');
    }

    // ============================================
    // PART 2: Check Christine Mutsikwa enrollments
    // ============================================
    console.log('2️⃣ Checking Christine Mutsikwa enrollments...\n');
    
    const [christineEnrollments] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.full_name,
        se.id as enrollment_id,
        se.start_date,
        se.expected_end_date,
        se.agreed_amount,
        se.currency,
        se.created_at as enrollment_created,
        se.deleted_at as enrollment_deleted,
        r.name as room_name,
        bh.name as boarding_house,
        COALESCE(sab.current_balance, 0) as balance
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.full_name LIKE '%Christine%Mutsikwa%'
      ORDER BY se.created_at DESC
    `);

    if (christineEnrollments.length > 0) {
      console.log(`Found ${christineEnrollments.length} enrollment(s) for Christine Mutsikwa:\n`);
      christineEnrollments.forEach((enr, index) => {
        console.log(`Enrollment ${index + 1}:`);
        console.log(`  Student ID: ${enr.student_number}`);
        console.log(`  Enrollment ID: ${enr.enrollment_id}`);
        console.log(`  Room: ${enr.room_name || 'N/A'}`);
        console.log(`  Boarding House: ${enr.boarding_house || 'N/A'}`);
        console.log(`  Start Date: ${enr.start_date}`);
        console.log(`  End Date: ${enr.expected_end_date || 'Open'}`);
        console.log(`  Agreed Amount: ${enr.currency} ${enr.agreed_amount}`);
        console.log(`  Balance: ${enr.balance}`);
        console.log(`  Created: ${enr.enrollment_created}`);
        console.log(`  Deleted: ${enr.enrollment_deleted || 'Active'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No enrollments found for Christine Mutsikwa\n');
    }

    // ============================================
    // PART 3: Fix Shelter Masosonere balance to 0
    // ============================================
    console.log('3️⃣ Fixing Shelter Masosonere balance...\n');
    
    await connection.beginTransaction();

    const [shelterStudents] = await connection.execute(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        se.id as enrollment_id,
        COALESCE(sab.current_balance, 0) as current_balance
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.full_name LIKE '%Shelter%Masosonere%' 
        AND s.deleted_at IS NULL
    `);

    if (shelterStudents.length > 0) {
      const shelter = shelterStudents[0];
      console.log(`   Found: ${shelter.full_name} (ID: ${shelter.id}, Student ID: ${shelter.student_id})`);
      console.log(`   Current Balance: ${shelter.current_balance}`);
      console.log(`   Target Balance: 0\n`);

      if (shelter.enrollment_id) {
        // Update balance to 0
        console.log('   Updating balance to 0...');
        await connection.execute(`
          UPDATE student_account_balances 
          SET current_balance = 0,
              updated_at = NOW() 
          WHERE student_id = ? AND enrollment_id = ?
        `, [shelter.id, shelter.enrollment_id]);

        console.log('✅ Shelter Masosonere balance updated to $0.00\n');
      } else {
        console.log('   ⚠️ No enrollment found for Shelter Masosonere\n');
      }
    } else {
      console.log('   ⚠️ Shelter Masosonere not found\n');
    }

    await connection.commit();

    console.log('✅ All checks and fixes completed!\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

checkAndFix().catch(console.error);

