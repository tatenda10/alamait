const express = require('express');
const router = express.Router();
const pettyCashController = require('../controllers/pettyCashController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Petty Cash Account Management
router.post('/accounts', pettyCashController.createPettyCashAccount);
router.get('/accounts', pettyCashController.getPettyCashAccounts);
router.get('/accounts/:accountId', pettyCashController.getPettyCashAccountById);
router.get('/accounts/:accountId/transactions', pettyCashController.getPettyCashAccountTransactions);

// Cash Issuance
router.post('/issuance', pettyCashController.issueCash);

// Expense Recording
router.post('/expenses', 
  pettyCashController.uploadReceipt, 
  pettyCashController.recordExpense
);

// Ledger and Reports
router.get('/ledger/:accountId', pettyCashController.getPettyCashLedger);

// Reconciliation
router.post('/reconciliation', pettyCashController.createReconciliation);
router.get('/reconciliation/reports', pettyCashController.getReconciliationReports);

module.exports = router;