const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'rps.co.zw',
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'noreply@rps.co.zw',
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
      ciphers: 'SSLv3'
    }
  });
};

// Send application approval email
const sendApplicationApprovalEmail = async (studentEmail, studentName, studentId, roomName, boardingHouseName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentEmail,
      subject: '🎉 Application Approved - Welcome to Alamait Boarding House!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your application has been approved</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Dear ${studentName},</h2>
            
            <p style="color: #555; line-height: 1.6;">
              We are delighted to inform you that your application to Alamait Boarding House has been <strong>approved</strong>! 
              Welcome to our community.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Your Details:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>Student ID:</strong> ${studentId}</li>
                <li><strong>Room:</strong> ${roomName}</li>
                <li><strong>Boarding House:</strong> ${boardingHouseName}</li>
                <li><strong>Status:</strong> Active</li>
              </ul>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin-top: 0;">Next Steps:</h3>
              <ol style="color: #555; line-height: 1.8;">
                <li>Visit the boarding house office to complete your registration</li>
                <li>Bring your identification documents</li>
                <li>Make your initial payment as discussed</li>
                <li>Collect your room keys and welcome package</li>
              </ol>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              If you have any questions, please don't hesitate to contact us. We look forward to welcoming you to our community!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                Best regards,<br>
                <strong>Alamait Boarding House Team</strong>
              </p>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send application rejection email
const sendApplicationRejectionEmail = async (studentEmail, studentName, reason) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: studentEmail,
      subject: 'Application Update - Alamait Boarding House',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Dear ${studentName},</h2>
            
            <p style="color: #555; line-height: 1.6;">
              Thank you for your interest in Alamait Boarding House. After careful consideration, 
              we regret to inform you that we are unable to approve your application at this time.
            </p>
            
            ${reason ? `
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">Reason:</h3>
              <p style="color: #856404; margin: 0;">${reason}</p>
            </div>
            ` : ''}
            
            <p style="color: #555; line-height: 1.6;">
              We encourage you to apply again in the future when circumstances may be different. 
              Thank you for your understanding.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                Best regards,<br>
                <strong>Alamait Boarding House Team</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
};

// Test email function
const sendTestEmail = async (toEmail, testMessage = 'This is a test email from Alamait Boarding House system.') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw',
      to: toEmail,
      subject: '🧪 Test Email - Alamait Boarding House System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🧪 Test Email</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Alamait Boarding House System</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Email Configuration Test</h2>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin-top: 0;">✅ Success!</h3>
              <p style="color: #555; line-height: 1.6;">
                ${testMessage}
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Configuration Details:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'rps.co.zw'}</li>
                <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '465'}</li>
                <li><strong>From Email:</strong> ${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@rps.co.zw'}</li>
                <li><strong>Secure Connection:</strong> Yes (SSL/TLS)</li>
                <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              If you received this email, your Nodemailer configuration is working correctly!
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
    console.log('Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Test email failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendApplicationApprovalEmail,
  sendApplicationRejectionEmail,
  sendTestEmail
};
