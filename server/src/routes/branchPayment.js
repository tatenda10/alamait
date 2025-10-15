const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const branchPaymentController = require('../controllers/branchPaymentController');
const { authenticate } = require('../middleware/auth');

// Configure multer for payment receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payment-receipts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF, JPEG, PNG files
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);

// Record a new payment (BA action) - temporarily without multer
router.post('/', branchPaymentController.recordBranchPayment);

// Get pending payments for admin approval
router.get('/pending', branchPaymentController.getPendingPayments);

// Approve a payment (Admin action)
router.post('/:paymentId/approve', branchPaymentController.approvePayment);

// Reject a payment (Admin action)
router.post('/:paymentId/reject', branchPaymentController.rejectPayment);

// Get payment history
router.get('/history', branchPaymentController.getPaymentHistory);

// Get payments for a specific student
router.get('/student/:studentId', branchPaymentController.getStudentPayments);

module.exports = router;
