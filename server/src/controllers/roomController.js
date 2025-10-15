const db = require('../services/db');

// Get rooms by boarding house with bed information
const getRoomsByBoardingHouse = async (req, res) => {
  try {
    const { id } = req.params; // boarding house id
    const [rooms] = await db.query(
      `SELECT 
        r.*,
        (r.capacity - r.available_beds) as current_occupants,
        bh.name as boarding_house_name,
        CASE 
          WHEN r.available_beds = r.capacity THEN 'Available'
          WHEN r.available_beds = 0 THEN 'Fully Occupied'
          WHEN r.available_beds < r.capacity THEN 'Partially Occupied'
        END as occupancy_status,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count,
        AVG(b.price) as average_bed_price,
        MIN(b.price) as min_bed_price,
        MAX(b.price) as max_bed_price
      FROM rooms r
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.boarding_house_id = ? 
        AND r.deleted_at IS NULL
        AND r.status = 'active'
      GROUP BY r.id
      ORDER BY r.name`,
      [id]
    );
    
    // Transform the data to match frontend expectations
    const transformedRooms = rooms.map(room => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      currentOccupants: room.capacity - room.available_beds,
      rent: parseFloat(room.price_per_bed || 0),
      adminFee: parseFloat(room.admin_fee || 0), // Include room's admin fee
      securityDeposit: parseFloat(room.security_deposit || 0),
      additionalRent: parseFloat(room.additional_rent || 0),
      description: room.description,
      status: room.occupancy_status,
      boarding_house_name: room.boarding_house_name,
      boarding_house_id: room.boarding_house_id,
      bedInfo: {
        totalBeds: room.total_beds || 0,
        availableBeds: room.available_beds_count || 0,
        occupiedBeds: room.occupied_beds_count || 0,
        averagePrice: parseFloat(room.average_bed_price || 0),
        minPrice: parseFloat(room.min_bed_price || 0),
        maxPrice: parseFloat(room.max_bed_price || 0)
      }
    }));

    res.json(transformedRooms);
  } catch (error) {
    console.error('Error in getRoomsByBoardingHouse:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all available rooms with occupancy details
const getAvailableRooms = async (req, res) => {
  try {
    const [rooms] = await db.query(
      `SELECT 
        r.*,
        (r.capacity - r.available_beds) as current_occupants
      FROM rooms r
      WHERE r.deleted_at IS NULL 
        AND r.status = 'active'
        AND r.available_beds > 0
      ORDER BY r.name`
    );

    res.json(rooms);
  } catch (error) {
    console.error('Error in getAvailableRooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a single room by ID with full details
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rooms] = await db.query(
      `SELECT 
        r.*,
        (r.capacity - r.available_beds) as current_occupants,
        bh.name as boarding_house_name,
        bh.id as boarding_house_id,
        CASE 
          WHEN r.available_beds = r.capacity THEN 'Available'
          WHEN r.available_beds = 0 THEN 'Fully Occupied'
          WHEN r.available_beds < r.capacity THEN 'Partially Occupied'
          ELSE 'Available'
        END as occupancy_status,
        COALESCE(r.price_per_bed, 0) as monthly_rent,
        0 as admin_fee,
        0 as security_deposit,
        0 as additional_rent
      FROM rooms r
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      WHERE r.id = ? 
        AND r.deleted_at IS NULL
        AND r.status = 'active'`,
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }

    const room = rooms[0];

    // Get current occupants details
    const [occupants] = await db.query(`
      SELECT 
        s.id,
        s.full_name,
        se.start_date as enrollment_date,
        'active' as enrollment_status
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      WHERE se.room_id = ? 
        AND se.deleted_at IS NULL
      ORDER BY se.start_date DESC
    `, [id]);

    // Add room_name field for compatibility
    room.room_name = room.name;

    res.json({
      success: true,
      data: {
        ...room,
        occupants
      }
    });
  } catch (error) {
    console.error('Error in getRoomById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch room details' 
    });
  }
};

// Create a new room
const createRoom = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      name, 
      capacity, 
      rent, // We'll use this as price_per_bed
      admin_fee,
      security_deposit,
      additional_rent,
      description, 
      boarding_house_id 
    } = req.body;

    // Validate required fields
    if (!name || !capacity || !rent || !boarding_house_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [result] = await connection.query(
      `INSERT INTO rooms (
        name,
        capacity,
        available_beds,
        price_per_bed,
        description,
        status,
        boarding_house_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
      [
        name, 
        capacity, 
        capacity, 
        rent, // Store rent as price_per_bed
        description, 
        boarding_house_id
      ]
    );

    const [newRoom] = await connection.query(
      'SELECT * FROM rooms WHERE id = ?',
      [result.insertId]
    );

    // Transform the response to match frontend expectations
    const transformedRoom = {
      ...newRoom[0],
      rent: parseFloat(newRoom[0].price_per_bed || 0),
      adminFee: parseFloat(admin_fee || 0),
      securityDeposit: parseFloat(security_deposit || 0),
      additionalRent: parseFloat(additional_rent || 0)
    };

    await connection.commit();
    res.status(201).json(transformedRoom);
  } catch (error) {
    await connection.rollback();
    console.error('Error in createRoom:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Update room details
const updateRoom = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      name, 
      capacity, 
      rent, // We'll use this as price_per_bed
      admin_fee,
      security_deposit,
      additional_rent,
      description, 
      status 
    } = req.body;

    // Get current room data to calculate available_beds adjustment
    const [currentRooms] = await connection.query(
      'SELECT capacity, available_beds FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (currentRooms.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Calculate new available_beds if capacity is changing
    let availableBeds = currentRooms[0].available_beds;
    if (capacity) {
      const occupiedBeds = currentRooms[0].capacity - currentRooms[0].available_beds;
      availableBeds = capacity - occupiedBeds;
      if (availableBeds < 0) {
        return res.status(400).json({ message: 'Cannot reduce capacity below current occupancy' });
      }
    }

    const [result] = await connection.query(
      `UPDATE rooms
       SET name = COALESCE(?, name),
           capacity = COALESCE(?, capacity),
           available_beds = ?,
           price_per_bed = COALESCE(?, price_per_bed),
           description = COALESCE(?, description),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [name, capacity, availableBeds, rent, description, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const [updatedRoom] = await connection.query(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    // Transform the response to match frontend expectations
    const transformedRoom = {
      ...updatedRoom[0],
      rent: parseFloat(updatedRoom[0].price_per_bed || 0),
      adminFee: parseFloat(admin_fee || 0),
      securityDeposit: parseFloat(security_deposit || 0),
      additionalRent: parseFloat(additional_rent || 0)
    };

    await connection.commit();
    res.json(transformedRoom);
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateRoom:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Assign a room to a student
const assignRoom = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { studentId, roomId } = req.params;
    const { 
      startDate, 
      expectedEndDate, 
      paymentSchedule,  // Array of payment periods
      notes 
    } = req.body;

    // Validate payment schedule
    if (!paymentSchedule || !Array.isArray(paymentSchedule) || paymentSchedule.length === 0) {
      return res.status(400).json({ message: 'Valid payment schedule is required' });
    }

    // Validate schedule dates
    const scheduleStart = new Date(paymentSchedule[0].startDate);
    const scheduleEnd = new Date(paymentSchedule[paymentSchedule.length - 1].endDate);
    if (scheduleStart > scheduleEnd || scheduleStart < new Date(startDate) || scheduleEnd > new Date(expectedEndDate)) {
      return res.status(400).json({ message: 'Invalid payment schedule dates' });
    }

    // Check if room exists and has available beds
    const [rooms] = await connection.query(
      `SELECT * FROM rooms 
       WHERE id = ? 
         AND deleted_at IS NULL 
         AND status = 'active' 
         AND available_beds > 0`,
      [roomId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found or no beds available' });
    }

    // Create new enrollment
    const [enrollmentResult] = await connection.query(
      `INSERT INTO student_enrollments (
        student_id,
        room_id,
        start_date,
        expected_end_date,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [studentId, roomId, startDate, expectedEndDate, notes]
    );

    const enrollmentId = enrollmentResult.insertId;

    // Create payment schedules
    for (const period of paymentSchedule) {
      await connection.query(
        `INSERT INTO student_payment_schedules (
          enrollment_id,
          student_id,
          period_start_date,
          period_end_date,
          amount_due,
          currency,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          enrollmentId,
          studentId,
          period.startDate,
          period.endDate,
          period.amount,
          period.currency,
          period.notes || null
        ]
      );
    }

    // Update room's available beds
    await connection.query(
      `UPDATE rooms 
       SET available_beds = available_beds - 1,
           updated_at = NOW()
       WHERE id = ?`,
      [roomId]
    );

    // Get created schedule for response
    const [paymentSchedules] = await connection.query(
      `SELECT * FROM student_payment_schedules 
       WHERE enrollment_id = ? 
       ORDER BY period_start_date`,
      [enrollmentId]
    );

    const [enrollment] = await connection.query(
      `SELECT 
        se.*,
        r.name as room_name,
        r.price_per_bed
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       WHERE se.id = ?`,
      [enrollmentId]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Room assigned and payment schedule created successfully',
      enrollment: enrollment[0],
      paymentSchedule: paymentSchedules
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in assignRoom:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// End a room assignment
const endAssignment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { assignmentId } = req.params;

    // Get the enrollment to find the room
    const [enrollments] = await connection.query(
      'SELECT room_id FROM student_enrollments WHERE id = ? AND deleted_at IS NULL',
      [assignmentId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ message: 'Active enrollment not found' });
    }

    // Increment available beds in the room
    await connection.query(
      `UPDATE rooms 
       SET available_beds = available_beds + 1,
           updated_at = NOW()
       WHERE id = ?`,
      [enrollments[0].room_id]
    );

    // Soft delete the enrollment
    const [result] = await connection.query(
      `UPDATE student_enrollments
       SET deleted_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [assignmentId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to update enrollment');
    }

    await connection.commit();
    res.json({ message: 'Assignment ended successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in endAssignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get all rooms (including occupied)
const getAllRooms = async (req, res) => {
  try {
    const [rooms] = await db.query(
      `SELECT 
        r.*,
        (r.capacity - r.available_beds) as current_occupants,
        bh.name as boarding_house_name,
        CASE 
          WHEN r.available_beds = r.capacity THEN 'Available'
          WHEN r.available_beds = 0 THEN 'Fully Occupied'
          WHEN r.available_beds < r.capacity THEN 'Partially Occupied'
        END as occupancy_status,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count,
        AVG(b.price) as average_bed_price,
        MIN(b.price) as min_bed_price,
        MAX(b.price) as max_bed_price
      FROM rooms r
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.deleted_at IS NULL 
        AND r.status = 'active'
      GROUP BY r.id
      ORDER BY bh.name, r.name`
    );

    // Transform the data to match frontend expectations
    const transformedRooms = rooms.map(room => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      currentOccupants: room.capacity - room.available_beds,
      rent: parseFloat(room.price_per_bed || 0),
      adminFee: parseFloat(room.admin_fee || 0), // Include room's admin fee
      securityDeposit: parseFloat(room.security_deposit || 0),
      additionalRent: parseFloat(room.additional_rent || 0),
      description: room.description,
      status: room.occupancy_status,
      boarding_house_name: room.boarding_house_name,
      boarding_house_id: room.boarding_house_id,
      bedInfo: {
        totalBeds: room.total_beds || 0,
        availableBeds: room.available_beds_count || 0,
        occupiedBeds: room.occupied_beds_count || 0,
        averagePrice: parseFloat(room.average_bed_price || 0),
        minPrice: parseFloat(room.min_bed_price || 0),
        maxPrice: parseFloat(room.max_bed_price || 0)
      }
    }));

    res.json(transformedRooms);
  } catch (error) {
    console.error('Error in getAllRooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRoomsByBoardingHouse,
  getAvailableRooms,
  getRoomById,
  createRoom,
  updateRoom,
  assignRoom,
  endAssignment,
  getAllRooms
};