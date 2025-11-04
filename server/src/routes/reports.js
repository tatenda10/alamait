const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');
const incomeStatementController = require('../controllers/incomeStatementController');
const balanceSheetController = require('../controllers/balanceSheetController');
const monthlyCashflowController = require('../controllers/monthlyCashflowController');

// Cashflow report routes
router.get('/cashflow', authenticate, reportsController.getCashflowReport);
router.get('/cashflow/export', authenticate, reportsController.exportCashflowReport);
router.get('/cashflow/monthly', authenticate, monthlyCashflowController.getMonthlyCashflowReport);

// Income statement routes
router.get('/income-statement', authenticate, incomeStatementController.generateIncomeStatement);
router.get('/income-statement/export', authenticate, reportsController.exportIncomeStatement);

// Debtors report routes
router.get('/debtors', authenticate, reportsController.getDebtorsReport);
router.get('/debtors/export', authenticate, reportsController.exportDebtorsReport);

// Creditors report routes
router.get('/creditors', authenticate, reportsController.getCreditorsReport);
router.get('/creditors/export', authenticate, reportsController.exportCreditorsReport);

// Income projection routes
router.get('/income-projection', authenticate, reportsController.getIncomeProjection);
router.get('/income-projection/export', authenticate, reportsController.exportIncomeProjection);

// Balance sheet routes
router.get('/balance-sheet', authenticate, balanceSheetController.getBalanceSheet);
router.get('/balance-sheet/export', authenticate, balanceSheetController.exportBalanceSheet);

module.exports = router;