const express = require('express');
const router = express.Router();
const roomImageController = require('../controllers/roomImageController');
const { authenticate } = require('../middleware/auth');

// Get all images for a room (public endpoint for student portal)
router.get('/:roomId/images', roomImageController.getRoomImages);

// Upload multiple images for a room
router.post('/:roomId/images', authenticate, roomImageController.uploadRoomImagesController);

// Set display image
router.put('/:roomId/images/:imageId/set-display', authenticate, roomImageController.setDisplayImage);

// Delete room image
router.delete('/:roomId/images/:imageId', authenticate, roomImageController.deleteRoomImage);

// Get room image file
router.get('/:roomId/images/:imageId', roomImageController.getRoomImage);

module.exports = router;
