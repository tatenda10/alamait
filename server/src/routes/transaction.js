const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all student payments
router.get('/student-payments',  controller.getStudentPayments);

// Create a new transaction
    router.post('/', authenticate,  controller.createTransaction);

// Get account balance
router.get('/account/:accountId/balance', authenticate, controller.getAccountBalance);

// Get account transactions
router.get('/account/:accountId/transactions', authenticate, controller.getAccountTransactions);

// Get journal entries for a transaction
router.get('/:id/journal-entries', authenticate, controller.getTransactionJournalEntries);

// Update a transaction
router.put('/:id', authenticate,  controller.updateTransaction);

// Post a transaction
router.post('/:id/post', authenticate,  controller.postTransaction);

// Void a transaction
router.post('/:id/void', authenticate,  controller.voidTransaction);

module.exports = router;