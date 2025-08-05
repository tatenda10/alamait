const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const pendingPettyCashController = require('../controllers/pendingPettyCashController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../uploads/petty-cash-receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
    }
  }
});

// Submit a new pending expense for a specific user
router.post('/users/:id/submit-expense', authenticate, upload.single('receipt'), pendingPettyCashController.submitPendingExpense);

// Get all pending expenses (admin only)
router.get('/pending-expenses', authenticate, pendingPettyCashController.getPendingExpenses);

// Approve a pending expense (admin only)
router.post('/pending-expenses/:id/approve', authenticate, pendingPettyCashController.approvePendingExpense);

// Reject a pending expense (admin only)
router.post('/pending-expenses/:id/reject', authenticate, pendingPettyCashController.rejectPendingExpense);

// Get pending expenses for a specific user
router.get('/users/:userId/pending-expenses', authenticate, pendingPettyCashController.getUserPendingExpenses);

module.exports = router;