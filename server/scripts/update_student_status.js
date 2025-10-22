const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateStudentStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔄 Updating all students to Active status...\n');

    // First, check current status distribution
    const [currentStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM students 
      WHERE deleted_at IS NULL
      GROUP BY status
    `);
    
    console.log('📊 Current student status distribution:');
    currentStatus.forEach(row => {
      console.log(`  ${row.status || 'NULL'}: ${row.count} students`);
    });

    // Update all students to Active status
    const [updateResult] = await connection.execute(`
      UPDATE students 
      SET status = 'Active'
      WHERE deleted_at IS NULL
    `);

    console.log(`\n✅ Updated ${updateResult.affectedRows} students to 'Active' status`);

    // Verify the update
    const [newStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM students 
      WHERE deleted_at IS NULL
      GROUP BY status
    `);
    
    console.log('\n📊 New student status distribution:');
    newStatus.forEach(row => {
      console.log(`  ${row.status}: ${row.count} students`);
    });

    console.log('\n🎉 All students have been updated to Active status!');

  } catch (error) {
    console.error('❌ Error updating student status:', error);
  } finally {
    await connection.end();
  }
}

updateStudentStatus();
