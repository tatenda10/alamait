require('dotenv').config();
const { sendTestEmail } = require('./src/services/emailService');

async function testEmail() {
  console.log('🧪 Testing Nodemailer Configuration...\n');
  
  // Display current configuration
  console.log('📧 Email Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'rps.co.zw'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || '465'}`);
  console.log(`   User: ${process.env.SMTP_USER || 'noreply@rps.co.zw'}`);
  console.log(`   From: ${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw'}`);
  console.log(`   Secure: ${process.env.SMTP_PORT === '465' ? 'Yes' : 'No'}\n`);
  
  // Test email address (you can change this)
  const testEmailAddress = process.env.TEST_EMAIL || 'your-email@example.com';
  
  if (testEmailAddress === 'your-email@example.com') {
    console.log('❌ Please set TEST_EMAIL environment variable or update the testEmailAddress in this script');
    console.log('   Example: TEST_EMAIL=your-email@gmail.com node test-email.js');
    process.exit(1);
  }
  
  console.log(`📤 Sending test email to: ${testEmailAddress}\n`);
  
  try {
    const result = await sendTestEmail(testEmailAddress, 'This is a test email to verify Nodemailer configuration with RPS server.');
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your inbox at: ${testEmailAddress}`);
    } else {
      console.log('❌ Test email failed:');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Test email failed with exception:');
    console.log(`   Error: ${error.message}`);
  }
}

// Run the test
testEmail().then(() => {
  console.log('\n🏁 Email test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Email test failed:', error);
  process.exit(1);
});