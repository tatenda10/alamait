const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');

// Apply authentication middleware to all routes

// Get current account balances
router.get('/balances', reconciliationController.getCurrentBalances);

// Get account ledger (like your CBZ Bank Account ledger)
router.get('/ledger/:accountId', reconciliationController.getAccountLedger);

// Get reconciliation list
router.get('/', reconciliationController.getReconciliations);

// Create a new reconciliation
router.post('/', reconciliationController.createReconciliation);

// Get reconciliation details
router.get('/:id', reconciliationController.getReconciliation);

// Update reconciliation items
router.put('/:id/items', reconciliationController.updateReconciliationItems);

module.exports = router;
