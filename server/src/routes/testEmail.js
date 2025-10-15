const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../services/emailService');

// Test email endpoint
router.post('/test', async (req, res) => {
  try {
    const { email, message } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }
    
    const result = await sendTestEmail(email, message || 'Test email from Alamait Boarding House System');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
