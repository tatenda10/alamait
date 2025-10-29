require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendStudentPortalEmails() {
  console.log('🎓 Sending Student Portal Launch Emails to All Students...\n');
  
  // Complete student matches with their details (49 found + 2 confirmed)
  const studentMatches = [
    {
      email: 'chantellegora@gmail.com',
      name: 'Chantelle Gora',
      studentId: 'STU0169'
    },
    {
      email: 'kudzaimatare08@gmail.com',
      name: 'Kudzai Matare',
      studentId: 'STU0135'
    },
    {
      email: 'tnzviramiri05@gmail.com',
      name: 'Thelma Nzvimari',
      studentId: 'STU0172'
    },
    {
      email: 'pelagiang@gmail.com',
      name: 'Pelagia Gomakalila',
      studentId: 'STU0183'
    },
    {
      email: 'sharonmatanha@gmail.com',
      name: 'Sharon Matanha',
      studentId: 'STU0139'
    },
    {
      email: 'selinasanida@gmail.com',
      name: 'Salina Saidi',
      studentId: 'STU0147'
    },
    {
      email: 'deonsengamai2004@gmail.com',
      name: 'Dion Sengamai',
      studentId: 'STU0186'
    },
    {
      email: 'vchapanduka929@gmail.com',
      name: 'Vimbai',
      studentId: 'STU0176'
    },
    {
      email: 'bangwayotinof@gmail.com',
      name: 'Tinotenda Bwangangwanyo',
      studentId: 'STU0148'
    },
    {
      email: 'hsangbin64@gmail.com',
      name: 'Shalom Gora',
      studentId: 'STU0170'
    },
    {
      email: 'liliantatendachatikobo@gmail.com',
      name: 'Lillian Chatikobo',
      studentId: 'STU0138'
    },
    {
      email: 'rachelmundembe@gmail.com',
      name: 'Rachel Madembe',
      studentId: 'STU0182'
    },
    {
      email: 'manyaurar@gmail.com',
      name: 'Rumbidzai Manyaora',
      studentId: 'STU0156'
    },
    {
      email: 'annitagwenda@gmail.com',
      name: 'Anita Gwenda',
      studentId: 'STU0137'
    },
    {
      email: 'berthamwangoh@gmail.com',
      name: 'Bertha Mwangu',
      studentId: 'STU0144'
    },
    {
      email: 'audreyfari@gmail.com',
      name: 'Farai Muzembe',
      studentId: 'STU0184'
    },
    {
      email: 'shantymawarira@gmail.com',
      name: 'Shantell Mavarira',
      studentId: 'STU0190'
    },
    {
      email: 'tanakachikonyera1@gmail.com',
      name: 'Tanaka Chikonyera',
      studentId: 'STU0158'
    },
    {
      email: 'chikoshamitchellet@gmail.com',
      name: 'Mitchel Chikosha',
      studentId: 'STU0175'
    },
    {
      email: 'mutsikiwachristine@gmail.com',
      name: 'Christine Mutsikwa',
      studentId: 'STU0143'
    },
    {
      email: 'nyasha2chinos@gmail.com',
      name: 'Nyashadzashe Chinorwiwa',
      studentId: 'STU0159'
    },
    {
      email: 'tatendakamutando2@gmail.com',
      name: 'Tatenda Kamatando',
      studentId: 'STU0141'
    },
    {
      email: 'aliciamutamuko@gmail.com',
      name: 'Alicia Mutamuko',
      studentId: 'STU0151'
    },
    {
      email: 'kimberlysinge@gmail.com',
      name: 'Ruvimbo Singe',
      studentId: 'STU0171'
    },
    {
      email: 'mapeterebellis@gmail.com',
      name: 'Bellis Mapetere',
      studentId: 'STU0140'
    },
    {
      email: 'berthamajoni@gmail.com',
      name: 'Bertha Majoni',
      studentId: 'STU0153'
    },
    {
      email: 'tanakamatematema@gmail.com',
      name: 'Tanaka Chikonyera',
      studentId: 'STU0158'
    },
    {
      email: 'africanprincessfadzai@gmail.com',
      name: 'Fadzai Mhizha',
      studentId: 'STU0173'
    },
    {
      email: 'faymubaiwa67@gmail.com',
      name: 'Fay Mubaiwa',
      studentId: 'STU0142'
    },
    {
      email: 'nkomokimberly2@gmail.com',
      name: 'Kimberly Nkomo',
      studentId: 'STU0149'
    },
    {
      email: 'munjomatadiwanashe@gmail.com',
      name: 'Munashe',
      studentId: 'STU0167'
    },
    {
      email: 'kudzaicindyrellapemhiwa@gmail.com',
      name: 'Kudzai Pemhiwa',
      studentId: 'STU0189'
    },
    {
      email: 'audreymasara2@gmail.com',
      name: 'Ropafadzo Masara',
      studentId: 'STU0188'
    },
    {
      email: 'takubmakande@gmail.com',
      name: 'Takudzwa Makunde',
      studentId: 'STU0134'
    },
    {
      email: 'tryphena200518@gmail.com',
      name: 'Trypheane Chinembiri',
      studentId: 'STU0132'
    },
    {
      email: 'kimberlybones017@gmail.com',
      name: 'Kimbely Bones',
      studentId: 'STU0160'
    },
    {
      email: 'makunzvamerrylin@gmail.com',
      name: 'Merrylin Makunzva',
      studentId: 'STU0145'
    },
    {
      email: 'chirindasandra184@gmail.com',
      name: 'Sandra Chirinda',
      studentId: 'STU0168'
    },
    {
      email: 'shantelle.mashe@gmail.com',
      name: 'Shantel Mashe',
      studentId: 'STU0136'
    },
    {
      email: 'tinotendachidaz02@gmail.com',
      name: 'Tinotenda Chidavaenzi',
      studentId: 'STU0185'
    },
    {
      email: 'Paidamoyomunyimi@gmail.com',
      name: 'Paidamoyo Munyimi',
      studentId: 'STU0179'
    },
    {
      email: 'emmahyorodani21@gmail.com',
      name: 'Emma Yoradin',
      studentId: 'STU0187'
    },
    {
      email: 'lorrainekudzai0@gmail.com',
      name: 'Lorraine Mlambo',
      studentId: 'STU0154'
    },
    {
      email: 'vanessamagorimbomahere@gmail.com',
      name: 'Vannessa Magorimbo',
      studentId: 'STU0177'
    },
    {
      email: 'kuwanatawana10@gmail.com',
      name: 'Tawana Kuwana',
      studentId: 'STU0152'
    },
    {
      email: 'agapechiwaree@gmail.com',
      name: 'Agape Chiware',
      studentId: 'STU0178'
    },
    {
      email: 'mhlorotadiwanashe@icloud.com',
      name: 'Tadiwa Mhloro',
      studentId: 'STU0163'
    },
    {
      email: 'tatendapreciousd15@gmail.com',
      name: 'Precious Dziva',
      studentId: 'STU0165'
    },
    {
      email: 'aprilkuzivakwashe@gmail.com',
      name: 'Kuziwa',
      studentId: 'STU0174'
    },
    {
      email: 'charmainetinarwo2003@gmail.com',
      name: 'Charmaine',
      studentId: 'STU0191'
    },
    {
      email: 'graciouschikuwa@gmail.com',
      name: 'Gracious',
      studentId: 'STU0180'
    }
  ];

  console.log(`📧 Found ${studentMatches.length} students to email:\n`);
  studentMatches.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} (${student.studentId}) → ${student.email}`);
  });
  console.log('');

  // Try different configurations
  const configurations = [
    {
      name: 'SSL Configuration (Port 465)',
      config: {
        host: process.env.SMTP_HOST || 'rps.co.zw',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'noreply@rps.co.zw',
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'TLS Configuration (Port 587)',
      config: {
        host: process.env.SMTP_HOST || 'rps.co.zw',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'noreply@rps.co.zw',
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'Non-SSL Configuration (Port 587)',
      config: {
        host: 'mail.rps.co.zw',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'noreply@rps.co.zw',
          pass: process.env.SMTP_PASS
        }
      }
    }
  ];

  let successfulConfig = null;
  
  // Test configuration first
  for (const { name, config } of configurations) {
    console.log(`🔄 Testing ${name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      await transporter.verify();
      console.log(`✅ ${name} is working!`);
      successfulConfig = { name, config };
      break;
    } catch (error) {
      console.log(`❌ ${name} failed: ${error.message}`);
    }
  }

  if (!successfulConfig) {
    console.log('❌ All email configurations failed. Please check your SMTP settings.');
    return;
  }

  console.log(`\n📤 Using ${successfulConfig.name} to send emails...\n`);

  const transporter = nodemailer.createTransport(successfulConfig.config);
  
  // First, send test email to tatendamuzenda1@capesso.com
  console.log('🧪 Sending test email to tatendamuzenda1@capesso.com...');
  
  try {
    const testStudent = {
      email: 'tatendamuzenda1@capesso.com',
      name: 'Test User',
      studentId: 'STU0001'
    };

    const testMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw',
      to: testStudent.email,
      subject: '🎓 Welcome to Alamait Student Portal - Your Login Details (TEST EMAIL)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎓 Alamait Student Portal</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your Digital Dashboard is Ready!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hello ${testStudent.name}!</h2>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin-top: 0;">✅ Student Portal Launch!</h3>
              <p style="color: #555; line-height: 1.6;">
                We're excited to announce that <strong>Alamait is launching a new student portal</strong>! 
                This digital platform will help you manage your boarding house experience more efficiently.
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">🔑 Your Login Details:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>Portal URL:</strong> <a href="http://178.128.153.151:3002/login" style="color: #007bff;">http://178.128.153.151:3002/login</a></li>
                <li><strong>Username:</strong> <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; color: #dc3545; font-weight: bold;">${testStudent.studentId}</span></li>
                <li><strong>Password:</strong> <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; color: #dc3545; font-weight: bold;">${testStudent.studentId}</span></li>
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">✨ What You Can Do:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>View your payments and balance</strong> in real-time</li>
                <li>Track your payment history and upcoming dues</li>
                <li>Access your boarding house information</li>
                <li>Stay updated with important announcements</li>
              </ul>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              <strong>Important:</strong> Please use your Student ID (${testStudent.studentId}) as both your username and password when logging in.
            </p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="color: #856404; margin: 0; font-weight: bold;">📧 This is a TEST EMAIL - Please review the content and design before sending to all students.</p>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              This message is from Alamait Boarding House System.
            </p>
          </div>
        </div>
      `
    };
    
    const testResult = await transporter.sendMail(testMailOptions);
    console.log(`✅ Test email sent successfully!`);
    console.log(`   Message ID: ${testResult.messageId}`);
    console.log(`   Recipient: ${testStudent.email}`);
    
  } catch (error) {
    console.log(`❌ Failed to send test email:`);
    console.log(`   Error: ${error.message}`);
    return;
  }

  console.log('\n📋 Test email sent! Please check tatendamuzenda1@capesso.com to review the email content and design.');
  console.log('If you\'re satisfied with the test email, you can proceed to send emails to all students.');
  console.log('\nTo send emails to all students, run this script again with the --send-all flag.');
  
  // If shouldSendAll is true, send emails to all students
  if (shouldSendAll) {
    console.log('\n📤 Sending emails to all students...');
    
    let successCount = 0;
    let failCount = 0;

    // Send emails to each student
    for (const student of studentMatches) {
      try {
        console.log(`📧 Sending email to ${student.name} (${student.email})...`);

        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw',
          to: student.email,
          subject: '🎓 Welcome to Alamait Student Portal - Your Login Details',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎓 Alamait Student Portal</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Your Digital Dashboard is Ready!</p>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-top: 0;">Hello ${student.name}!</h2>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #2d5a2d; margin-top: 0;">✅ Student Portal Launch!</h3>
                  <p style="color: #555; line-height: 1.6;">
                    We're excited to announce that <strong>Alamait is launching a new student portal</strong>! 
                    This digital platform will help you manage your boarding house experience more efficiently.
                  </p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <h3 style="color: #333; margin-top: 0;">🔑 Your Login Details:</h3>
                  <ul style="color: #555; line-height: 1.8;">
                    <li><strong>Portal URL:</strong> <a href="http://178.128.153.151:3002/login" style="color: #007bff;">http://178.128.153.151:3002/login</a></li>
                    <li><strong>Username:</strong> <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; color: #dc3545; font-weight: bold;">${student.studentId}</span></li>
                    <li><strong>Password:</strong> <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; color: #dc3545; font-weight: bold;">${student.studentId}</span></li>
                  </ul>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">✨ What You Can Do:</h3>
                  <ul style="color: #555; line-height: 1.8;">
                    <li><strong>View your payments and balance</strong> in real-time</li>
                    <li>Track your payment history and upcoming dues</li>
                    <li>Access your boarding house information</li>
                    <li>Stay updated with important announcements</li>
                  </ul>
                </div>
                
                <p style="color: #555; line-height: 1.6;">
                  <strong>Important:</strong> Please use your Student ID (${student.studentId}) as both your username and password when logging in.
                </p>
              </div>
              
              <div style="background: #333; padding: 20px; text-align: center; color: white;">
                <p style="margin: 0; font-size: 14px;">
                  This message is from Alamait Boarding House System.
                </p>
              </div>
            </div>
          `
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email sent successfully to ${student.name}!`);
        console.log(`   Message ID: ${result.messageId}`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Failed to send email to ${student.name}:`);
        console.log(`   Error: ${error.message}`);
        failCount++;
      }
      
      // Add small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Email Campaign Summary:');
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed to send: ${failCount} emails`);
    console.log(`📧 Total recipients: ${studentMatches.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Student portal launch emails sent successfully!');
      console.log('📱 Students can now access their portal at: http://178.128.153.151:3002/login');
    }
  }
}

// Check if we should send to all students
const shouldSendAll = process.argv.includes('--send-all');

if (shouldSendAll) {
  console.log('🚀 Sending emails to ALL students...');
} else {
  console.log('🧪 Running in TEST mode - sending only to tatendamuzenda1@capesso.com');
}

// Run the email campaign
sendStudentPortalEmails().then(() => {
  console.log('\n🏁 Email campaign completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Email campaign failed:', error);
  process.exit(1);
});
