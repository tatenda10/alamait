const db = require('../src/services/db');

async function matchStudentEmails() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Matching Email Addresses to Students...\n');

    // Email list provided
    const emails = [
      'chantellegora@gmail.com',
      'kudzaimatare08@gmail.com', 
      'tnzviramiri05@gmail.com',
      'pelagiang@gmail.com',
      'sharonmatanha@gmail.com',
      'selinasanida@gmail.com',
      'deonsengamai2004@gmail.com',
      'vchapanduka929@gmail.com',
      'bangwayotinof@gmail.com',
      'hsangbin64@gmail.com'
    ];

    // Get all students
    const [students] = await conn.query(
      `SELECT id, full_name, student_id, phone_number 
       FROM students 
       WHERE deleted_at IS NULL 
       ORDER BY full_name`
    );

    console.log(`📊 Found ${students.length} students in database\n`);

    // Function to extract potential name parts from email
    const extractNameFromEmail = (email) => {
      const localPart = email.split('@')[0];
      // Remove numbers and common suffixes
      return localPart.replace(/\d+/g, '').replace(/[._-]/g, '');
    };

    // Function to check if names match (fuzzy matching)
    const namesMatch = (studentName, emailName) => {
      const studentLower = studentName.toLowerCase().replace(/\s+/g, '');
      const emailLower = emailName.toLowerCase();
      
      // Check if email name is contained in student name or vice versa
      return studentLower.includes(emailLower) || emailLower.includes(studentLower);
    };

    console.log('🎯 Email to Student Matching Results:\n');

    emails.forEach((email, index) => {
      console.log(`${index + 1}. ${email}`);
      
      const emailName = extractNameFromEmail(email);
      console.log(`   Extracted name: "${emailName}"`);
      
      const matches = students.filter(student => {
        const studentName = student.full_name.toLowerCase();
        return namesMatch(student.full_name, emailName);
      });

      if (matches.length > 0) {
        console.log(`   ✅ Potential matches:`);
        matches.forEach(match => {
          console.log(`      - ${match.full_name} (ID: ${match.id}, Student ID: ${match.student_id})`);
        });
      } else {
        console.log(`   ❌ No clear matches found`);
      }
      console.log('');
    });

    // Also show all students for manual verification
    console.log('\n📋 All Students in Database:');
    console.log('=' * 50);
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.full_name} (ID: ${student.id}, Student ID: ${student.student_id})`);
    });

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

matchStudentEmails();
