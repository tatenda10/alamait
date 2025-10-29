require('dotenv').config();
const mysql = require('mysql2/promise');

async function testCreditorsReport() {
  console.log('🔍 Testing Creditors Report Query...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // This is the EXACT query from the creditors report controller
    console.log('📋 Running Creditors Report Query (from controller):');
    const [creditors] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        se.admin_fee,
        se.security_deposit,
        se.start_date as enrollment_start,
        se.expected_end_date as enrollment_end,
        r.name as room_number,
        bh.name as boarding_house_name,
        s.status as student_status,
        sab.current_balance,
        sab.updated_at as last_balance_update
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC, bh.name, s.full_name
    `);

    console.log(`\n✅ Found ${creditors.length} creditors`);
    
    if (creditors.length > 0) {
      console.table(creditors);
      const total = creditors.reduce((sum, c) => sum + parseFloat(c.current_balance), 0);
      console.log(`\n💰 Total Creditors (Prepayments): $${total.toFixed(2)}`);
    } else {
      console.log('\n❌ No creditors found!');
      console.log('\n🔍 Let me check what might be wrong...\n');
      
      // Check if students exist
      const [studentCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL
      `);
      console.log(`Total Students: ${studentCount[0].count}`);
      
      // Check if enrollments exist
      const [enrollmentCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM student_enrollments WHERE deleted_at IS NULL
      `);
      console.log(`Total Enrollments: ${enrollmentCount[0].count}`);
      
      // Check if positive balances exist
      const [positiveBalances] = await connection.execute(`
        SELECT COUNT(*) as count, SUM(current_balance) as total
        FROM student_account_balances 
        WHERE current_balance > 0 AND deleted_at IS NULL
      `);
      console.log(`Positive Balances: ${positiveBalances[0].count} ($${parseFloat(positiveBalances[0].total || 0).toFixed(2)})`);
      
      // Check the JOIN issue - see where it breaks down
      console.log('\n🔍 Checking JOIN breakdown:\n');
      
      const [step1] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM students s
        WHERE s.deleted_at IS NULL
          AND (s.status = 'Active' OR s.status IS NULL)
      `);
      console.log(`Step 1 - Students: ${step1[0].count}`);
      
      const [step2] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        WHERE s.deleted_at IS NULL
          AND se.deleted_at IS NULL
          AND (s.status = 'Active' OR s.status IS NULL)
          AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
      `);
      console.log(`Step 2 - Students + Enrollments: ${step2[0].count}`);
      
      const [step3] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        JOIN rooms r ON se.room_id = r.id
        WHERE s.deleted_at IS NULL
          AND se.deleted_at IS NULL
          AND (s.status = 'Active' OR s.status IS NULL)
          AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
      `);
      console.log(`Step 3 - Students + Enrollments + Rooms: ${step3[0].count}`);
      
      const [step4] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        JOIN rooms r ON se.room_id = r.id
        JOIN boarding_houses bh ON se.boarding_house_id = bh.id
        WHERE s.deleted_at IS NULL
          AND se.deleted_at IS NULL
          AND (s.status = 'Active' OR s.status IS NULL)
          AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
      `);
      console.log(`Step 4 - Students + Enrollments + Rooms + BH: ${step4[0].count}`);
      
      const [step5] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        JOIN rooms r ON se.room_id = r.id
        JOIN boarding_houses bh ON se.boarding_house_id = bh.id
        JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
        WHERE s.deleted_at IS NULL
          AND se.deleted_at IS NULL
          AND (s.status = 'Active' OR s.status IS NULL)
          AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
          AND sab.deleted_at IS NULL
      `);
      console.log(`Step 5 - Students + Enrollments + Rooms + BH + Balances: ${step5[0].count}`);
      
      const [step6] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        JOIN rooms r ON se.room_id = r.id
        JOIN boarding_houses bh ON se.boarding_house_id = bh.id
        JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
        WHERE s.deleted_at IS NULL
          AND se.deleted_at IS NULL
          AND (s.status = 'Active' OR s.status IS NULL)
          AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
          AND sab.current_balance > 0
          AND sab.deleted_at IS NULL
      `);
      console.log(`Step 6 - Final (with balance > 0): ${step6[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

testCreditorsReport();
