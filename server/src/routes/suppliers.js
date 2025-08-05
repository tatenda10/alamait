const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');

// Create supplier
router.post('/', supplierController.createSupplier);

// List all suppliers
router.get('/', authenticate, supplierController.getSuppliers);

// Get single supplier by ID
router.get('/:id', supplierController.getSupplierById);

// Get accounts payable for a supplier
router.get('/:id/accounts-payable', supplierController.getSupplierAccountsPayable);

// Get expenses for a supplier
router.get('/:id/expenses', supplierController.getSupplierExpenses);

// Update supplier
router.put('/:id', authenticate, supplierController.updateSupplier);

// Delete supplier
router.delete('/:id', authenticate, supplierController.deleteSupplier);

module.exports = router;