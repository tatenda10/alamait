const db = require('../src/services/db');

async function detailedEmailAnalysis() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Detailed Email to Student Analysis...\n');

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

    console.log('✅ CONFIRMED MATCHES:\n');
    
    // Confirmed matches from previous run
    const confirmedMatches = [
      { email: 'chantellegora@gmail.com', student: 'Chantelle Gora (STU0038)' },
      { email: 'kudzaimatare08@gmail.com', student: 'Kudzai Matare (STU0004)' },
      { email: 'sharonmatanha@gmail.com', student: 'Sharon Matanha (STU0008)' }
    ];

    confirmedMatches.forEach(match => {
      console.log(`📧 ${match.email} → ${match.student}`);
    });

    console.log('\n🔍 ANALYZING REMAINING EMAILS:\n');

    // Analyze remaining emails with more flexible matching
    const remainingEmails = emails.filter(email => 
      !confirmedMatches.some(match => match.email === email)
    );

    remainingEmails.forEach((email, index) => {
      console.log(`${index + 1}. ${email}`);
      
      const localPart = email.split('@')[0];
      console.log(`   Local part: "${localPart}"`);
      
      // Try different matching strategies
      const potentialMatches = [];
      
      students.forEach(student => {
        const studentName = student.full_name.toLowerCase();
        
        // Strategy 1: Check if any part of the email matches any part of the name
        const nameParts = studentName.split(' ');
        const emailParts = localPart.replace(/\d+/g, '').split(/[._-]/);
        
        let matchScore = 0;
        emailParts.forEach(emailPart => {
          if (emailPart.length > 2) { // Only consider meaningful parts
            nameParts.forEach(namePart => {
              if (namePart.includes(emailPart) || emailPart.includes(namePart)) {
                matchScore++;
              }
            });
          }
        });
        
        if (matchScore > 0) {
          potentialMatches.push({
            student,
            score: matchScore,
            reason: `Partial name match (score: ${matchScore})`
          });
        }
      });
      
      if (potentialMatches.length > 0) {
        console.log(`   🎯 Potential matches:`);
        potentialMatches
          .sort((a, b) => b.score - a.score)
          .slice(0, 3) // Show top 3 matches
          .forEach(match => {
            console.log(`      - ${match.student.full_name} (${match.student.student_id}) - ${match.reason}`);
          });
      } else {
        console.log(`   ❌ No matches found`);
      }
      console.log('');
    });

    console.log('\n📋 SUMMARY:');
    console.log(`✅ Confirmed matches: ${confirmedMatches.length}`);
    console.log(`❓ Remaining to match: ${remainingEmails.length}`);
    console.log(`📊 Total students: ${students.length}`);

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

detailedEmailAnalysis();
