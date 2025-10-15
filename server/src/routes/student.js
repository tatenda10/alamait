const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/student-documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Student login (public endpoint)
router.post('/login', studentController.studentLogin);

// Get all students for a boarding house
router.get('/boarding-house/:boardingHouseId', studentController.getStudentsByBoardingHouse);

// Get all students
router.get('/', studentController.getStudents);

// Get a single student
router.get('/:id', studentController.getStudentById);

// Create a new student
router.post('/', studentController.createStudent);

// Update a student
router.put('/:id', studentController.updateStudent);

// Delete a student (soft delete)
router.delete('/:id', studentController.deleteStudent);

// Upload student documents
router.post('/:id/documents', upload.single('document'), studentController.uploadStudentDocuments);

// Assign room to student
router.post('/:id/assign-room', studentController.assignRoom);

// Get student enrollment
router.get('/:id/enrollment', studentController.getStudentEnrollment);

// Get enrollment history
router.get('/:id/enrollments', studentController.getEnrollmentHistory);

// Update student enrollment
router.put('/:studentId/enrollment/:enrollmentId', studentController.updateEnrollment);

// Record student payment
router.post('/payments', studentController.recordStudentPayment);

// Record student invoice/charge
router.post('/invoices', studentController.recordStudentInvoice);

// Get student invoices
router.get('/:studentId/invoices', studentController.getStudentInvoices);

// Get student payments (for student dashboard)
router.get('/:studentId/payments', studentController.getStudentPayments);

// Get student invoices (for student dashboard)
router.get('/:studentId/invoices-dashboard', studentController.getStudentInvoicesForDashboard);

// Submit lease signature
router.post('/:studentId/sign-lease', studentController.submitLeaseSignature);

module.exports = router; 