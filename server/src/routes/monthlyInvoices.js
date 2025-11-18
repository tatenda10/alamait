const express = require('express');
const router = express.Router();
const {
  generateMonthlyInvoices,
  getMonthlyInvoiceSummary,
  previewMonthlyInvoices
} = require('../controllers/monthlyInvoiceController');
const { authenticate } = require('../middleware/auth');

// Preview invoices for a boarding house and month (without generating)
router.get('/preview', authenticate, previewMonthlyInvoices);

// Generate monthly invoices for all active students
router.post('/generate', authenticate, generateMonthlyInvoices);

// Get monthly invoice summary
router.get('/summary/:month', authenticate, getMonthlyInvoiceSummary);

module.exports = router;
