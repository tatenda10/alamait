const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all payments for a boarding house
router.get('/boarding-house', paymentController.getBoardingHousePayments);

// Get overdue payments for a boarding house
router.get('/boarding-house/overdue', paymentController.getOverduePayments);

// Record a payment
router.post('/', paymentController.recordPayment);

// Upload receipt for a payment
router.post('/:payment_id/receipt', paymentController.uploadReceipt);

// Get student's payment schedule
router.get('/students/:student_id/schedule', paymentController.getStudentSchedule);

// Get student's payments
router.get('/students/:student_id', paymentController.getStudentPayments);

// Get student's rent ledger
router.get('/students/:student_id/ledger', paymentController.getStudentLedger);

// Create a new payment schedule for a student
router.post('/students/:student_id/schedule', paymentController.createPaymentSchedule);

// Get payment details
router.get('/:id', paymentController.getPaymentById);

// Update payment
router.put('/:id', paymentController.updatePayment);

// Delete payment
router.delete('/:id', paymentController.deletePayment);

module.exports = router; 