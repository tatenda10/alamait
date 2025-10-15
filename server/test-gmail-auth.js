const nodemailer = require('nodemailer');
require('dotenv').config();

// Test different Gmail authentication methods
const testGmailAuth = async () => {
  console.log('🔍 Testing Gmail authentication methods...\n');

  // Test 1: Less Secure App Access (no 2FA)
  console.log('📧 Test 1: Less Secure App Access (no 2FA required)');
  try {
    const transporter1 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // Regular password
      }
    });

    await transporter1.verify();
    console.log('✅ SUCCESS: Less Secure App Access works!');
    console.log('   → You can use your regular Gmail password\n');
    
    // Send test email
    const result = await transporter1.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: '✅ Gmail Test - Less Secure App Access',
      html: '<h1>Success!</h1><p>Less Secure App Access is working with your account.</p>'
    });
    
    console.log('📬 Test email sent! Message ID:', result.messageId);
    return { method: 'less_secure', success: true };
    
  } catch (error) {
    console.log('❌ FAILED: Less Secure App Access not available');
    console.log('   → Error:', error.message);
    console.log('   → You need 2FA + App Password\n');
  }

  // Test 2: App Password (requires 2FA)
  console.log('📧 Test 2: App Password (requires 2FA)');
  try {
    const transporter2 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD // App password
      }
    });

    await transporter2.verify();
    console.log('✅ SUCCESS: App Password works!');
    console.log('   → You have 2FA enabled and can use App Password\n');
    
    return { method: 'app_password', success: true };
    
  } catch (error) {
    console.log('❌ FAILED: App Password not working');
    console.log('   → Error:', error.message);
    console.log('   → Either no 2FA or wrong App Password\n');
  }

  console.log('🔧 Recommendations:');
  console.log('1. Try enabling "Less Secure App Access" in Gmail settings');
  console.log('2. Or enable 2FA and generate an App Password');
  console.log('3. Or use a different email provider (Outlook, Yahoo)');
  
  return { success: false };
};

// Run the test
testGmailAuth()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Email authentication is working!');
      console.log(`Method: ${result.method}`);
    } else {
      console.log('\n⚠️  Email authentication needs setup');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
