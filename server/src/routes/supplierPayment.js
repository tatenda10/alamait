const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/supplierPaymentController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Record a payment to a supplier
router.post('/', supplierPaymentController.recordSupplierPayment);

// Get all supplier payments
router.get('/', supplierPaymentController.getSupplierPayments);

// Get a specific supplier payment
router.get('/:id', supplierPaymentController.getSupplierPaymentById);

// Delete a supplier payment
router.delete('/:id', supplierPaymentController.deleteSupplierPayment);

module.exports = router;