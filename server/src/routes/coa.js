const express = require('express');
const router = express.Router();
const coaController = require('../controllers/coaController');

// Apply authentication middleware to all routes

// Get all accounts across all boarding houses (super_admin only)
router.get('/all',  coaController.getAllAccounts);

// Get accounts for a specific branch
router.get('/',  coaController.getBranchAccounts);

// Create new account in a branch
router.post('/',  coaController.createBranchAccount);

// Update account in a branch
router.put('/:id',  coaController.updateBranchAccount);

// Delete account from a branch
router.delete('/:id',  coaController.deleteBranchAccount);

module.exports = router; 