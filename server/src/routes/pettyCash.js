const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pettyCashController = require('../controllers/pettyCashController');

// Get petty cash account data
router.get('/account', authenticate, pettyCashController.getPettyCashAccount);

// Add cash to petty cash account
router.post('/add-cash', authenticate, pettyCashController.addCash);

// Withdraw cash from petty cash account
router.post('/withdraw-cash', authenticate, pettyCashController.withdrawCash);

// Add expense from petty cash account
router.post('/add-expense', authenticate, pettyCashController.addExpense);

// Set beginning balance for petty cash account
router.post('/set-beginning-balance', authenticate, pettyCashController.setBeginningBalance);

module.exports = router;