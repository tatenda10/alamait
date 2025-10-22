require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

async function previewStudentPortalEmail() {
  console.log('👀 Sending Preview Email for Student Portal Launch...\n');
  
  // Debug environment variables
  console.log('🔍 Environment Variables:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
  console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET'}`);
  console.log(`   SMTP_FROM: ${process.env.SMTP_FROM || 'NOT SET'}\n`);
  
  // Test email address
  const testEmailAddress = 'tatendamuzenda1@capesso.com';
  
  console.log(`📤 Sending preview email to: ${testEmailAddress}\n`);
  
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
        subject: '🎓 PREVIEW: Welcome to Alamait Student Portal - Your Login Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎓 Alamait Student Portal</h1>
              <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9;">Your Digital Dashboard is Ready!</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-top: 0; font-size: 24px;">Hello Tatenda Muzenda!</h2>
              
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
                  <p style="margin: 0 0 20px 0; color: #dc3545; font-size: 18px; font-weight: bold; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">STU0001</p>
                  
                  <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Password:</p>
                  <p style="margin: 0; color: #dc3545; font-size: 18px; font-weight: bold; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">STU0001</p>
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
                <strong>Important:</strong> Please use your Student ID (STU0001) as both your username and password when logging in.
              </p>
              
              <!-- Preview Notice -->
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-top: 0;">📧 Preview Notice</h4>
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  This is a preview email to show how the student portal launch email will look. 
                  The actual emails will be sent to the matched students with their correct names and Student IDs.
                </p>
              </div>
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
      
      console.log('✅ Preview email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your inbox at: ${testEmailAddress}`);
      console.log(`   Configuration used: ${name}`);
      console.log('\n📋 Email Preview Details:');
      console.log('   - Subject: 🎓 PREVIEW: Welcome to Alamait Student Portal - Your Login Details');
      console.log('   - From: noreply@rps.co.zw');
      console.log('   - To: tatendamuzenda1@capesso.com');
      console.log('   - Format: HTML with professional styling');
      console.log('   - Portal URL: http://178.128.153.151:3002/login');
      console.log('   - Test Student ID: STU0001');
      
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

// Run the preview
previewStudentPortalEmail().then(() => {
  console.log('\n🏁 Preview email test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Preview email test failed:', error);
  process.exit(1);
});
