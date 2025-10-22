const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAPIEndpoints() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Testing API endpoints logic...');
    
    // Test debtors query (negative balances)
    console.log('\n📊 Testing Debtors Query:');
    const [debtors] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        r.name as room_number,
        bh.name as boarding_house_name,
        sab.current_balance
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance ASC
      LIMIT 5
    `);
    
    console.log(`Found ${debtors.length} debtors`);
    if (debtors.length > 0) {
      console.table(debtors);
    }
    
    // Test creditors query (positive balances)
    console.log('\n💰 Testing Creditors Query:');
    const [creditors] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        r.name as room_number,
        bh.name as boarding_house_name,
        sab.current_balance
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
      ORDER BY sab.current_balance DESC
      LIMIT 5
    `);
    
    console.log(`Found ${creditors.length} creditors`);
    if (creditors.length > 0) {
      console.table(creditors);
    }
    
    // Test summary calculations
    console.log('\n📈 Testing Summary Calculations:');
    const [summary] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN sab.current_balance < 0 THEN 1 END) as debtors_count,
        COUNT(CASE WHEN sab.current_balance > 0 THEN 1 END) as creditors_count,
        COALESCE(SUM(CASE WHEN sab.current_balance < 0 THEN sab.current_balance ELSE 0 END), 0) as total_debt,
        COALESCE(SUM(CASE WHEN sab.current_balance > 0 THEN sab.current_balance ELSE 0 END), 0) as total_credit
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      JOIN student_enrollments se ON sab.enrollment_id = se.id
      WHERE sab.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
    `);
    
    console.table(summary);
    
    console.log('\n✅ API endpoints logic is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testAPIEndpoints();
