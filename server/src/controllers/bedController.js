const db = require('../services/db');

// Get all beds for a room
const getBedsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log(`Fetching beds for room ID: ${roomId}`);
    
    const [beds] = await db.query(
      `SELECT 
        b.*,
        s.full_name as student_name,
        s.national_id as student_id_number,
        se.start_date,
        se.expected_end_date
      FROM beds b
      LEFT JOIN students s ON b.student_id = s.id
      LEFT JOIN student_enrollments se ON b.enrollment_id = se.id
      WHERE b.room_id = ? 
        AND b.deleted_at IS NULL
      ORDER BY b.bed_number`,
      [roomId]
    );
    
    console.log(`Found ${beds.length} beds for room ${roomId}:`, beds);
    
    // If no beds found, create some sample beds for testing
    if (beds.length === 0) {
      console.log(`No beds found for room ${roomId}, creating sample beds...`);
      
      // First check if the room exists
      const [roomCheck] = await db.query(
        'SELECT id, name, capacity FROM rooms WHERE id = ? AND deleted_at IS NULL',
        [roomId]
      );
      
      if (roomCheck.length > 0) {
        const room = roomCheck[0];
        console.log(`Room found: ${room.name} with capacity ${room.capacity}`);
        
        // Create sample beds based on room capacity
        const sampleBeds = [];
        for (let i = 1; i <= Math.min(room.capacity || 2, 4); i++) {
          const [result] = await db.query(
            `INSERT INTO beds (
              room_id, bed_number, price, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, 'available', ?, NOW(), NOW())`,
            [roomId, `Bed ${i}`, 150.00, `Sample bed ${i} for ${room.name}`]
          );
          
          sampleBeds.push({
            id: result.insertId,
            room_id: parseInt(roomId),
            bed_number: `Bed ${i}`,
            price: 150.00,
            status: 'available',
            notes: `Sample bed ${i} for ${room.name}`,
            student_name: null,
            student_id_number: null,
            start_date: null,
            expected_end_date: null
          });
        }
        
        console.log(`Created ${sampleBeds.length} sample beds:`, sampleBeds);
        return res.json(sampleBeds);
      } else {
        console.log(`Room ${roomId} not found`);
        return res.status(404).json({ message: 'Room not found' });
      }
    }
    
    res.json(beds);
  } catch (error) {
    console.error('Error in getBedsByRoom:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all available beds
const getAvailableBeds = async (req, res) => {
  try {
    const { boardingHouseId } = req.query;
    
    let query = `
      SELECT 
        b.*,
        r.name as room_name,
        r.capacity,
        bh.name as boarding_house_name
      FROM beds b
      JOIN rooms r ON b.room_id = r.id
      JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      WHERE b.status = 'available' 
        AND b.deleted_at IS NULL
        AND r.deleted_at IS NULL
    `;
    
    const params = [];
    if (boardingHouseId) {
      query += ' AND r.boarding_house_id = ?';
      params.push(boardingHouseId);
    }
    
    query += ' ORDER BY bh.name, r.name, b.bed_number';
    
    const [beds] = await db.query(query, params);
    res.json(beds);
  } catch (error) {
    console.error('Error in getAvailableBeds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new bed
const createBed = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { roomId, bedNumber, price, notes } = req.body;
    
    // Validate required fields
    if (!roomId || !bedNumber || !price) {
      return res.status(400).json({ message: 'Room ID, bed number, and price are required' });
    }
    
    // Check if room exists
    const [room] = await connection.query(
      'SELECT id, name, capacity FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [roomId]
    );
    
    if (room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if bed number already exists in this room
    const [existingBed] = await connection.query(
      'SELECT id FROM beds WHERE room_id = ? AND bed_number = ? AND deleted_at IS NULL',
      [roomId, bedNumber]
    );
    
    if (existingBed.length > 0) {
      return res.status(400).json({ message: 'Bed number already exists in this room' });
    }
    
    // Create the bed
    const [result] = await connection.query(
      `INSERT INTO beds (
        room_id, bed_number, price, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, 'available', ?, NOW(), NOW())`,
      [roomId, bedNumber, price, notes]
    );
    
    // Update room bed count
    await connection.query(
      'UPDATE rooms SET bed_count = bed_count + 1, updated_at = NOW() WHERE id = ?',
      [roomId]
    );
    
    const [newBed] = await connection.query(
      'SELECT * FROM beds WHERE id = ?',
      [result.insertId]
    );
    
    await connection.commit();
    res.status(201).json(newBed[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in createBed:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Update bed details
const updateBed = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { bedNumber, price, status, notes } = req.body;
    
    // Check if bed exists
    const [bed] = await connection.query(
      'SELECT * FROM beds WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (bed.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    // If bed number is being changed, check for duplicates
    if (bedNumber && bedNumber !== bed[0].bed_number) {
      const [existingBed] = await connection.query(
        'SELECT id FROM beds WHERE room_id = ? AND bed_number = ? AND id != ? AND deleted_at IS NULL',
        [bed[0].room_id, bedNumber, id]
      );
      
      if (existingBed.length > 0) {
        return res.status(400).json({ message: 'Bed number already exists in this room' });
      }
    }
    
    // Update the bed
    await connection.query(
      `UPDATE beds SET 
        bed_number = COALESCE(?, bed_number),
        price = COALESCE(?, price),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = NOW()
      WHERE id = ?`,
      [bedNumber, price, status, notes, id]
    );
    
    const [updatedBed] = await connection.query(
      'SELECT * FROM beds WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    res.json(updatedBed[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateBed:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Assign bed to student
const assignBedToStudent = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { bedId } = req.params;
    const { studentId, enrollmentId } = req.body;
    
    // Check if bed exists and is available
    const [bed] = await connection.query(
      'SELECT * FROM beds WHERE id = ? AND deleted_at IS NULL',
      [bedId]
    );
    
    if (bed.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    if (bed[0].status !== 'available') {
      return res.status(400).json({ message: 'Bed is not available' });
    }
    
    // Check if student exists
    const [student] = await connection.query(
      'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update bed status and assign to student
    await connection.query(
      `UPDATE beds SET 
        status = 'occupied',
        student_id = ?,
        enrollment_id = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [studentId, enrollmentId, bedId]
    );
    
    // Update room available beds count
    await connection.query(
      'UPDATE rooms SET available_beds = available_beds - 1, updated_at = NOW() WHERE id = ?',
      [bed[0].room_id]
    );
    
    const [updatedBed] = await connection.query(
      `SELECT 
        b.*,
        s.full_name as student_name,
        s.national_id as student_id_number
      FROM beds b
      LEFT JOIN students s ON b.student_id = s.id
      WHERE b.id = ?`,
      [bedId]
    );
    
    await connection.commit();
    res.json(updatedBed[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in assignBedToStudent:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Release bed from student
const releaseBedFromStudent = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { bedId } = req.params;
    
    // Check if bed exists
    const [bed] = await connection.query(
      'SELECT * FROM beds WHERE id = ? AND deleted_at IS NULL',
      [bedId]
    );
    
    if (bed.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    if (bed[0].status !== 'occupied') {
      return res.status(400).json({ message: 'Bed is not occupied' });
    }
    
    // Release the bed
    await connection.query(
      `UPDATE beds SET 
        status = 'available',
        student_id = NULL,
        enrollment_id = NULL,
        updated_at = NOW()
      WHERE id = ?`,
      [bedId]
    );
    
    // Update room available beds count
    await connection.query(
      'UPDATE rooms SET available_beds = available_beds + 1, updated_at = NOW() WHERE id = ?',
      [bed[0].room_id]
    );
    
    const [updatedBed] = await connection.query(
      'SELECT * FROM beds WHERE id = ?',
      [bedId]
    );
    
    await connection.commit();
    res.json(updatedBed[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in releaseBedFromStudent:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete bed
const deleteBed = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check if bed exists
    const [bed] = await connection.query(
      'SELECT * FROM beds WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (bed.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    if (bed[0].status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete occupied bed' });
    }
    
    // Soft delete the bed
    await connection.query(
      'UPDATE beds SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    
    // Update room bed count
    await connection.query(
      'UPDATE rooms SET bed_count = bed_count - 1, updated_at = NOW() WHERE id = ?',
      [bed[0].room_id]
    );
    
    await connection.commit();
    res.json({ message: 'Bed deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteBed:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getBedsByRoom,
  getAvailableBeds,
  createBed,
  updateBed,
  assignBedToStudent,
  releaseBedFromStudent,
  deleteBed
};
