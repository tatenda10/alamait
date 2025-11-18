const db = require('../services/db');

// Get rooms by boarding house with bed information
const getRoomsByBoardingHouse = async (req, res) => {
  try {
    const { id } = req.params; // boarding house id
    const [rooms] = await db.query(
      `SELECT 
        r.*,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count,
        AVG(b.price) as average_bed_price,
        MIN(b.price) as min_bed_price,
        MAX(b.price) as max_bed_price,
        bh.name as boarding_house_name
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
    const transformedRooms = rooms.map(room => {
      const totalBeds = room.total_beds || 0;
      const occupiedBeds = room.occupied_beds_count || 0;
      const availableBeds = room.available_beds_count || 0;
      const currentOccupants = occupiedBeds;
      
      // Calculate occupancy status
      let occupancyStatus = 'Available';
      if (totalBeds > 0) {
        if (occupiedBeds === 0) {
          occupancyStatus = 'Available';
        } else if (occupiedBeds === totalBeds) {
          occupancyStatus = 'Fully Occupied';
        } else {
          occupancyStatus = 'Partially Occupied';
        }
      }
      
      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        currentOccupants: currentOccupants,
        rent: parseFloat(room.price_per_bed || 0),
        adminFee: parseFloat(room.admin_fee || 0),
        securityDeposit: parseFloat(room.security_deposit || 0),
        additionalRent: parseFloat(room.additional_rent || 0),
        description: room.description,
        status: occupancyStatus,
        boarding_house_name: room.boarding_house_name,
        boarding_house_id: room.boarding_house_id,
        bedInfo: {
          totalBeds: totalBeds,
          availableBeds: availableBeds,
          occupiedBeds: occupiedBeds,
          averagePrice: parseFloat(room.average_bed_price || 0),
          minPrice: parseFloat(room.min_bed_price || 0),
          maxPrice: parseFloat(room.max_bed_price || 0)
        }
      };
    });

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
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count
      FROM rooms r
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.deleted_at IS NULL 
        AND r.status = 'active'
      GROUP BY r.id
      HAVING COUNT(CASE WHEN b.status = 'available' THEN 1 END) > 0
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
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count,
        bh.name as boarding_house_name,
        bh.id as boarding_house_id,
        COALESCE(r.price_per_bed, 0) as monthly_rent,
        COALESCE(r.admin_fee, 0) as admin_fee,
        COALESCE(r.security_deposit, 0) as security_deposit,
        COALESCE(r.additional_rent, 0) as additional_rent
      FROM rooms r
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      WHERE r.id = ? 
        AND r.deleted_at IS NULL
        AND r.status = 'active'
      GROUP BY r.id`,
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }

    const room = rooms[0];
    
    console.log('🔍 RAW ROOM DATA FROM DATABASE:');
    console.log('Full room object:', JSON.stringify(room, null, 2));

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

    // Add room_name field for compatibility and map financial fields
    room.room_name = room.name;
    room.rent = room.monthly_rent;
    
    // Calculate occupancy status
    const totalBeds = room.total_beds || 0;
    const occupiedBeds = room.occupied_beds_count || 0;
    const availableBeds = room.available_beds_count || 0;
    const currentOccupants = occupiedBeds;
    
    let occupancyStatus = 'Available';
    if (totalBeds > 0) {
      if (occupiedBeds === 0) {
        occupancyStatus = 'Available';
      } else if (occupiedBeds === totalBeds) {
        occupancyStatus = 'Fully Occupied';
      } else {
        occupancyStatus = 'Partially Occupied';
      }
    }
    
    console.log('🔍 AFTER MAPPING:');
    console.log('room.rent:', room.rent);
    console.log('room.monthly_rent:', room.monthly_rent);
    console.log('room.admin_fee:', room.admin_fee);
    console.log('room.security_deposit:', room.security_deposit);
    console.log('room.additional_rent:', room.additional_rent);
    console.log('totalBeds:', totalBeds);
    console.log('occupiedBeds:', occupiedBeds);
    console.log('currentOccupants:', currentOccupants);
    console.log('occupancyStatus:', occupancyStatus);

    res.json({
      success: true,
      data: {
        ...room,
        current_occupants: currentOccupants,
        occupancy_status: occupancyStatus,
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
      rent, // Frontend sends 'rent' but we need 'price_per_bed'
      price_per_bed, // Alternative field name
      admin_fee,
      security_deposit,
      additional_rent,
      description, 
      boarding_house_id 
    } = req.body;

    // Use rent if provided, otherwise use price_per_bed, or default to 0
    const rentValue = rent || price_per_bed || 0;
    // Capacity is optional now - it will be calculated from beds
    // Default to 0 if not provided
    const roomCapacity = capacity || 0;
    const availableBeds = capacity || 0;
    
    // Validate required fields (capacity is now optional)
    if (!name || !boarding_house_id) {
      return res.status(400).json({ message: 'Missing required fields: name and boarding_house_id are required' });
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
        roomCapacity, 
        availableBeds, 
        rentValue, // Store rent as price_per_bed
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
      room_name,
      name,
      boarding_house_id,
      description, 
      status 
    } = req.body;

    // Use room_name if provided, otherwise use name
    const roomName = room_name || name;

    // Get current room data
    const [currentRooms] = await connection.query(
      'SELECT boarding_house_id FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (currentRooms.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if boarding house is being changed
    if (boarding_house_id && boarding_house_id !== currentRooms[0].boarding_house_id) {
      // Check if room has occupied beds
      const [occupiedBeds] = await connection.query(
        `SELECT COUNT(*) as count 
         FROM beds 
         WHERE room_id = ? 
           AND status = 'occupied' 
           AND deleted_at IS NULL`,
        [id]
      );

      if (occupiedBeds[0].count > 0) {
        return res.status(400).json({ 
          message: 'Cannot change boarding house when room has occupied beds. Please move students first.' 
        });
      }
    }
    
    const [result] = await connection.query(
      `UPDATE rooms
       SET name = COALESCE(?, name),
           boarding_house_id = COALESCE(?, boarding_house_id),
           description = COALESCE(?, description),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [roomName, boarding_house_id, description, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const [updatedRoom] = await connection.query(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json(updatedRoom[0]);
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
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count,
        AVG(b.price) as average_bed_price,
        MIN(b.price) as min_bed_price,
        MAX(b.price) as max_bed_price,
        MAX(CASE WHEN ri.is_display_image = 1 THEN ri.image_path END) as display_image_path,
        MAX(CASE WHEN ri.is_display_image = 1 THEN ri.id END) as display_image_id,
        bh.name as boarding_house_name
      FROM rooms r
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      LEFT JOIN room_images ri ON r.id = ri.room_id AND ri.deleted_at IS NULL
      WHERE r.deleted_at IS NULL 
        AND r.status = 'active'
      GROUP BY r.id, r.name, r.capacity, r.price_per_bed, r.admin_fee, r.security_deposit, r.additional_rent, r.description, r.boarding_house_id, bh.name
      ORDER BY bh.name, r.name`
    );

    console.log('🔍 RAW ROOMS DATA FROM DATABASE:', rooms);

    // Transform the data to match frontend expectations
    const transformedRooms = rooms.map(room => {
      const totalBeds = room.total_beds || 0;
      const occupiedBeds = room.occupied_beds_count || 0;
      const availableBeds = room.available_beds_count || 0;
      const currentOccupants = occupiedBeds;
      
      console.log(`🔍 BACKEND PROCESSING ROOM: ${room.name}`, {
        totalBeds,
        occupiedBeds,
        availableBeds,
        currentOccupants,
        capacity: room.capacity
      });
      
      // Calculate occupancy status
      let occupancyStatus = 'Available';
      if (totalBeds > 0) {
        if (occupiedBeds === 0) {
          occupancyStatus = 'Available';
        } else if (occupiedBeds === totalBeds) {
          occupancyStatus = 'Fully Occupied';
        } else {
          occupancyStatus = 'Partially Occupied';
        }
      }
      
      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        currentOccupants: currentOccupants,
        rent: parseFloat(room.price_per_bed || 0),
        adminFee: parseFloat(room.admin_fee || 0),
        securityDeposit: parseFloat(room.security_deposit || 0),
        additionalRent: parseFloat(room.additional_rent || 0),
        description: room.description,
        status: occupancyStatus,
        boarding_house_name: room.boarding_house_name,
        boarding_house_id: room.boarding_house_id,
        displayImage: room.display_image_path ? `/api/rooms/${room.id}/images/${room.display_image_id}` : null,
        bedInfo: {
          totalBeds: totalBeds,
          availableBeds: availableBeds,
          occupiedBeds: occupiedBeds,
          averagePrice: parseFloat(room.average_bed_price || 0),
          minPrice: parseFloat(room.min_bed_price || 0),
          maxPrice: parseFloat(room.max_bed_price || 0)
        }
      };
    });

    console.log('🔍 FINAL TRANSFORMED ROOMS:', transformedRooms);
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