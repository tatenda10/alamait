const express = require('express');
const router = express.Router();
const rentLedgerController = require('../controllers/rentLedgerController');

// Apply authentication middleware to all routes

// Get rent ledger data
router.get('/', rentLedgerController.getRentLedger);

// Export rent ledger as CSV
router.get('/export', rentLedgerController.exportRentLedger);

module.exports = router; 