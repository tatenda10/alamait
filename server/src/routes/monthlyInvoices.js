const express = require('express');
const router = express.Router();
const {
  generateMonthlyInvoices,
  getMonthlyInvoiceSummary
} = require('../controllers/monthlyInvoiceController');
const { authenticate } = require('../middleware/auth');

// Generate monthly invoices for all active students
router.post('/generate', authenticate, generateMonthlyInvoices);

// Get monthly invoice summary
router.get('/summary/:month', authenticate, getMonthlyInvoiceSummary);

module.exports = router;
