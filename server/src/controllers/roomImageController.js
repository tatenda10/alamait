const db = require('../services/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const uploadRoomImages = require('../middleware/roomImageUpload');

// Multer configuration is now in separate middleware file

// Get all images for a room
const getRoomImages = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const [images] = await db.query(
      `SELECT * FROM room_images 
       WHERE room_id = ? AND deleted_at IS NULL 
       ORDER BY is_display_image DESC, created_at ASC`,
      [roomId]
    );
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching room images:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload multiple images for a room
const uploadRoomImagesController = async (req, res) => {
  uploadRoomImages(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { roomId } = req.params;
      const createdBy = req.user.id;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }

      // Check if room exists
      const [rooms] = await connection.query(
        'SELECT id FROM rooms WHERE id = ? AND deleted_at IS NULL',
        [roomId]
      );

      if (rooms.length === 0) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        const [result] = await connection.query(
          `INSERT INTO room_images (room_id, image_path, original_name, file_size, mime_type, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            roomId,
            file.filename,
            file.originalname,
            file.size,
            file.mimetype,
            createdBy
          ]
        );
        
        uploadedImages.push({
          id: result.insertId,
          room_id: roomId,
          image_path: file.filename,
          original_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          is_display_image: false,
          created_by: createdBy
        });
      }

      await connection.commit();
      res.status(200).json(uploadedImages);
    } catch (error) {
      await connection.rollback();
      console.error('Error in uploadRoomImages:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      connection.release();
    }
  });
};

// Set display image
const setDisplayImage = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { roomId, imageId } = req.params;
    const updatedBy = req.user.id;

    // First, unset all display images for this room
    await connection.query(
      'UPDATE room_images SET is_display_image = false, updated_at = NOW() WHERE room_id = ?',
      [roomId]
    );

    // Set the selected image as display image
    await connection.query(
      'UPDATE room_images SET is_display_image = true, updated_at = NOW() WHERE id = ? AND room_id = ?',
      [imageId, roomId]
    );

    await connection.commit();
    
    res.json({
      success: true,
      message: 'Display image updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error setting display image:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete room image
const deleteRoomImage = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { roomId, imageId } = req.params;

    // Get image details
    const [images] = await connection.query(
      'SELECT image_path FROM room_images WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
      [imageId, roomId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Soft delete the image record
    await connection.query(
      'UPDATE room_images SET deleted_at = NOW() WHERE id = ?',
      [imageId]
    );

    // Delete the physical file
    try {
      const imagePath = path.join(__dirname, '../../uploads/room-images', images[0].image_path);
      await fs.unlink(imagePath);
    } catch (error) {
      console.log('File not found or already deleted:', error.message);
    }

    await connection.commit();
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting room image:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get room image file
const getRoomImage = async (req, res) => {
  try {
    const { roomId, imageId } = req.params;
    
    const [images] = await db.query(
      'SELECT image_path, mime_type FROM room_images WHERE id = ? AND room_id = ? AND deleted_at IS NULL',
      [imageId, roomId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imagePath = path.join(__dirname, '../../uploads/room-images', images[0].image_path);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
      res.setHeader('Content-Type', images[0].mime_type);
      res.sendFile(path.resolve(imagePath));
    } catch (error) {
      res.status(404).json({ message: 'Image file not found' });
    }
  } catch (error) {
    console.error('Error serving room image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRoomImages,
  uploadRoomImagesController,
  setDisplayImage,
  deleteRoomImage,
  getRoomImage
};
