// Get monthly revenue for income statements
const getMonthlyRevenue = async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be in YYYY-MM format'
      });
    }

    // Get revenue breakdown by payment date
    const [revenueBreakdown] = await db.query(
      `SELECT 
        DATE_FORMAT(sp.payment_date, '%Y-%m') as payment_month,
        COUNT(*) as payment_count,
        SUM(sp.amount) as total_revenue,
        COUNT(DISTINCT sp.student_id) as unique_students,
        COUNT(DISTINCT sp.enrollment_id) as unique_enrollments
      FROM student_payments sp
      WHERE DATE_FORMAT(sp.payment_date, '%Y-%m') = ? 
        AND sp.deleted_at IS NULL
        AND sp.status = 'completed'
      GROUP BY DATE_FORMAT(sp.payment_date, '%Y-%m')`,
      [month]
    );

    // Get detailed payment list for the month
    const [payments] = await db.query(
      `SELECT 
        sp.*,
        s.full_name as student_name,
        r.name as room_name,
        bh.name as boarding_house_name
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      JOIN student_enrollments se ON sp.enrollment_id = se.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE DATE_FORMAT(sp.payment_date, '%Y-%m') = ? 
        AND sp.deleted_at IS NULL
        AND sp.status = 'completed'
      ORDER BY sp.payment_date DESC`,
      [month]
    );

    // Get payment method breakdown
    const [paymentMethods] = await db.query(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM student_payments 
      WHERE DATE_FORMAT(payment_date, '%Y-%m') = ? 
        AND deleted_at IS NULL
        AND status = 'completed'
      GROUP BY payment_method`,
      [month]
    );

    res.json({
      success: true,
      data: {
        month: month,
        revenue_summary: revenueBreakdown[0] || {
          service_month: month,
          payment_count: 0,
          total_revenue: 0,
          unique_students: 0,
          unique_enrollments: 0
        },
        payments: payments,
        payment_methods: paymentMethods
      }
    });

  } catch (error) {
    console.error('Error getting monthly revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get revenue summary across multiple months
const getRevenueSummary = async (req, res) => {
  try {
    const { start_month, end_month } = req.query; // Format: YYYY-MM

    // Validate month formats
    if (!start_month || !end_month || !/^\d{4}-\d{2}$/.test(start_month) || !/^\d{4}-\d{2}$/.test(end_month)) {
      return res.status(400).json({
        success: false,
        message: 'Both start_month and end_month are required in YYYY-MM format'
      });
    }

    // Get monthly revenue summary
    const [monthlyRevenue] = await db.query(
      `SELECT 
        DATE_FORMAT(sp.payment_date, '%Y-%m') as payment_month,
        COUNT(*) as payment_count,
        SUM(sp.amount) as total_revenue,
        COUNT(DISTINCT sp.student_id) as unique_students,
        COUNT(DISTINCT sp.enrollment_id) as unique_enrollments
      FROM student_payments sp
      WHERE DATE_FORMAT(sp.payment_date, '%Y-%m') >= ? 
        AND DATE_FORMAT(sp.payment_date, '%Y-%m') <= ?
        AND sp.deleted_at IS NULL
        AND sp.status = 'completed'
      GROUP BY DATE_FORMAT(sp.payment_date, '%Y-%m')
      ORDER BY DATE_FORMAT(sp.payment_date, '%Y-%m')`,
      [start_month, end_month]
    );

    // Calculate totals
    const totals = monthlyRevenue.reduce((acc, month) => ({
      total_payments: acc.total_payments + month.payment_count,
      total_revenue: acc.total_revenue + parseFloat(month.total_revenue),
      total_students: Math.max(acc.total_students, month.unique_students),
      total_enrollments: Math.max(acc.total_enrollments, month.unique_enrollments)
    }), {
      total_payments: 0,
      total_revenue: 0,
      total_students: 0,
      total_enrollments: 0
    });

    res.json({
      success: true,
      data: {
        period: {
          start_month: start_month,
          end_month: end_month
        },
        monthly_breakdown: monthlyRevenue,
        totals: totals
      }
    });

  } catch (error) {
    console.error('Error getting revenue summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getMonthlyRevenue,
  getRevenueSummary
};
