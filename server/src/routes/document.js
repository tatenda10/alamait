const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload documents for a student
router.post(
  '/students/:studentId/documents',
  auth.requireAuth,
  upload.uploadStudentDocs,
  upload.handleUploadError,
  upload.cleanupOnError,
  documentController.uploadStudentDocuments
);

// Get all documents for a student
router.get(
  '/students/:studentId/documents',
  auth.requireAuth,
  documentController.getStudentDocuments
);

// Download a specific document
router.get(
  '/documents/:documentId/download',
  auth.requireAuth,
  documentController.downloadDocument
);

// Delete a document
router.delete(
  '/documents/:documentId',
  auth.requireAuth,
  documentController.deleteDocument
);

module.exports = router; 