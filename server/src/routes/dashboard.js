const express = require('express');
const router = express.Router();
const { 
  getDashboardData, 
  getDashboardStats,
  getKPIs,
  getMonthlyRevenue,
  getInvoiceStatus,
  getExpenseCategories,
  getPaymentMethods,
  getActivities
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/data', authenticate, getDashboardData);
router.get('/stats', authenticate, getDashboardStats);
router.get('/kpis', authenticate, getKPIs);
router.get('/monthly-revenue', authenticate, getMonthlyRevenue);
router.get('/invoice-status', authenticate, getInvoiceStatus);
router.get('/expense-categories', authenticate, getExpenseCategories);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.get('/activities', authenticate, getActivities);

module.exports = router; 