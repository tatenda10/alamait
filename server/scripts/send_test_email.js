require('dotenv').config();
const { sendTestEmail } = require('../src/services/emailService');

async function sendTestEmailToYemukela() {
  console.log('📧 Sending Test Email to Yemukela...\n');
  
  // Display current email configuration
  console.log('📧 Email Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'rps.co.zw'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || '465'}`);
  console.log(`   User: ${process.env.SMTP_USER || 'noreply@rps.co.zw'}`);
  console.log(`   From: ${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw'}`);
  console.log(`   Secure: ${process.env.SMTP_PORT === '465' ? 'Yes' : 'No'}\n`);
  
  const testEmailAddress = 'yemukela.ndlovu@capesso.com';
  const testMessage = 'This is a test email from the Alamait Boarding House Management System. The email service is working correctly!';
  
  console.log(`📤 Sending test email to: ${testEmailAddress}\n`);
  
  try {
    const result = await sendTestEmail(testEmailAddress, testMessage);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipient: ${testEmailAddress}`);
      console.log(`   Check inbox for the test email`);
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
sendTestEmailToYemukela().then(() => {
  console.log('\n🏁 Email test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

