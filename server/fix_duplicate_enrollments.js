require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDuplicateEnrollments() {
  console.log('🔧 Fixing Duplicate Enrollments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // 1. Fix Anita Gwenda - Remove enrollment 137 (with $500 balance)
    console.log('1️⃣ Fixing Anita Gwenda - Removing enrollment 137 (keeping 134 with $160)...');
    
    // Soft delete the balance for enrollment 137
    const [anitaResult1] = await connection.execute(`
      UPDATE student_account_balances 
      SET deleted_at = NOW()
      WHERE student_id = 137 AND enrollment_id = 137
    `);
    console.log(`   ✅ Deleted balance for enrollment 137: ${anitaResult1.affectedRows} row(s)`);
    
    // Soft delete enrollment 137
    const [anitaResult2] = await connection.execute(`
      UPDATE student_enrollments
      SET deleted_at = NOW()
      WHERE id = 137
    `);
    console.log(`   ✅ Deleted enrollment 137: ${anitaResult2.affectedRows} row(s)`);

    // 2. Fix Bellis Mapetere - Remove enrollment 140 (with $560 balance)
    console.log('\n2️⃣ Fixing Bellis Mapetere - Removing enrollment 140 (keeping 137 with $180)...');
    
    // Soft delete the balance for enrollment 140
    const [bellisResult1] = await connection.execute(`
      UPDATE student_account_balances 
      SET deleted_at = NOW()
      WHERE student_id = 140 AND enrollment_id = 140
    `);
    console.log(`   ✅ Deleted balance for enrollment 140: ${bellisResult1.affectedRows} row(s)`);
    
    // Soft delete enrollment 140
    const [bellisResult2] = await connection.execute(`
      UPDATE student_enrollments
      SET deleted_at = NOW()
      WHERE id = 140
    `);
    console.log(`   ✅ Deleted enrollment 140: ${bellisResult2.affectedRows} row(s)`);

    await connection.commit();
    
    console.log('\n✅ Duplicate enrollments fixed successfully!');
    console.log('\n📊 Remaining balances:');
    console.log('   • Anita Gwenda: $160 (enrollment 134)');
    console.log('   • Bellis Mapetere: $180 (enrollment 137)');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixDuplicateEnrollments();
