const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { authenticate } = require('../middleware/auth');

// Process room checkout
router.post('/students/:studentId', authenticate, checkoutController.processCheckout);

// Get checkout details for a student
router.get('/students/:studentId', authenticate, checkoutController.getCheckoutDetails);

// Get all checkouts for a boarding house
router.get('/boarding-house/:boardingHouseId', authenticate, checkoutController.getBoardingHouseCheckouts);

module.exports = router; 