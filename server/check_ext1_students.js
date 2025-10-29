require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkEXT1Students() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get count
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND r.name = 'EXT1'
    `);

    console.log(`\n🏠 EXT1 has ${countResult[0].total} student(s)\n`);

    // Get student list
    const [students] = await connection.execute(`
      SELECT 
        s.full_name,
        r.name as room,
        sab.current_balance as balance
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND r.name = 'EXT1'
      ORDER BY s.full_name
    `);

    console.table(students);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkEXT1Students();


