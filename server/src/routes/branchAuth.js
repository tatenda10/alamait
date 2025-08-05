const express = require('express');
const router = express.Router();
const branchAuthController = require('../controllers/branchAuthController');
const branchAuthMiddleware = require('../middleware/branchAuthMiddleware');

// Public routes
router.post('/login', branchAuthController.login);

// Protected routes
router.get('/profile', branchAuthMiddleware, branchAuthController.getProfile);
router.post('/change-password', branchAuthMiddleware, branchAuthController.changePassword);
router.post('/logout', branchAuthMiddleware, branchAuthController.logout);

module.exports = router; 