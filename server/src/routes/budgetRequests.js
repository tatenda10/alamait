const express = require('express');
const router = express.Router();
const {
  getBudgetRequests,
  getBudgetRequest,
  createBudgetRequest,
  approveBudgetRequest,
  rejectBudgetRequest,
  updateBudgetRequest,
  deleteBudgetRequest
} = require('../controllers/budgetRequestController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/budget-requests - Get all budget requests
router.get('/', getBudgetRequests);

// GET /api/budget-requests/:id - Get budget request by ID
router.get('/:id', getBudgetRequest);

// POST /api/budget-requests - Create new budget request
router.post('/', createBudgetRequest);

// PUT /api/budget-requests/:id - Update budget request
router.put('/:id', updateBudgetRequest);

// POST /api/budget-requests/:id/approve - Approve budget request
router.post('/:id/approve', approveBudgetRequest);

// POST /api/budget-requests/:id/reject - Reject budget request
router.post('/:id/reject', rejectBudgetRequest);

// DELETE /api/budget-requests/:id - Delete budget request
router.delete('/:id', deleteBudgetRequest);

module.exports = router;
