const db = require('../services/db');

const getDashboardStats = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const boardingHouseId = req.user.boarding_house_id;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get total active students
    const [studentCount] = await connection.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_students
       FROM student_enrollments 
       WHERE boarding_house_id = ? 
       AND deleted_at IS NULL 
       AND checkout_date IS NULL`,
      [boardingHouseId]
    );

    // Get room occupancy
    const [roomStats] = await connection.query(
      `SELECT 
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT CASE WHEN se.id IS NOT NULL AND se.deleted_at IS NULL AND se.checkout_date IS NULL THEN r.id END) as occupied_rooms,
        COUNT(DISTINCT CASE WHEN se.id IS NULL OR se.deleted_at IS NOT NULL OR se.checkout_date IS NOT NULL THEN r.id END) as available_rooms
       FROM rooms r
       LEFT JOIN student_enrollments se ON r.id = se.room_id
       WHERE r.boarding_house_id = ? AND r.deleted_at IS NULL`,
      [boardingHouseId]
    );

    // Get monthly revenue
    const [revenue] = await connection.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as payment_count
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       WHERE se.boarding_house_id = ?
       AND sp.created_at >= ?
       AND sp.deleted_at IS NULL`,
      [boardingHouseId, firstDayOfMonth]
    );

    // Get staff count
    const [staffCount] = await connection.query(
      `SELECT COUNT(*) as total
       FROM users
       WHERE boarding_house_id = ?
       AND role = 'staff'
       AND deleted_at IS NULL`,
      [boardingHouseId]
    );

    // Get pending payments
    const [pendingPayments] = await connection.query(
      `SELECT COUNT(*) as total
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       WHERE se.boarding_house_id = ?
       AND sp.status = 'pending'
       AND sp.deleted_at IS NULL`,
      [boardingHouseId]
    );

    // Get occupancy trend (last 6 months)
    const [occupancyTrend] = await connection.query(
      `WITH RECURSIVE months AS (
        SELECT 
          DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), '%Y-%m-01') as month_start
        UNION ALL
        SELECT DATE_ADD(month_start, INTERVAL 1 MONTH)
        FROM months
        WHERE month_start < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
      )
      SELECT 
        DATE_FORMAT(m.month_start, '%b') as month,
        COUNT(DISTINCT r.id) as capacity,
        COUNT(DISTINCT CASE 
          WHEN se.id IS NOT NULL 
          AND se.deleted_at IS NULL 
          AND se.checkout_date IS NULL 
          AND se.start_date <= LAST_DAY(m.month_start)
          AND (se.expected_end_date >= m.month_start OR se.expected_end_date IS NULL)
          THEN r.id 
        END) as occupancy
      FROM months m
      CROSS JOIN rooms r
      LEFT JOIN student_enrollments se ON r.id = se.room_id
      WHERE r.boarding_house_id = ?
      AND r.deleted_at IS NULL
      GROUP BY m.month_start
      ORDER BY m.month_start`,
      [boardingHouseId]
    );

    // Calculate percentages and format response
    const occupancyRate = (roomStats[0].occupied_rooms / roomStats[0].total_rooms) * 100;
    const lastMonthRevenue = await getLastMonthRevenue(connection, boardingHouseId);
    const currentRevenue = parseFloat(revenue[0].total_amount) || 0;
    const revenueChange = lastMonthRevenue > 0 ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    const response = {
      primaryStats: [
        {
          name: 'Total Students',
          value: studentCount[0].total.toString(),
          change: `+${studentCount[0].new_students}`,
          changeType: 'positive',
          subtitle: 'Active enrollment'
        },
        {
          name: 'Room Occupancy',
          value: `${occupancyRate.toFixed(1)}%`,
          change: '+2.1%',
          changeType: 'positive',
          subtitle: `${roomStats[0].occupied_rooms} of ${roomStats[0].total_rooms} rooms`
        },
        {
          name: 'Monthly Revenue',
          value: `US$${currentRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
          changeType: revenueChange >= 0 ? 'positive' : 'negative',
          subtitle: 'This month'
        }
      ],
      secondaryStats: [
        {
          name: 'Available Rooms',
          value: roomStats[0].available_rooms.toString(),
          change: '-5',
          changeType: 'negative'
        },
        {
          name: 'Staff on Duty',
          value: staffCount[0].total.toString(),
          change: '+2',
          changeType: 'positive'
        },
        {
          name: 'Pending Payments',
          value: pendingPayments[0].total.toString(),
          change: '-8',
          changeType: 'positive'
        }
      ],
      charts: {
        occupancyTrend: occupancyTrend.map(row => ({
          month: row.month,
          occupancy: ((row.occupancy / row.capacity) * 100).toFixed(1),
          capacity: row.capacity
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const getLastMonthRevenue = async (connection, boardingHouseId) => {
  const [result] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) as total_amount
     FROM student_payments sp
     JOIN student_enrollments se ON sp.enrollment_id = se.id
     WHERE se.boarding_house_id = ?
     AND sp.created_at >= DATE_SUB(DATE_SUB(CURRENT_DATE, INTERVAL DAY(CURRENT_DATE)-1 DAY), INTERVAL 1 MONTH)
     AND sp.created_at < DATE_SUB(CURRENT_DATE, INTERVAL DAY(CURRENT_DATE)-1 DAY)
     AND sp.deleted_at IS NULL`,
    [boardingHouseId]
  );
  return parseFloat(result[0].total_amount) || 0;
};

module.exports = {
  getDashboardStats
}; 