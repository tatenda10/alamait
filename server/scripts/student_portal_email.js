require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendStudentPortalEmail() {
  console.log('🎓 Sending Student Portal Launch Email...\n');
  
  // Test email address
  const testEmailAddress = 'tatendamuzenda1@capesso.com';
  
  console.log(`📤 Sending student portal email to: ${testEmailAddress}\n`);
  
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
  
  for (const { name, config } of configurations) {
    console.log(`🔄 Trying ${name}...`);
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Secure: ${config.secure}`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw',
        to: testEmailAddress,
        subject: '🎓 Welcome to Alamait Student Portal - Your Login Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">🎓 Alamait Student Portal</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Your Digital Dashboard is Ready!</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-top: 0;">Hello Tatenda Muzenda!</h2>
              
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
                  <li><strong>Username:</strong> <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; color: #dc3545; font-weight: bold;">STU0001</span></li>
                  <li><strong>Password:</strong> <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px; font-family: monospace; color: #dc3545; font-weight: bold;">STU0001</span></li>
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
                <strong>Important:</strong> Please use your Student ID (STU0001) as both your username and password when logging in.
              </p>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center; color: white;">
              <p style="margin: 0; font-size: 14px;">
                This is a test message from Alamait Boarding House System.
              </p>
            </div>
          </div>
        `
      };
      
      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ Student portal email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your inbox at: ${testEmailAddress}`);
      console.log(`   Configuration used: ${name}`);
      console.log('\n📋 Email Details:');
      console.log('   - Subject: 🎓 Welcome to Alamait Student Portal - Your Login Details');
      console.log('   - From: noreply@rps.co.zw');
      console.log('   - To: tatendamuzenda1@capesso.com');
      console.log('   - Format: HTML with styling');
      console.log('   - Portal URL: http://178.128.153.151:3002/login');
      console.log('   - Student ID: STU0001');
      
      return; // Exit on success
      
    } catch (error) {
      console.log(`❌ ${name} failed:`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('❌ All configurations failed');
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('   1. Check if SMTP_PASS is set in .env file');
  console.log('   2. Verify the password for noreply@rps.co.zw');
  console.log('   3. Check if the email account is active');
  console.log('   4. Contact RPS support for SMTP server details');
}

// Run the test
sendStudentPortalEmail().then(() => {
  console.log('\n🏁 Student portal email test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Student portal email test failed:', error);
  process.exit(1);
});
