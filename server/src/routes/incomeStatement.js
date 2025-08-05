const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const incomeStatementController = require('../controllers/incomeStatementController');

// Generate income statement
router.get('/generate', authenticate, incomeStatementController.generateIncomeStatement);

// Create overdue payment transactions
router.post('/create-overdue-transactions', authenticate, async (req, res) => {
  try {
    const result = await incomeStatementController.createOverduePaymentTransactions();
    res.json({
      success: true,
      message: `Successfully created ${result.transactionsCreated} overdue payment transactions`,
      transactionsCreated: result.transactionsCreated
    });
  } catch (error) {
    console.error('Error creating overdue payment transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create overdue payment transactions',
      error: error.message
    });
  }
});

// Save income statement
router.post('/save', authenticate, incomeStatementController.saveIncomeStatement);

// Get saved income statements
router.get('/saved', authenticate, incomeStatementController.getSavedIncomeStatements);

// Get specific saved income statement
router.get('/saved/:id', authenticate, incomeStatementController.getSavedIncomeStatement);

// Delete saved income statement
router.delete('/saved/:id', authenticate, incomeStatementController.deleteSavedIncomeStatement);

module.exports = router;