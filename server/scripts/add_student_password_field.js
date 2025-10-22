const db = require('../src/services/db');

async function addStudentPasswordField() {
  const conn = await db.getConnection();
  try {
    console.log('🔐 Adding password field to students table...');
    
    // Add password column to students table
    await conn.query(`
      ALTER TABLE students 
      ADD COLUMN password VARCHAR(255) NULL AFTER student_id
    `);
    
    console.log('✅ Added password column');
    
    // Update existing students to use student_id as default password
    await conn.query(`
      UPDATE students 
      SET password = student_id 
      WHERE password IS NULL AND deleted_at IS NULL
    `);
    
    console.log('✅ Set default passwords for existing students');
    
    conn.release();
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ password column already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
    conn.release();
    process.exit(1);
  }
}

addStudentPasswordField();
