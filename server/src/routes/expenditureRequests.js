const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getExpenditureRequests,
  getExpenditureRequest,
  createExpenditureRequest,
  approveExpenditureRequest,
  rejectExpenditureRequest,
  updateExpenditureRequest,
  deleteExpenditureRequest,
  uploadAttachment,
  downloadAttachment,
  confirmExpenditure
} = require('../controllers/expenditureRequestController');
const { authenticate } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/expenditure-attachments');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/expenditure-requests - Get all expenditure requests
router.get('/', getExpenditureRequests);

// GET /api/expenditure-requests/:id - Get expenditure request by ID
router.get('/:id', getExpenditureRequest);

// POST /api/expenditure-requests - Create new expenditure request
router.post('/', createExpenditureRequest);

// PUT /api/expenditure-requests/:id - Update expenditure request
router.put('/:id', updateExpenditureRequest);

// POST /api/expenditure-requests/:id/approve - Approve expenditure request
router.post('/:id/approve', approveExpenditureRequest);

// POST /api/expenditure-requests/:id/reject - Reject expenditure request
router.post('/:id/reject', rejectExpenditureRequest);

// POST /api/expenditure-requests/:id/confirm - Confirm expenditure and update status to 'actioned'
router.post('/:id/confirm', upload.single('receipt'), confirmExpenditure);

// DELETE /api/expenditure-requests/:id - Delete expenditure request
router.delete('/:id', deleteExpenditureRequest);

// POST /api/expenditure-requests/:id/attachments - Upload attachment
router.post('/:id/attachments', upload.single('attachment'), uploadAttachment);

// GET /api/expenditure-requests/:id/attachments/:attachmentId - Download attachment
router.get('/:id/attachments/:attachmentId', downloadAttachment);

module.exports = router;
