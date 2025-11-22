const db = require('../services/db');

// Get comprehensive dashboard data
const getDashboardData = async (req, res) => {
  console.log('🔄 Dashboard API called - getDashboardData');
  const connection = await db.getConnection();
  try {
    console.log('📊 Fetching boarding houses data...');
    
    // Get all boarding houses data with bed occupancy
    // Monthly revenue now uses invoices created for the current month (based on invoice_date)
    const [boardingHouses] = await connection.query(
      `SELECT 
        bh.id,
        bh.name,
        bh.location,
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT CASE WHEN se.id IS NOT NULL AND se.deleted_at IS NULL AND se.checkout_date IS NULL THEN r.id END) as occupied_rooms,
        COUNT(DISTINCT b.id) as total_beds,
        COUNT(DISTINCT CASE WHEN b.status = 'occupied' AND b.deleted_at IS NULL THEN b.id END) as occupied_beds,
        COUNT(DISTINCT CASE WHEN b.status = 'available' AND b.deleted_at IS NULL THEN b.id END) as available_beds,
        COUNT(DISTINCT se.id) as total_students,
        COUNT(DISTINCT u.id) as staff_count,
        COALESCE(SUM(si.amount), 0) as monthly_revenue
       FROM boarding_houses bh
       LEFT JOIN rooms r ON bh.id = r.boarding_house_id AND r.deleted_at IS NULL
       LEFT JOIN beds b ON r.id = b.room_id
       LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL AND se.checkout_date IS NULL
       LEFT JOIN users u ON bh.id = u.boarding_house_id AND u.role = 'staff' AND u.deleted_at IS NULL
       LEFT JOIN student_invoices si ON se.id = si.enrollment_id 
         AND DATE_FORMAT(si.invoice_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
         AND si.deleted_at IS NULL
       WHERE bh.deleted_at IS NULL
       GROUP BY bh.id, bh.name, bh.location
       ORDER BY bh.name`
    );
    
    console.log('🏠 Boarding houses found:', boardingHouses.length);
    console.log('🏠 Boarding houses data:', boardingHouses);

    // Calculate overall KPIs using beds
    const totalBoardingHouses = boardingHouses.length;
    const totalRooms = boardingHouses.reduce((sum, bh) => sum + (bh.total_rooms || 0), 0);
    const totalBeds = boardingHouses.reduce((sum, bh) => sum + (bh.total_beds || 0), 0);
    const totalOccupiedBeds = boardingHouses.reduce((sum, bh) => sum + (bh.occupied_beds || 0), 0);
    const totalStudents = boardingHouses.reduce((sum, bh) => sum + (bh.total_students || 0), 0);
    const averageOccupancyRate = totalBeds > 0 ? ((totalOccupiedBeds / totalBeds) * 100).toFixed(1) : 0;
    const totalMonthlyRevenue = boardingHouses.reduce((sum, bh) => sum + (bh.monthly_revenue || 0), 0);
    
    // Get student prepayments total (positive balances = students who overpaid)
    // Only include active enrollments (not checked out)
    const [prepaymentsResult] = await connection.query(`
      SELECT COALESCE(SUM(sab.current_balance), 0) as total_prepayments
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND se.checkout_date IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
    `);
    
    // Get student debtors total (negative balances = students who owe)
    // Include checked-out students with outstanding balances (same logic as debtors report)
    const [debtorsResult] = await connection.query(`
      SELECT COALESCE(SUM(ABS(sab.current_balance)), 0) as total_debtors
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND (se.deleted_at IS NULL OR se.checkout_date IS NOT NULL)
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
    `);
    
    const totalPrepayments = parseFloat(prepaymentsResult[0]?.total_prepayments || 0);
    const totalDebtors = parseFloat(debtorsResult[0]?.total_debtors || 0);
    
    console.log('📊 Calculated KPIs:');
    console.log('  - Total Boarding Houses:', totalBoardingHouses);
    console.log('  - Total Rooms:', totalRooms);
    console.log('  - Total Beds:', totalBeds);
    console.log('  - Total Occupied Beds:', totalOccupiedBeds);
    console.log('  - Total Students:', totalStudents);
    console.log('  - Average Bed Occupancy Rate:', averageOccupancyRate);
    console.log('  - Total Monthly Revenue (from invoices):', totalMonthlyRevenue);
    console.log('  - Total Student Prepayments:', totalPrepayments);
    console.log('  - Total Student Debtors:', totalDebtors);

    // Get recent activities (last 10) - only enrollments and payments
    console.log('📋 Fetching recent activities...');
    const [activities] = await connection.query(
      `SELECT 
        'student_enrollment' as type,
        CONCAT('Student enrolled at ', bh.name) as description,
        se.created_at as timestamp
       FROM student_enrollments se
       JOIN boarding_houses bh ON se.boarding_house_id = bh.id
       WHERE se.deleted_at IS NULL
       UNION ALL
       SELECT 
        'payment' as type,
        CONCAT('Payment received at ', bh.name) as description,
        sp.created_at as timestamp
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       JOIN boarding_houses bh ON se.boarding_house_id = bh.id
       WHERE sp.deleted_at IS NULL
       ORDER BY timestamp DESC
       LIMIT 10`
    );
    console.log('📋 Activities found:', activities.length);

    // Get monthly revenue and expense metrics for the last 6 months
    // Using EXACT same logic as income statement: journal entries based on transaction_date
    console.log('📈 Fetching monthly metrics...');
    await connection.query("SET time_zone = '+00:00'");
    const [monthlyMetrics] = await connection.query(
      `WITH RECURSIVE months AS (
        SELECT 
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01') as month_start,
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%b %Y') as month_name,
          1 as month_num
        UNION ALL
        SELECT 
          DATE_ADD(month_start, INTERVAL 1 MONTH),
          DATE_FORMAT(DATE_ADD(month_start, INTERVAL 1 MONTH), '%b %Y'),
          month_num + 1
        FROM months
        WHERE month_num < 6
      )
      SELECT 
        m.month_name,
        m.month_start,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t_revenue.transaction_date, '%Y-%m-01') = m.month_start THEN je_revenue.amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(t_expense.transaction_date, '%Y-%m-01') = m.month_start THEN je_expense.amount ELSE 0 END), 0) as expenses
       FROM months m
       -- Revenue: Credit entries to Revenue accounts (same as income statement)
       LEFT JOIN journal_entries je_revenue ON je_revenue.entry_type = 'credit'
         AND je_revenue.deleted_at IS NULL
       LEFT JOIN transactions t_revenue ON je_revenue.transaction_id = t_revenue.id
         AND t_revenue.deleted_at IS NULL
         AND (t_revenue.status = 'posted' OR t_revenue.status IS NULL OR t_revenue.status = '')
       LEFT JOIN chart_of_accounts coa_revenue ON je_revenue.account_id = coa_revenue.id
         AND UPPER(TRIM(coa_revenue.type)) = 'REVENUE'
         AND coa_revenue.deleted_at IS NULL
       LEFT JOIN boarding_houses bh_revenue ON je_revenue.boarding_house_id = bh_revenue.id
         AND bh_revenue.deleted_at IS NULL
       -- Expenses: Debit entries to Expense accounts (same as income statement)
       LEFT JOIN journal_entries je_expense ON je_expense.entry_type = 'debit'
         AND je_expense.deleted_at IS NULL
       LEFT JOIN transactions t_expense ON je_expense.transaction_id = t_expense.id
         AND t_expense.deleted_at IS NULL
         AND t_expense.status = 'posted'
       LEFT JOIN chart_of_accounts coa_expense ON je_expense.account_id = coa_expense.id
         AND coa_expense.type = 'Expense'
         AND coa_expense.deleted_at IS NULL
       LEFT JOIN boarding_houses bh_expense ON je_expense.boarding_house_id = bh_expense.id
         AND bh_expense.deleted_at IS NULL
       GROUP BY m.month_name, m.month_start
       ORDER BY m.month_start`
    );
    console.log('📈 Monthly metrics found:', monthlyMetrics.length);
    console.log('📈 Monthly metrics data:', monthlyMetrics);

    // Get pending payments count
    const [pendingPayments] = await connection.query(
      `SELECT COUNT(*) as count
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       WHERE sp.status = 'pending' AND sp.deleted_at IS NULL`
    );

    // Get overdue payments count
    const [overduePayments] = await connection.query(
      `SELECT COUNT(*) as count
       FROM student_payment_schedules sps
       JOIN student_enrollments se ON sps.enrollment_id = se.id
       WHERE sps.period_start_date < CURDATE() 
         AND sps.status = 'pending' 
         AND sps.deleted_at IS NULL`
    );

    // Format boarding houses data with bed occupancy
    const housesData = boardingHouses.map(bh => ({
      id: bh.id,
      name: bh.name,
      admin: 'Admin', // You might want to get actual admin names
      students: bh.total_students || 0,
      rooms: bh.total_rooms || 0,
      total_beds: bh.total_beds || 0,
      occupied_beds: bh.occupied_beds || 0,
      available_beds: bh.available_beds || 0,
      occupancy: bh.total_beds > 0 ? Math.round(((bh.occupied_beds || 0) / bh.total_beds) * 100) : 0,
      last: 'Recently', // You might want to calculate actual last activity
      monthly_revenue: bh.monthly_revenue || 0
    }));

    // Format activities data
    const activitiesData = activities.map(activity => ({
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp
    }));

    // Format monthly metrics data - convert to integers
    const monthlyMetricsData = monthlyMetrics.map(metric => ({
      month: metric.month_name,
      income: Math.round(parseFloat(metric.income || 0)),
      expenses: Math.round(parseFloat(metric.expenses || 0)),
      profit: Math.round(parseFloat(metric.income || 0) - parseFloat(metric.expenses || 0))
    }));

    const response = {
      kpis: [
        { label: 'Total Boarding Houses', value: totalBoardingHouses, icon: 'home' },
        { label: 'Total Rooms', value: totalRooms, icon: 'bed' },
        { label: 'Total Beds', value: totalBeds, icon: 'bed' },
        { label: 'Total Students Enrolled', value: totalStudents, icon: 'users' },
        { label: 'Average Bed Occupancy Rate', value: `${averageOccupancyRate}%`, icon: 'chart-pie' },
        { label: 'Occupied Beds', value: totalOccupiedBeds, icon: 'bed' },
        { label: 'Available Beds', value: totalBeds - totalOccupiedBeds, icon: 'bed' }
      ],
      houses: housesData,
      activities: activitiesData,
      monthlyMetrics: monthlyMetricsData,
      summary: {
        totalBoardingHouses,
        totalRooms,
        totalBeds,
        totalOccupiedBeds,
        totalStudents,
        averageOccupancyRate,
        totalMonthlyRevenue,
        totalPrepayments,
        totalDebtors,
        pendingPayments: pendingPayments[0].count,
        overduePayments: overduePayments[0].count
      }
    };

    console.log('✅ Dashboard response prepared:', {
      kpisCount: response.kpis.length,
      housesCount: response.houses.length,
      activitiesCount: response.activities.length,
      monthlyMetricsCount: response.monthlyMetrics.length
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error in getDashboardData:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get dashboard stats for specific boarding house (existing function)
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

    // Get bed occupancy (not room occupancy)
    const [bedStats] = await connection.query(
      `SELECT 
        COUNT(DISTINCT b.id) as total_beds,
        COUNT(DISTINCT CASE WHEN b.status = 'occupied' AND b.deleted_at IS NULL THEN b.id END) as occupied_beds,
        COUNT(DISTINCT CASE WHEN b.status = 'available' AND b.deleted_at IS NULL THEN b.id END) as available_beds
       FROM rooms r
       LEFT JOIN beds b ON r.id = b.room_id
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
    const totalBeds = bedStats[0].total_beds || 0;
    const occupiedBeds = bedStats[0].occupied_beds || 0;
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100) : 0;
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
          name: 'Bed Occupancy',
          value: `${occupancyRate.toFixed(1)}%`,
          change: '+2.1%',
          changeType: 'positive',
          subtitle: `${occupiedBeds} of ${totalBeds} beds`
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
          name: 'Available Beds',
          value: (bedStats[0].available_beds || 0).toString(),
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

// Get KPIs for financial dashboard
const getKPIs = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔄 Fetching real-time KPIs from COA...');

    // Get all cash and bank account balances from COA in one query
    // Account codes: 10001 (Petty Cash), 10002 (Cash), 10003 (CBZ Bank), 10004 (CBZ Vault)
    // Using current_account_balances table directly
    const [balancesResult] = await connection.query(`
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        COALESCE(cab.current_balance, 0) as current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.code IN ('10001', '10002', '10003', '10004')
        AND coa.deleted_at IS NULL
        AND coa.type = 'Asset'
      ORDER BY coa.code
    `);

    console.log('📊 COA Balances Query Result:', JSON.stringify(balancesResult, null, 2));

    // Initialize balances
    let cash = 0;
    let cbzBank = 0;
    let cbzVault = 0;
    let pettyCashCOA = 0;

    // Map balances by account code
    balancesResult.forEach(balance => {
      const code = balance.account_code;
      const amount = parseFloat(balance.current_balance || 0);
      
      console.log(`💰 Mapping balance: ${code} (${balance.account_name}) = ${amount}`);
      
      switch(code) {
        case '10001': // Petty Cash (COA)
          pettyCashCOA = amount;
          break;
        case '10002': // Cash on Hand
          cash = amount;
          break;
        case '10003': // CBZ Bank Account
          cbzBank = amount;
          break;
        case '10004': // CBZ Vault
          cbzVault = amount;
          break;
      }
    });

    // Get total petty cash from petty_cash_accounts table (user petty cash accounts)
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(pca.current_balance), 0) as total_petty_cash
      FROM petty_cash_accounts pca
      WHERE pca.deleted_at IS NULL 
        AND pca.status = 'active'
    `);

    const totalPettyCash = parseFloat(pettyCashResult[0]?.total_petty_cash || 0);

    console.log('📊 Real-time KPIs from COA:', {
      cash,
      cbzBank,
      cbzVault,
      pettyCashCOA,
      totalPettyCash
    });

    res.json({
      cash,
      cbzBank,
      cbzVault,
      totalPettyCash
    });

  } catch (error) {
    console.error('❌ Error in getKPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get monthly revenue data
const getMonthlyRevenue = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id || 4;

    const [monthlyData] = await connection.query(`
      SELECT 
        DATE_FORMAT(sp.created_at, '%Y-%m') as month,
        COALESCE(SUM(sp.amount), 0) as revenue
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      WHERE s.boarding_house_id = ?
        AND sp.deleted_at IS NULL
      GROUP BY DATE_FORMAT(sp.created_at, '%Y-%m')
      ORDER BY month
    `, [boardingHouseId]);

    const [expenseData] = await connection.query(`
      SELECT 
        DATE_FORMAT(e.created_at, '%Y-%m') as month,
        COALESCE(SUM(e.amount), 0) as expenses
      FROM expenses e
      WHERE e.boarding_house_id = ?
        AND e.deleted_at IS NULL
      GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
      ORDER BY month
    `, [boardingHouseId]);

    // Create a map of all months with data
    const allMonths = new Set();
    monthlyData.forEach(d => allMonths.add(d.month));
    expenseData.forEach(d => allMonths.add(d.month));
    
    const fullData = Array.from(allMonths).sort().map(month => {
      const revenueData = monthlyData.find(d => d.month === month);
      const expenseDataItem = expenseData.find(d => d.month === month);
      return {
        month: month,
        revenue: revenueData ? parseFloat(revenueData.revenue) : 0,
        expenses: expenseDataItem ? parseFloat(expenseDataItem.expenses) : 0
      };
    });

    res.json(fullData);

  } catch (error) {
    console.error('Error in getMonthlyRevenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly revenue data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get invoice status distribution
const getInvoiceStatus = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id || 4;

    const [statusData] = await connection.query(`
      SELECT 
        CASE 
          WHEN sps.status = 'paid' THEN 'Paid'
          WHEN sps.status = 'pending' AND sps.period_start_date > CURDATE() THEN 'Pending'
          WHEN sps.status = 'pending' AND sps.period_start_date <= CURDATE() THEN 'Overdue'
          ELSE 'Draft'
        END as status,
        COUNT(*) as count
      FROM student_payment_schedules sps
      JOIN students s ON sps.student_id = s.id
      WHERE s.boarding_house_id = ?
        AND s.deleted_at IS NULL
      GROUP BY status
    `, [boardingHouseId]);

    const colors = {
      'Paid': '#10B981',
      'Pending': '#F59E0B',
      'Overdue': '#EF4444',
      'Draft': '#6B7280'
    };

    const result = statusData.map(item => ({
      name: item.status,
      value: parseInt(item.count),
      color: colors[item.status] || '#6B7280'
    }));

    res.json(result);

  } catch (error) {
    console.error('Error in getInvoiceStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice status data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get expense categories
const getExpenseCategories = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id || 4;

    const [categoryData] = await connection.query(`
      SELECT 
        'General Expenses' as category,
        SUM(e.amount) as total_amount
      FROM expenses e
      WHERE e.boarding_house_id = ?
        AND e.deleted_at IS NULL
      GROUP BY 1
      ORDER BY total_amount DESC
    `, [boardingHouseId]);

    const colors = [
      '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', 
      '#F59E0B', '#f58020', '#06B6D4'
    ];

    const result = categoryData.map((item, index) => ({
      name: item.category,
      value: parseFloat(item.total_amount),
      color: colors[index % colors.length]
    }));

    res.json(result);

  } catch (error) {
    console.error('Error in getExpenseCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id || 4;

    const [paymentData] = await connection.query(`
      SELECT 
        COALESCE(sp.payment_method, 'Cash') as method,
        COUNT(*) as count
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      WHERE s.boarding_house_id = ?
        AND s.deleted_at IS NULL
        AND sp.deleted_at IS NULL
      GROUP BY sp.payment_method
      ORDER BY count DESC
    `, [boardingHouseId]);

    const result = paymentData.map(item => ({
      name: item.method,
      value: parseInt(item.count)
    }));

    res.json(result);

  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get petty cash balances for dashboard
const getPettyCashBalances = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔄 Fetching real-time petty cash balances...');

    // Get petty cash balances by individual users
    const [pettyCashResult] = await connection.query(`
      SELECT 
        pcu.username as user,
        bh.name as location,
        COALESCE(pca.current_balance, 0) as balance
      FROM petty_cash_users pcu
      LEFT JOIN boarding_houses bh ON pcu.boarding_house_id = bh.id
      LEFT JOIN petty_cash_accounts pca ON pcu.id = pca.petty_cash_user_id 
        AND pca.deleted_at IS NULL 
        AND pca.status = 'active'
      WHERE pcu.deleted_at IS NULL
        AND bh.deleted_at IS NULL
      ORDER BY pcu.username
    `);

    console.log('💰 Petty cash balances:', pettyCashResult);

    // Format the response
    const pettyCashBalances = {};
    pettyCashResult.forEach(item => {
      const userKey = `${item.user} (${item.location})`;
      pettyCashBalances[userKey] = parseFloat(item.balance);
    });

    res.json(pettyCashBalances);

  } catch (error) {
    console.error('Error in getPettyCashBalances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch petty cash balances',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get recent activities
const getActivities = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id || 4;

    const [activities] = await connection.query(`
      SELECT 
        'Student Registration' as type,
        CONCAT('Student ID: ', s.id) as description,
        s.created_at as timestamp,
        'success' as status
      FROM students s
      WHERE s.boarding_house_id = ? AND s.deleted_at IS NULL
      
      UNION ALL
      
      SELECT 
        'Payment Received' as type,
        CONCAT('$', FORMAT(sp.amount, 2), ' - Student ID: ', sp.student_id) as description,
        sp.created_at as timestamp,
        'success' as status
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      WHERE s.boarding_house_id = ? AND sp.deleted_at IS NULL
      
      UNION ALL
      
      SELECT 
        'Expense Added' as type,
        CONCAT('$', FORMAT(e.amount, 2), ' - ', e.description) as description,
        e.created_at as timestamp,
        'warning' as status
      FROM expenses e
      WHERE e.boarding_house_id = ? AND e.deleted_at IS NULL
      
      ORDER BY timestamp DESC
      LIMIT 10
    `, [boardingHouseId, boardingHouseId, boardingHouseId]);

    const result = activities.map(activity => ({
      type: activity.status,
      description: activity.description,
      time: new Date(activity.timestamp).toLocaleDateString()
    }));

    res.json(result);

  } catch (error) {
    console.error('Error in getActivities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get consolidated monthly revenue and expenses for boss portal (all boarding houses)
// Uses the EXACT same logic as income statement: journal entries based on transaction_date
const getConsolidatedMonthlyRevenueExpenses = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.query("SET time_zone = '+00:00'");
    
    // Get last 6 months of data - using EXACT income statement logic
    // Revenue: Credit entries to Revenue accounts based on transaction_date
    // Expenses: Debit entries to Expense accounts based on transaction_date
    const [monthlyData] = await connection.query(`
      WITH RECURSIVE months AS (
        SELECT 
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01') as month_start,
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') as month_key,
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%b %Y') as month_name,
          1 as month_num
        UNION ALL
        SELECT 
          DATE_ADD(month_start, INTERVAL 1 MONTH),
          DATE_FORMAT(DATE_ADD(month_start, INTERVAL 1 MONTH), '%Y-%m'),
          DATE_FORMAT(DATE_ADD(month_start, INTERVAL 1 MONTH), '%b %Y'),
          month_num + 1
        FROM months
        WHERE month_num < 6
      )
      SELECT 
        m.month_name as month,
        m.month_key,
        m.month_start,
        -- Revenue: Credit entries to Revenue accounts (EXACT income statement logic)
        COALESCE((
          SELECT SUM(je.amount)
          FROM journal_entries je
          INNER JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL
          INNER JOIN chart_of_accounts coa ON je.account_id = coa.id AND coa.deleted_at IS NULL
          WHERE DATE(t.transaction_date) >= DATE(m.month_start)
            AND DATE(t.transaction_date) < DATE_ADD(m.month_start, INTERVAL 1 MONTH)
            AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
            AND je.entry_type = 'credit'
            AND UPPER(TRIM(coa.type)) = 'REVENUE'
            AND je.deleted_at IS NULL
        ), 0) as revenue,
        -- Expenses: Debit entries to Expense accounts (EXACT income statement logic)
        COALESCE((
          SELECT SUM(je.amount)
          FROM journal_entries je
          INNER JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL
          INNER JOIN chart_of_accounts coa ON je.account_id = coa.id AND coa.deleted_at IS NULL
          WHERE DATE(t.transaction_date) >= DATE(m.month_start)
            AND DATE(t.transaction_date) < DATE_ADD(m.month_start, INTERVAL 1 MONTH)
            AND t.status = 'posted'
            AND je.entry_type = 'debit'
            AND coa.type = 'Expense'
            AND je.deleted_at IS NULL
        ), 0) as expenses
      FROM months m
      ORDER BY m.month_start
    `);
    
    console.log('📊 Monthly Revenue/Expenses Data (using income statement logic):');
    monthlyData.forEach(month => {
      console.log(`  ${month.month}: Revenue=$${month.revenue}, Expenses=$${month.expenses}`);
    });

    const result = monthlyData.map(item => ({
      month: item.month,
      revenue: Math.round(parseFloat(item.revenue || 0)),
      expenses: Math.round(parseFloat(item.expenses || 0)),
      profit: Math.round(parseFloat(item.revenue || 0) - parseFloat(item.expenses || 0))
    }));

    res.json(result);

  } catch (error) {
    console.error('Error in getConsolidatedMonthlyRevenueExpenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consolidated monthly revenue and expenses',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get consolidated expense categories for boss portal (all boarding houses)
const getConsolidatedExpenseCategories = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.query("SET time_zone = '+00:00'");
    const [categoryData] = await connection.query(`
      SELECT 
        coa.name as category,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE DATE(t.transaction_date) >= DATE(DATE_SUB(CURDATE(), INTERVAL 5 MONTH))
        AND t.status = 'posted'
        AND je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND bh.deleted_at IS NULL
      GROUP BY coa.id, coa.name
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    const colors = [
      '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', 
      '#F59E0B', '#f58020', '#06B6D4', '#EC4899', '#14B8A6', '#6366F1'
    ];

    const result = categoryData.map((item, index) => ({
      name: item.category,
      value: parseFloat(item.total_amount),
      color: colors[index % colors.length]
    }));

    res.json(result);

  } catch (error) {
    console.error('Error in getConsolidatedExpenseCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consolidated expense categories',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getDashboardData,
  getDashboardStats,
  getKPIs,
  getPettyCashBalances,
  getMonthlyRevenue,
  getInvoiceStatus,
  getExpenseCategories,
  getPaymentMethods,
  getActivities,
  getConsolidatedMonthlyRevenueExpenses,
  getConsolidatedExpenseCategories
};