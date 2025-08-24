const express = require('express');
const router = express.Router();
const coaController = require('../controllers/coaController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all accounts (global chart of accounts)
router.get('/', coaController.getAccounts);

// Get accounts by type
router.get('/type/:type', coaController.getAccountsByType);

// Get account by ID
router.get('/:id', coaController.getAccountById);

// Create new account (global chart of accounts)
router.post('/', coaController.createAccount);

// Update account (global chart of accounts)
router.put('/:id', coaController.updateAccount);

// Delete account (global chart of accounts)
router.delete('/:id', coaController.deleteAccount);

module.exports = router; 