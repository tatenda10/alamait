const db = require('../src/services/db');

async function generateStudentIds() {
  const conn = await db.getConnection();
  try {
    console.log('🎓 Generating Student IDs for all students...\n');

    // Get all students without student_id
    const [students] = await conn.query(
      `SELECT id, full_name, phone_number 
       FROM students 
       WHERE deleted_at IS NULL 
       AND (student_id IS NULL OR student_id = '')
       ORDER BY id`
    );

    console.log(`Found ${students.length} students without Student IDs`);

    if (students.length === 0) {
      console.log('✅ All students already have Student IDs!');
      conn.release();
      process.exit(0);
    }

    // Generate student IDs
    let updatedCount = 0;
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Generate student ID: STU + 4-digit number (padded with zeros)
      const studentId = `STU${String(i + 1).padStart(4, '0')}`;
      
      // Update student with generated ID
      await conn.query(
        `UPDATE students 
         SET student_id = ? 
         WHERE id = ?`,
        [studentId, student.id]
      );
      
      console.log(`✅ ${student.full_name} (ID: ${student.id}) → Student ID: ${studentId}`);
      updatedCount++;
    }

    console.log(`\n🎉 Successfully generated ${updatedCount} Student IDs!`);
    console.log('\n📋 Student Login Instructions:');
    console.log('   • Student ID: STU0001, STU0002, etc.');
    console.log('   • Password: Same as Student ID (e.g., STU0001)');
    console.log('   • Students can now log in at the student portal');

    // Show sample of generated IDs
    console.log('\n📊 Sample Student IDs:');
    const [sampleStudents] = await conn.query(
      `SELECT full_name, student_id 
       FROM students 
       WHERE deleted_at IS NULL 
       AND student_id IS NOT NULL 
       ORDER BY student_id 
       LIMIT 10`
    );
    
    sampleStudents.forEach(student => {
      console.log(`   ${student.student_id} - ${student.full_name}`);
    });

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error generating student IDs:', e);
    conn.release();
    process.exit(1);
  }
}

generateStudentIds();
