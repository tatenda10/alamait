require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendStudentPortalLaunchEmails() {
  console.log('🎓 Sending Student Portal Launch Emails...\n');
  
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
    }
  ];

  let successfulConfig = null;
  
  // Test configuration first
  for (const { name, config } of configurations) {
    console.log(`🔄 Testing ${name}...`);
    
    try {
      const transporter = nodemailer.createTransporter(config);
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

  const transporter = nodemailer.createTransporter(successfulConfig.config);
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎓 Alamait Student Portal</h1>
              <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9;">Your Digital Dashboard is Ready!</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-top: 0; font-size: 24px;">Hello ${student.name}!</h2>
              
              <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
                We're excited to announce that <strong>Alamait is launching a new student portal</strong>! 
                This digital platform will help you manage your boarding house experience more efficiently.
              </p>
              
              <!-- Login Details Card -->
              <div style="background: #e8f5e8; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #28a745;">
                <h3 style="color: #2d5a2d; margin-top: 0; font-size: 20px;">🔑 Your Login Details</h3>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Student Portal URL:</p>
                  <p style="margin: 0 0 20px 0; color: #007bff; font-size: 18px; word-break: break-all;">
                    <a href="http://178.128.153.151:3002/login" style="color: #007bff; text-decoration: none;">http://178.128.153.151:3002/login</a>
                  </p>
                  
                  <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Username:</p>
                  <p style="margin: 0 0 20px 0; color: #dc3545; font-size: 18px; font-weight: bold; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${student.studentId}</p>
                  
                  <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Password:</p>
                  <p style="margin: 0; color: #dc3545; font-size: 18px; font-weight: bold; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${student.studentId}</p>
                </div>
              </div>
              
              <!-- Features -->
              <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e9ecef;">
                <h3 style="color: #333; margin-top: 0; font-size: 20px;">✨ What You Can Do:</h3>
                <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
                  <li><strong>View your payments and balance</strong> in real-time</li>
                  <li>Track your payment history and upcoming dues</li>
                  <li>Access your boarding house information</li>
                  <li>Stay updated with important announcements</li>
                </ul>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://178.128.153.151:3002/login" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold; 
                          font-size: 18px;
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  🚀 Access Your Portal Now
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
                <strong>Important:</strong> Please use your Student ID (${student.studentId}) as both your username and password when logging in.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #333; padding: 25px; text-align: center; color: white; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Alamait Boarding House System</p>
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Your digital gateway to a better boarding house experience
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

  console.log('\n📊 Email Summary:');
  console.log(`✅ Successfully sent: ${successCount} emails`);
  console.log(`❌ Failed to send: ${failCount} emails`);
  console.log(`📧 Total recipients: ${studentMatches.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Student portal launch emails sent successfully!');
    console.log('📱 Students can now access their portal at: http://178.128.153.151:3002/login');
  }
}

// Run the email campaign
sendStudentPortalLaunchEmails().then(() => {
  console.log('\n🏁 Email campaign completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Email campaign failed:', error);
  process.exit(1);
});
