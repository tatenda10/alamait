const express = require('express');
const router = express.Router();
const bankingController = require('../controllers/bankingController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get account balances
router.get('/balances', bankingController.getAccountBalances);

// Get recent transactions
router.get('/transactions', bankingController.getTransactions);

// Add balance to an account
router.post('/add-balance', bankingController.addBalance);

// Transfer between accounts
router.post('/transfer', bankingController.transfer);

// Set opening balance
router.post('/set-opening-balance', bankingController.setOpeningBalance);

module.exports = router;
