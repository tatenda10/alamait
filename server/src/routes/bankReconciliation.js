const express = require('express');
const router = express.Router();
const bankReconciliationController = require('../controllers/bankReconciliationController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get bank accounts for reconciliation
router.get('/accounts', bankReconciliationController.getBankAccounts);

// Get unreconciled transactions for a bank account
router.get('/accounts/:account_id/transactions', bankReconciliationController.getUnreconciledTransactions);

// Import bank statement
router.post('/import-statement', bankReconciliationController.importBankStatement);

// Create bank reconciliation
router.post('/reconciliations', bankReconciliationController.createBankReconciliation);

// Get bank reconciliation details
router.get('/reconciliations/:id', bankReconciliationController.getBankReconciliation);

// Update reconciliation items (match transactions)
router.put('/reconciliations/items', bankReconciliationController.updateReconciliationItems);

// Get bank reconciliation list
router.get('/reconciliations', bankReconciliationController.getBankReconciliations);

// Auto-match transactions
router.post('/reconciliations/:reconciliation_id/auto-match', bankReconciliationController.autoMatchTransactions);

module.exports = router;
