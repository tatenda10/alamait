const express = require('express');
const router = express.Router();
const bedController = require('../controllers/bedController');
const { authenticate } = require('../middleware/auth');

// Get all beds for a specific room (public endpoint for student portal)
router.get('/room/:roomId/public', bedController.getBedsByRoom);

// Get all available beds (optionally filtered by boarding house)
router.get('/available', authenticate, bedController.getAvailableBeds);

// Create a new bed
router.post('/', authenticate, bedController.createBed);

// Update bed details
router.put('/:id', authenticate, bedController.updateBed);

// Assign bed to student
router.post('/:bedId/assign', authenticate, bedController.assignBedToStudent);

// Release bed from student
router.post('/:bedId/release', authenticate, bedController.releaseBedFromStudent);

// Delete bed
router.delete('/:id', authenticate, bedController.deleteBed);

module.exports = router;
