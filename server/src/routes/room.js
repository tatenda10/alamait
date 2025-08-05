const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');

// Get rooms by boarding house
router.get('/boarding-house/:id', roomController.getRoomsByBoardingHouse);

// Get all available rooms
router.get('/available', roomController.getAvailableRooms);

// Get all rooms (including occupied)
router.get('/all', roomController.getAllRooms);

// Get a single room
router.get('/:id', roomController.getRoomById);

// Create a new room
router.post('/', roomController.createRoom);

// Update a room
router.put('/:id', roomController.updateRoom);

// Assign a room to a student
router.post('/:roomId/assign/:studentId', roomController.assignRoom);

// End a room assignment
router.put('/assignments/:assignmentId/end', roomController.endAssignment);

module.exports = router; 