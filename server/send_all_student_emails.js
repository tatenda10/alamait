require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendAllStudentEmails() {
  console.log('🎓 Sending Student Portal Launch Emails to All Matched Students...\n');
  
  // Student matches with their details
  const studentMatches = [
    {
      email: 'chantellegora@gmail.com',
      name: 'Chantelle Gora',
      studentId: 'STU0038'
    },
    {
      email: 'kudzaimatare08@gmail.com',
      name: 'Kudzai Matare',
      studentId: 'STU0004'
    },
    {
      email: 'sharonmatanha@gmail.com',
      name: 'Sharon Matanha',
      studentId: 'STU0008'
    },
    {
      email: 'pelagiang@gmail.com',
      name: 'Pelagia Gomakalila',
      studentId: 'STU0052'
    },
    {
      email: 'deonsengamai2004@gmail.com',
      name: 'Dion Sengamai',
      studentId: 'STU0055'
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
    console.log('\n📋 Students who received emails:');
    studentMatches.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.studentId}) → ${student.email}`);
    });
  }
}

// Run the email campaign
sendAllStudentEmails().then(() => {
  console.log('\n🏁 Email campaign completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Email campaign failed:', error);
  process.exit(1);
});
