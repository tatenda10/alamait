const express = require('express');
const router = express.Router();
const accountsPayableController = require('../controllers/accountsPayableController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all accounts payable
router.get('/', accountsPayableController.getAccountsPayable);

// Get accounts payable summary
router.get('/summary', accountsPayableController.getAccountsPayableSummary);

module.exports = router;