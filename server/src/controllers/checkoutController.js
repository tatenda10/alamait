 const db = require('../services/db');

// Process room checkout
const processCheckout = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { studentId } = req.params;
    const { 
      terminationDate,
      terminationReason,
      terminationNotes,
      checklistItems
    } = req.body;

    // Validate required fields
    if (!terminationDate || !terminationReason) {
      return res.status(400).json({ 
        message: 'Missing required fields: checkout date and reason are required' 
      });
    }

    // Get current active enrollment (not checked out yet)
    const [enrollments] = await connection.query(
      `SELECT 
        se.id,
        se.room_id,
        se.boarding_house_id,
        r.name as room_name
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       WHERE se.student_id = ? 
         AND se.deleted_at IS NULL 
         AND se.checkout_date IS NULL
       ORDER BY se.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ 
        message: 'No active enrollment found for this student' 
      });
    }

    const enrollment = enrollments[0];

    // Verify all checklist items are completed (if checklistItems is provided)
    if (checklistItems && typeof checklistItems === 'object') {
      const allItemsChecked = Object.values(checklistItems)
        .every(item => item && item.checked);

      if (!allItemsChecked) {
        return res.status(400).json({ 
          message: 'All checklist items must be completed before checkout' 
        });
      }
    }

    // Update enrollment with checkout details
    await connection.query(
      `UPDATE student_enrollments 
       SET checkout_date = ?,
           checkout_reason = ?,
           checkout_notes = ?,
           checkout_checklist = ?,
           expected_end_date = ?,
           deleted_at = NOW()
       WHERE id = ?`,
      [
        terminationDate,
        terminationReason,
        terminationNotes,
        JSON.stringify(checklistItems),
        terminationDate,
        enrollment.id
      ]
    );

    // Free up the bed assigned to this enrollment
    await connection.query(
      `UPDATE beds 
       SET status = 'available',
           student_id = NULL,
           enrollment_id = NULL,
           updated_at = NOW()
       WHERE enrollment_id = ? AND deleted_at IS NULL`,
      [enrollment.id]
    );

    // Update room availability
    await connection.query(
      `UPDATE rooms 
       SET available_beds = available_beds + 1,
           updated_at = NOW()
       WHERE id = ?`,
      [enrollment.room_id]
    );

    // Update student status
    await connection.query(
      `UPDATE students 
       SET status = 'Inactive'
       WHERE id = ?`,
      [studentId]
    );

    await connection.commit();
    res.json({ 
      message: 'Room checkout completed successfully',
      checkout_date: terminationDate,
      room_name: enrollment.room_name
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in processCheckout:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get checkout details
const getCheckoutDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [enrollments] = await db.query(
      `SELECT 
        se.id,
        se.room_id,
        se.checkout_date,
        se.checkout_reason,
        se.checkout_notes,
        se.checkout_checklist,
        r.name as room_name
       FROM student_enrollments se
       JOIN rooms r ON se.room_id = r.id
       WHERE se.student_id = ? 
         AND se.deleted_at IS NOT NULL
       ORDER BY se.checkout_date DESC
       LIMIT 1`,
      [studentId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ 
        message: 'No checkout records found for this student' 
      });
    }

    res.json(enrollments[0]);
  } catch (error) {
    console.error('Error in getCheckoutDetails:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all checkouts for a boarding house
const getBoardingHouseCheckouts = async (req, res) => {
  try {
    const { boardingHouseId } = req.params;

    const [checkouts] = await db.query(
      `SELECT 
        s.id as student_id,
        s.full_name,
        se.checkout_date,
        se.checkout_reason,
        se.checkout_notes,
        r.name as room_name
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN rooms r ON se.room_id = r.id
       WHERE se.boarding_house_id = ? 
         AND se.deleted_at IS NOT NULL
         AND se.checkout_date IS NOT NULL
       ORDER BY se.checkout_date DESC`,
      [boardingHouseId]
    );

    res.json(checkouts);
  } catch (error) {
    console.error('Error in getBoardingHouseCheckouts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  processCheckout,
  getCheckoutDetails,
  getBoardingHouseCheckouts
}; 