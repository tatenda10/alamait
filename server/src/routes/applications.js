const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
} = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');

// Public route for students to submit applications
router.post('/submit', submitApplication);

// Protected routes for admin
router.get('/', authenticate, getAllApplications);
router.get('/:id', authenticate, getApplicationById);
router.put('/:id/status', authenticate, updateApplicationStatus);
router.delete('/:id', authenticate, deleteApplication);

module.exports = router;
