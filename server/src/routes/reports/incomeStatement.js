const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const reportsController = require('../../controllers/reportsController');

// Get cashflow report data
router.get('/cashflow', authenticate, reportsController.getCashflowReport);

// Export cashflow report
router.get('/cashflow/export', authenticate, reportsController.exportCashflowReport);

module.exports = router; 