const mysql = require('mysql2/promise');
require('dotenv').config();

async function findStudentsByEmails() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Finding students by email addresses...');
    
    // List of emails to search for
    const emailsToFind = [
      'chantellegora@gmail.com',
      'kudzaimatare08@gmail.com',
      'tnzviramiri05@gmail.com',
      'pelagiang@gmail.com',
      'sharonmatanha@gmail.com',
      'selinasanida@gmail.com',
      'deonsengamai2004@gmail.com',
      'vchapanduka929@gmail.com',
      'bangwayotinof@gmail.com',
      'hsangbin64@gmail.com',
      'liliantatendachatikobo@gmail.com',
      'rachelmundembe@gmail.com',
      'manyaurar@gmail.com',
      'annitagwenda@gmail.com',
      'berthamwangoh@gmail.com',
      'audreyfari@gmail.com',
      'shantymawarira@gmail.com',
      'tanakachikonyera1@gmail.com',
      'chikoshamitchellet@gmail.com',
      'mutsikiwachristine@gmail.com',
      'nyasha2chinos@gmail.com',
      'tatendakamutando2@gmail.com',
      'aliciamutamuko@gmail.com',
      'kimberlysinge@gmail.com',
      'mapeterebellis@gmail.com',
      'berthamajoni@gmail.com',
      'tanakamatematema@gmail.com',
      'africanprincessfadzai@gmail.com',
      'faymubaiwa67@gmail.com',
      'mashayaruvarashe@gmail.com',
      'nkomokimberly2@gmail.com',
      'munjomatadiwanashe@gmail.com',
      'kudzaicindyrellapemhiwa@gmail.com',
      'audreymasara2@gmail.com',
      'takubmakande@gmail.com',
      'tryphena200518@gmail.com',
      'kimberlybones017@gmail.com',
      'makunzvamerrylin@gmail.com',
      'chirindasandra184@gmail.com',
      'shantelle.mashe@gmail.com',
      'tinotendachidaz02@gmail.com',
      'Paidamoyomunyimi@gmail.com',
      'emmahyorodani21@gmail.com',
      'lorrainekudzai0@gmail.com',
      'vanessamagorimbomahere@gmail.com',
      'kuwanatawana10@gmail.com',
      'agapechiwaree@gmail.com',
      'mhlorotadiwanashe@icloud.com',
      'tatendapreciousd15@gmail.com',
      'aprilkuzivakwashe@gmail.com',
      'charmainetinarwo2003@gmail.com',
      'graciouschikuwa@gmail.com'
    ];
    
    console.log(`📧 Searching for ${emailsToFind.length} email addresses...\n`);
    
    const foundStudents = [];
    const notFoundEmails = [];
    
    // Search for each email
    for (const email of emailsToFind) {
      const [students] = await connection.execute(`
        SELECT 
          s.id,
          s.full_name,
          s.email,
          s.phone_number,
          s.status,
          s.boarding_house_id,
          bh.name as boarding_house_name,
          se.room_id,
          r.name as room_name
        FROM students s
        LEFT JOIN boarding_houses bh ON s.boarding_house_id = bh.id
        LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
        LEFT JOIN rooms r ON se.room_id = r.id
        WHERE s.email = ? AND s.deleted_at IS NULL
      `, [email]);
      
      if (students.length > 0) {
        const student = students[0];
        foundStudents.push({
          email: student.email,
          name: student.full_name,
          id: student.id,
          phone: student.phone_number,
          status: student.status,
          boarding_house: student.boarding_house_name,
          room: student.room_name
        });
        console.log(`✅ Found: ${student.full_name} (${student.email}) - ID: ${student.id}`);
      } else {
        notFoundEmails.push(email);
        console.log(`❌ Not found: ${email}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Found: ${foundStudents.length} students`);
    console.log(`❌ Not found: ${notFoundEmails.length} emails`);
    
    if (foundStudents.length > 0) {
      console.log(`\n👥 Found Students:`);
      foundStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (ID: ${student.id})`);
        console.log(`   Email: ${student.email}`);
        console.log(`   Phone: ${student.phone || 'N/A'}`);
        console.log(`   Status: ${student.status}`);
        console.log(`   Boarding House: ${student.boarding_house}`);
        console.log(`   Room: ${student.room || 'N/A'}`);
        console.log('');
      });
    }
    
    if (notFoundEmails.length > 0) {
      console.log(`\n❌ Emails not found in database:`);
      notFoundEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email}`);
      });
    }
    
    // Generate student matches for email script
    if (foundStudents.length > 0) {
      console.log(`\n📧 Student matches for email script:`);
      console.log('const studentMatches = [');
      foundStudents.forEach((student, index) => {
        const studentId = `STU${String(student.id).padStart(4, '0')}`;
        console.log(`  {`);
        console.log(`    email: '${student.email}',`);
        console.log(`    name: '${student.name}',`);
        console.log(`    studentId: '${studentId}'`);
        console.log(`  }${index < foundStudents.length - 1 ? ',' : ''}`);
      });
      console.log('];');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

findStudentsByEmails();
