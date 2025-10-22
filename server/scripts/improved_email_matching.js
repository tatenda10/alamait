const db = require('../src/services/db');

async function improvedEmailMatching() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Improved Email to Student Matching...\n');

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

    // Function to split name into parts
    const splitName = (name) => {
      return name.toLowerCase().split(/\s+/).filter(part => part.length > 1);
    };

    // Function to check if names match (improved fuzzy matching)
    const namesMatch = (studentName, emailName) => {
      const studentParts = splitName(studentName);
      const emailParts = splitName(emailName);
      
      // Check if any student name part matches any email part
      for (const studentPart of studentParts) {
        for (const emailPart of emailParts) {
          if (studentPart.includes(emailPart) || emailPart.includes(studentPart)) {
            return true;
          }
        }
      }
      
      // Also check full name against email name
      const fullStudentName = studentName.toLowerCase().replace(/\s+/g, '');
      const fullEmailName = emailName.toLowerCase();
      
      return fullStudentName.includes(fullEmailName) || fullEmailName.includes(fullStudentName);
    };

    console.log('🎯 Improved Email to Student Matching Results:\n');

    emails.forEach((email, index) => {
      console.log(`${index + 1}. ${email}`);
      
      const emailName = extractNameFromEmail(email);
      console.log(`   Extracted name: "${emailName}"`);
      
      const matches = students.filter(student => {
        return namesMatch(student.full_name, emailName);
      });

      if (matches.length > 0) {
        console.log(`   ✅ Potential matches:`);
        matches.forEach(match => {
          console.log(`      - ${match.full_name} (ID: ${match.id}, Student ID: ${match.student_id})`);
        });
      } else {
        console.log(`   ❌ No clear matches found`);
        
        // Try to find partial matches by checking individual name parts
        const emailParts = splitName(emailName);
        const partialMatches = students.filter(student => {
          const studentParts = splitName(student.full_name);
          return studentParts.some(studentPart => 
            emailParts.some(emailPart => 
              studentPart.includes(emailPart) || emailPart.includes(studentPart)
            )
          );
        });
        
        if (partialMatches.length > 0) {
          console.log(`   🔍 Partial matches (check manually):`);
          partialMatches.forEach(match => {
            console.log(`      - ${match.full_name} (ID: ${match.id})`);
          });
        }
      }
      console.log('');
    });

    // Show specific name searches for the emails
    console.log('\n🔍 Manual Name Searches:\n');
    
    const manualSearches = [
      { email: 'chantellegora@gmail.com', searchTerms: ['chantelle', 'gora'] },
      { email: 'kudzaimatare08@gmail.com', searchTerms: ['kudzai', 'matare'] },
      { email: 'tnzviramiri05@gmail.com', searchTerms: ['nzviramiri', 'thelma'] },
      { email: 'pelagiang@gmail.com', searchTerms: ['pelagia', 'gomakalila'] },
      { email: 'selinasanida@gmail.com', searchTerms: ['selina', 'saidi'] },
      { email: 'deonsengamai2004@gmail.com', searchTerms: ['deon', 'sengamai'] },
      { email: 'vchapanduka929@gmail.com', searchTerms: ['chapanduka', 'vimbai'] },
      { email: 'bangwayotinof@gmail.com', searchTerms: ['bangwayo', 'tinof'] },
      { email: 'hsangbin64@gmail.com', searchTerms: ['sangbin', 'hsang'] }
    ];

    manualSearches.forEach(({ email, searchTerms }) => {
      console.log(`${email}:`);
      searchTerms.forEach(term => {
        const matches = students.filter(student => 
          student.full_name.toLowerCase().includes(term.toLowerCase())
        );
        if (matches.length > 0) {
          console.log(`   "${term}" → ${matches.map(m => m.full_name).join(', ')}`);
        }
      });
      console.log('');
    });

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

improvedEmailMatching();
