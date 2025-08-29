const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/periods', balanceController.getBalancePeriods);
router.get('/periods/:periodId', balanceController.getBalancePeriod);
router.get('/periods/:periodId/balances', balanceController.getAccountPeriodBalances);
router.get('/accounts/:accountId/periods/:periodId/ledger', balanceController.getAccountLedgerWithBDCD);
router.put('/accounts/:accountId/periods/:periodId/bd', balanceController.setBalanceBroughtDown);
router.post('/periods/:periodId/close', balanceController.closePeriod);
router.get('/accounts/:accountId/verifications', balanceController.getBalanceVerifications);
router.get('/periods/:periodId/trial-balance', balanceController.getTrialBalance);

module.exports = router; 