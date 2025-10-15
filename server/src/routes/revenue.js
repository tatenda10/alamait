const express = require('express');
const router = express.Router();
const {
  getMonthlyRevenue,
  getRevenueSummary
} = require('../controllers/revenueController');
const { authenticate } = require('../middleware/auth');

// Get monthly revenue for income statements
router.get('/monthly/:month', authenticate, getMonthlyRevenue);

// Get revenue summary across multiple months
router.get('/summary', authenticate, getRevenueSummary);

module.exports = router;
