const express = require('express');
const router = express.Router();
const { 
  getDashboardData, 
  getDashboardStats,
  getKPIs,
  getPettyCashBalances,
  getMonthlyRevenue,
  getInvoiceStatus,
  getExpenseCategories,
  getPaymentMethods,
  getActivities,
  getConsolidatedMonthlyRevenueExpenses,
  getConsolidatedExpenseCategories
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/data', authenticate, getDashboardData);
router.get('/stats', authenticate, getDashboardStats);
router.get('/kpis', authenticate, getKPIs);
router.get('/petty-cash-balances', authenticate, getPettyCashBalances);
router.get('/monthly-revenue', authenticate, getMonthlyRevenue);
router.get('/invoice-status', authenticate, getInvoiceStatus);
router.get('/expense-categories', authenticate, getExpenseCategories);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.get('/activities', authenticate, getActivities);
router.get('/consolidated-monthly-revenue-expenses', authenticate, getConsolidatedMonthlyRevenueExpenses);
router.get('/consolidated-expense-categories', authenticate, getConsolidatedExpenseCategories);

module.exports = router; 