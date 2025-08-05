const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all student payments
router.get('/student-payments',  controller.getStudentPayments);

// Create a new transaction
router.post('/', authenticate, authorize(['accountant', 'admin']), controller.createTransaction);

// Get account balance
router.get('/account/:accountId/balance', authenticate, authorize(['accountant', 'admin']), controller.getAccountBalance);

// Get account transactions
router.get('/account/:accountId/transactions', authenticate, controller.getAccountTransactions);

// Post a transaction
router.post('/:id/post', authenticate, authorize(['accountant', 'admin']), controller.postTransaction);

// Void a transaction
router.post('/:id/void', authenticate, authorize(['accountant', 'admin']), controller.voidTransaction);

module.exports = router;