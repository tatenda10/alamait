const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');
const incomeStatementController = require('../controllers/incomeStatementController');

// Cashflow report routes
router.get('/cashflow', authenticate, reportsController.getCashflowReport);
router.get('/cashflow/export', authenticate, reportsController.exportCashflowReport);

// Income statement routes
router.get('/income-statement', authenticate, incomeStatementController.generateIncomeStatement);
router.get('/income-statement/export', authenticate, reportsController.exportIncomeStatement);

// Debtors report routes
router.get('/debtors', authenticate, reportsController.getDebtorsReport);
router.get('/debtors/export', authenticate, reportsController.exportDebtorsReport);

// Income projection routes
router.get('/income-projection', authenticate, reportsController.getIncomeProjection);
router.get('/income-projection/export', authenticate, reportsController.exportIncomeProjection);

module.exports = router;