const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking student-related tables...\n');
    
    // Check what tables exist
    const [tables] = await conn.query(`
      SHOW TABLES LIKE '%student%'
    `);
    
    console.log('Student-related tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    // Check if there's a student_transactions table or similar
    const [allTables] = await conn.query(`
      SHOW TABLES
    `);
    
    console.log('\nAll tables:');
    allTables.forEach(table => {
      const tableName = Object.values(table)[0];
      if (tableName.includes('transaction') || tableName.includes('payment')) {
        console.log(`  - ${tableName}`);
      }
    });
    
    // Check what's in the students table
    console.log('\nStudents table structure:');
    const [studentStructure] = await conn.query(`
      DESCRIBE students
    `);
    
    studentStructure.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();


