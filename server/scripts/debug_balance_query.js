const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugBalanceQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Debugging balance query...');
    
    // Test the exact query for creditors (negative balances)
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
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance ASC
    `);
    
    console.log(`Found ${creditors.length} students with negative balances (credits)`);
    
    if (creditors.length > 0) {
      console.log('\nFirst 5 students with credits:');
      creditors.slice(0, 5).forEach(student => {
        console.log(`${student.student_name}: ${student.current_balance} (${typeof student.current_balance})`);
      });
      
      // Calculate total credit (should be positive)
      const totalCredit = Math.abs(creditors.reduce((sum, creditor) => sum + parseFloat(creditor.current_balance), 0));
      console.log(`\nTotal Credit Amount: $${totalCredit.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

debugBalanceQuery();
