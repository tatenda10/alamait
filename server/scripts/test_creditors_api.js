const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCreditorsAPI() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Testing creditors API logic...');
    
    // Test the exact query from the backend
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
    `);
    
    console.log(`Found ${creditors.length} creditors`);
    
    // Test summary calculation
    const totalCredit = creditors.reduce((sum, creditor) => sum + parseFloat(creditor.current_balance), 0);
    const highCreditAccounts = creditors.filter(c => parseFloat(c.current_balance) > 1000).length;
    const inactiveAccounts = creditors.filter(c => parseFloat(c.current_balance) > 0).length; // This should be different logic
    const avgCreditBalance = creditors.length > 0 
      ? Math.round(creditors.reduce((sum, c) => sum + parseFloat(c.current_balance), 0) / creditors.length)
      : 0;
    
    console.log('Summary calculation:');
    console.log('Total Credit:', totalCredit);
    console.log('High Credit Accounts:', highCreditAccounts);
    console.log('Inactive Accounts:', inactiveAccounts);
    console.log('Avg Credit Balance:', avgCreditBalance);
    console.log('Total Creditors:', creditors.length);
    
    // Check data types
    console.log('\nData type check:');
    creditors.slice(0, 3).forEach(creditor => {
      console.log(`${creditor.student_name}: ${creditor.current_balance} (type: ${typeof creditor.current_balance})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testCreditorsAPI();
