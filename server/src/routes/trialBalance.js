const express = require('express');
const router = express.Router();
const trialBalanceController = require('../controllers/trialBalanceController');
const { authenticate } = require('../middleware/auth');

// Get trial balance data
router.get('/', authenticate, trialBalanceController.getTrialBalance);

// Get trial balance for specific boarding house
router.get('/boarding-house/:boardingHouseId', authenticate, trialBalanceController.getTrialBalanceByBoardingHouse);

// Export trial balance to CSV
router.get('/export', authenticate, trialBalanceController.exportTrialBalance);

module.exports = router;
