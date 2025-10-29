require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixChristineBalance() {
  console.log('🔧 Fixing Christine Mutsikwa balance...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Find Christine
    const [christineStudents] = await connection.execute(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        sab.current_balance
      FROM students s
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Christine%Mutsikwa%' 
        AND s.deleted_at IS NULL
    `);

    if (christineStudents.length > 0) {
      const christine = christineStudents[0];
      console.log(`Found: ${christine.full_name} (ID: ${christine.id})`);
      console.log(`Current Balance: $${christine.current_balance}`);
      console.log(`Target Balance: $0.00\n`);

      // Update all balances for Christine to 0
      await connection.execute(`
        UPDATE student_account_balances 
        SET current_balance = 0,
            updated_at = NOW() 
        WHERE student_id = ?
      `, [christine.id]);

      console.log('✅ Christine Mutsikwa balance updated to $0.00');
    } else {
      console.log('⚠️ Christine Mutsikwa not found');
    }

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixChristineBalance();

