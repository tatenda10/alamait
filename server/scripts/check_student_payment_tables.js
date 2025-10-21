const db = require('../src/services/db');

async function checkTables() {
  const conn = await db.getConnection();
  try {
    console.log('Checking existing student payment tables...\n');
    
    // Check what tables exist that might be used for student payments
    const [tables] = await conn.query(`
      SHOW TABLES LIKE '%student%'
    `);
    
    console.log('Tables with "student" in the name:');
    tables.forEach(table => {
      console.log(`  ${Object.values(table)[0]}`);
    });
    
    // Check what tables exist that might be used for payments
    const [paymentTables] = await conn.query(`
      SHOW TABLES LIKE '%payment%'
    `);
    
    console.log('\nTables with "payment" in the name:');
    paymentTables.forEach(table => {
      console.log(`  ${Object.values(table)[0]}`);
    });
    
    // Check the structure of student_payments table
    if (tables.some(t => Object.values(t)[0] === 'student_payments')) {
      console.log('\nstudent_payments table structure:');
      const [structure] = await conn.query(`
        DESCRIBE student_payments
      `);
      
      structure.forEach(column => {
        console.log(`  ${column.Field}: ${column.Type}`);
      });
      
      // Check if there are any records
      const [count] = await conn.query(`
        SELECT COUNT(*) as count FROM student_payments WHERE deleted_at IS NULL
      `);
      
      console.log(`\nRecords in student_payments: ${count[0].count}`);
    }
    
    // Check if there are any other payment-related tables
    const [allTables] = await conn.query(`
      SHOW TABLES
    `);
    
    console.log('\nAll tables in database:');
    allTables.forEach(table => {
      const tableName = Object.values(table)[0];
      if (tableName.includes('student') || tableName.includes('payment') || tableName.includes('transaction')) {
        console.log(`  ${tableName}`);
      }
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkTables();
