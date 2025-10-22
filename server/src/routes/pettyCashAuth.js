const express = require('express');
const router = express.Router();
const pettyCashAuthController = require('../controllers/pettyCashAuthController');
const { authenticate } = require('../middleware/auth');

// Petty cash user login (public endpoint)
router.post('/login', pettyCashAuthController.login);

// Get petty cash user profile (authenticated)
router.get('/profile', authenticate, pettyCashAuthController.getProfile);

// Change petty cash user password (authenticated)
router.post('/change-password', authenticate, pettyCashAuthController.changePassword);

// Logout (authenticated)
router.post('/logout', authenticate, pettyCashAuthController.logout);

module.exports = router;