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

// Create new accounts payable entry
router.post('/', accountsPayableController.createAccountsPayable);

// Get accounts payable for a specific supplier
router.get('/supplier/:supplierId', accountsPayableController.getAccountsPayableBySupplier);

// Process payment for accounts payable
router.post('/payment', accountsPayableController.processAccountsPayablePayment);

module.exports = router;