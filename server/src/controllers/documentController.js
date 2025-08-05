const db = require('../services/db');
const fs = require('fs').promises;
const path = require('path');

// Upload student documents
const uploadStudentDocuments = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { studentId } = req.params;
    const { documentTypes } = req.body; // Array of document types corresponding to uploaded files
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (!documentTypes || documentTypes.length !== req.files.length) {
      return res.status(400).json({ message: 'Document types must be provided for each file' });
    }

    // Insert document records
    const uploadedDocs = await Promise.all(req.files.map(async (file, index) => {
      const result = await client.query(
        `INSERT INTO student_documents (
          student_id,
          type,
          file_name,
          file_path,
          original_name,
          mime_type,
          size,
          uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          studentId,
          documentTypes[index],
          path.basename(file.path),
          file.path,
          file.originalname,
          file.mimetype,
          file.size
        ]
      );
      
      return result.rows[0];
    }));

    await client.query('COMMIT');
    res.status(201).json(uploadedDocs);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in uploadStudentDocuments:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Get student documents
const getStudentDocuments = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await db.query(
      `SELECT id, type, file_name, original_name, mime_type, size, uploaded_at
       FROM student_documents
       WHERE student_id = $1
       ORDER BY uploaded_at DESC`,
      [studentId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getStudentDocuments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Download a document
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const result = await db.query(
      `SELECT file_path, original_name, mime_type
       FROM student_documents
       WHERE id = $1`,
      [documentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = result.rows[0];
    
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
    
    const fileStream = fs.createReadStream(doc.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error in downloadDocument:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a document
const deleteDocument = async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { documentId } = req.params;
    
    // Get document details
    const result = await client.query(
      'SELECT file_path FROM student_documents WHERE id = $1',
      [documentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from storage
    await fs.unlink(result.rows[0].file_path);

    // Delete database record
    await client.query(
      'DELETE FROM student_documents WHERE id = $1',
      [documentId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in deleteDocument:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  uploadStudentDocuments,
  getStudentDocuments,
  downloadDocument,
  deleteDocument
}; 