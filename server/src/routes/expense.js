const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/expense-receipts/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get expenses without supplier (no auth required)
router.get('/without-supplier', expenseController.getExpensesWithoutSupplier);

// Apply auth middleware to all routes
router.use(authenticate);

// Get all expenses across all boarding houses (super_admin only)
router.get('/', expenseController.getAllExpenses);

// Get all expenses for a specific boarding house
router.get('/boarding-house', expenseController.getBoardingHouseExpenses);

// Get expense by ID
router.get('/:id', expenseController.getExpenseById);

// Record a new expense
router.post('/', upload.single('receipt'), expenseController.recordExpense);

// Update an expense
router.put('/:id', upload.single('receipt'), expenseController.updateExpense);

// Delete an expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;