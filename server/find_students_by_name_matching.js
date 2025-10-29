const mysql = require('mysql2/promise');
require('dotenv').config();

async function findStudentsByNameMatching() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Finding students by name matching...');
    
    // Email to name mapping based on the email addresses provided
    const emailNameMapping = [
      { email: 'chantellegora@gmail.com', name: 'Chantelle Gora' },
      { email: 'kudzaimatare08@gmail.com', name: 'Kudzai Matare' },
      { email: 'tnzviramiri05@gmail.com', name: 'Thelma Nzvimari' },
      { email: 'pelagiang@gmail.com', name: 'Pelagia Gomakalila' },
      { email: 'sharonmatanha@gmail.com', name: 'Sharon Matanha' },
      { email: 'selinasanida@gmail.com', name: 'Salina Saidi' },
      { email: 'deonsengamai2004@gmail.com', name: 'Dion Sengamai' },
      { email: 'vchapanduka929@gmail.com', name: 'Vimbai' },
      { email: 'bangwayotinof@gmail.com', name: 'Tinotenda Bwangangwanyo' },
      { email: 'hsangbin64@gmail.com', name: 'Shalom Gora' },
      { email: 'liliantatendachatikobo@gmail.com', name: 'Lillian Chatikobo' },
      { email: 'rachelmundembe@gmail.com', name: 'Rachel Madembe' },
      { email: 'manyaurar@gmail.com', name: 'Rumbidzai Manyaora' },
      { email: 'annitagwenda@gmail.com', name: 'Anita Gwenda' },
      { email: 'berthamwangoh@gmail.com', name: 'Bertha Mwangu' },
      { email: 'audreyfari@gmail.com', name: 'Farai Muzembe' },
      { email: 'shantymawarira@gmail.com', name: 'Shantell Mavarira' },
      { email: 'tanakachikonyera1@gmail.com', name: 'Tanaka Chikonyera' },
      { email: 'chikoshamitchellet@gmail.com', name: 'Mitchel Chikosha' },
      { email: 'mutsikiwachristine@gmail.com', name: 'Christine Mutsikwa' },
      { email: 'nyasha2chinos@gmail.com', name: 'Nyashadzashe Chinorwiwa' },
      { email: 'tatendakamutando2@gmail.com', name: 'Tatenda Kamatando' },
      { email: 'aliciamutamuko@gmail.com', name: 'Alicia Mutamuko' },
      { email: 'kimberlysinge@gmail.com', name: 'Ruvimbo Singe' },
      { email: 'mapeterebellis@gmail.com', name: 'Bellis Mapetere' },
      { email: 'berthamajoni@gmail.com', name: 'Bertha Majoni' },
      { email: 'tanakamatematema@gmail.com', name: 'Tanaka Chikonyera' },
      { email: 'africanprincessfadzai@gmail.com', name: 'Fadzai Mhizha' },
      { email: 'faymubaiwa67@gmail.com', name: 'Fay Mubaiwa' },
      { email: 'mashayaruvarashe@gmail.com', name: 'Mashava' },
      { email: 'nkomokimberly2@gmail.com', name: 'Kimberly Nkomo' },
      { email: 'munjomatadiwanashe@gmail.com', name: 'Munashe' },
      { email: 'kudzaicindyrellapemhiwa@gmail.com', name: 'Kudzai Pemhiwa' },
      { email: 'audreymasara2@gmail.com', name: 'Ropafadzo Masara' },
      { email: 'takubmakande@gmail.com', name: 'Takudzwa Makunde' },
      { email: 'tryphena200518@gmail.com', name: 'Trypheane Chinembiri' },
      { email: 'kimberlybones017@gmail.com', name: 'Kimbely Bones' },
      { email: 'makunzvamerrylin@gmail.com', name: 'Merrylin Makunzva' },
      { email: 'chirindasandra184@gmail.com', name: 'Sandra Chirinda' },
      { email: 'shantelle.mashe@gmail.com', name: 'Shantel Mashe' },
      { email: 'tinotendachidaz02@gmail.com', name: 'Tinotenda Chidavaenzi' },
      { email: 'Paidamoyomunyimi@gmail.com', name: 'Paidamoyo Munyimi' },
      { email: 'emmahyorodani21@gmail.com', name: 'Emma Yoradin' },
      { email: 'lorrainekudzai0@gmail.com', name: 'Lorraine Mlambo' },
      { email: 'vanessamagorimbomahere@gmail.com', name: 'Vannessa Magorimbo' },
      { email: 'kuwanatawana10@gmail.com', name: 'Tawana Kuwana' },
      { email: 'agapechiwaree@gmail.com', name: 'Agape Chiware' },
      { email: 'mhlorotadiwanashe@icloud.com', name: 'Tadiwa Mhloro' },
      { email: 'tatendapreciousd15@gmail.com', name: 'Precious Dziva' },
      { email: 'aprilkuzivakwashe@gmail.com', name: 'Kuziwa' },
      { email: 'charmainetinarwo2003@gmail.com', name: 'Charmaine' },
      { email: 'graciouschikuwa@gmail.com', name: 'Gracious' }
    ];
    
    console.log(`📧 Searching for ${emailNameMapping.length} students by name...\n`);
    
    const foundStudents = [];
    const notFoundStudents = [];
    
    // Search for each student by name
    for (const mapping of emailNameMapping) {
      const [students] = await connection.execute(`
        SELECT 
          s.id,
          s.full_name,
          s.status,
          s.boarding_house_id,
          bh.name as boarding_house_name,
          se.room_id,
          r.name as room_name
        FROM students s
        LEFT JOIN boarding_houses bh ON s.boarding_house_id = bh.id
        LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
        LEFT JOIN rooms r ON se.room_id = r.id
        WHERE s.full_name = ? AND s.deleted_at IS NULL
      `, [mapping.name]);
      
      if (students.length > 0) {
        const student = students[0];
        foundStudents.push({
          email: mapping.email,
          name: student.full_name,
          id: student.id,
          status: student.status,
          boarding_house: student.boarding_house_name,
          room: student.room_name
        });
        console.log(`✅ Found: ${student.full_name} (ID: ${student.id}) → ${mapping.email}`);
      } else {
        notFoundStudents.push(mapping);
        console.log(`❌ Not found: ${mapping.name} → ${mapping.email}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Found: ${foundStudents.length} students`);
    console.log(`❌ Not found: ${notFoundStudents.length} students`);
    
    if (foundStudents.length > 0) {
      console.log(`\n👥 Found Students:`);
      foundStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (ID: ${student.id})`);
        console.log(`   Email: ${student.email}`);
        console.log(`   Status: ${student.status}`);
        console.log(`   Boarding House: ${student.boarding_house}`);
        console.log(`   Room: ${student.room || 'N/A'}`);
        console.log('');
      });
    }
    
    if (notFoundStudents.length > 0) {
      console.log(`\n❌ Students not found in database:`);
      notFoundStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} → ${student.email}`);
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

findStudentsByNameMatching();
