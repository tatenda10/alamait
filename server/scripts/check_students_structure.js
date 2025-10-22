const db = require('../src/services/db');

async function checkStudentsStructure() {
  const conn = await db.getConnection();
  try {
    console.log('Checking students table structure...');
    
    const [rows] = await conn.query('DESCRIBE students');
    console.log('students table structure:');
    rows.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\nChecking existing students...');
    const [students] = await conn.query('SELECT id, full_name, student_id, phone_number FROM students WHERE deleted_at IS NULL LIMIT 5');
    console.log('Sample students:');
    students.forEach(student => {
      console.log(`  ID: ${student.id}, Name: ${student.full_name}, Student ID: ${student.student_id || 'NULL'}, Phone: ${student.phone_number || 'NULL'}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkStudentsStructure();
