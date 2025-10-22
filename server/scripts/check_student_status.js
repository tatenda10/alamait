const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStudentStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check student statuses
    const [studentStatuses] = await connection.execute('SELECT DISTINCT status FROM students WHERE deleted_at IS NULL');
    console.log('Student statuses:', studentStatuses.map(s => s.status));
    
    // Check balances with student status
    const [balancesWithStatus] = await connection.execute(`
      SELECT 
        s.status,
        COUNT(*) as count,
        MIN(sab.current_balance) as min_balance,
        MAX(sab.current_balance) as max_balance,
        AVG(sab.current_balance) as avg_balance
      FROM student_account_balances sab
      JOIN students s ON sab.student_id = s.id
      WHERE sab.deleted_at IS NULL AND s.deleted_at IS NULL
      GROUP BY s.status
    `);
    
    console.log('Balances by student status:');
    console.table(balancesWithStatus);
    
    // Check for negative balances specifically
    const [negativeBalances] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM student_account_balances 
      WHERE current_balance < 0 AND deleted_at IS NULL
    `);
    
    console.log('Negative balances count:', negativeBalances[0].count);
    
    // Check for positive balances specifically
    const [positiveBalances] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM student_account_balances 
      WHERE current_balance > 0 AND deleted_at IS NULL
    `);
    
    console.log('Positive balances count:', positiveBalances[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkStudentStatus();
