const db = require('../services/db');

/**
 * Generate comprehensive income statement with all financial data
 * Includes: Revenue, Expenses, Accounts Payable, Accounts Receivable
 * Returns monthly breakdown for the specified year
 */
const generateIncomeStatement = async (req, res) => {
  try {
    const { year, boardingHouseId, isConsolidated, startDate, endDate } = req.query;
    
    // Convert string parameters to proper types
    const isConsolidatedBool = isConsolidated === 'true';
    const boardingHouseIdNum = boardingHouseId ? parseInt(boardingHouseId) : null;
    
    // Determine date range - prioritize custom date range over year
    let dateStart, dateEnd;
    if (startDate && endDate) {
      dateStart = startDate;
      dateEnd = endDate;
    } else {
      const currentYear = year || new Date().getFullYear();
      dateStart = `${currentYear}-01-01`;
      dateEnd = `${currentYear}-12-31`;
    }

    console.log('=== INCOME STATEMENT PARAMETERS ===');
    console.log('Date Range:', { startDate: dateStart, endDate: dateEnd });
    console.log('Boarding House ID:', boardingHouseIdNum);
    console.log('Is Consolidated:', isConsolidatedBool);

    // Create transactions for overdue payments before generating the report
    try {
      await createOverduePaymentTransactions();
    } catch (overdueError) {
      console.warn('Warning: Could not create overdue payment transactions:', overdueError.message);
      // Continue with report generation even if overdue transactions fail
    }

    // Get all financial data in parallel for the date range
    const [
      revenueData,
      expenseData,
      boardingHouses
    ] = await Promise.all([
      getRevenueData(dateStart, dateEnd, boardingHouseIdNum, isConsolidatedBool),
      getExpenseData(dateStart, dateEnd, boardingHouseIdNum, isConsolidatedBool),
      getBoardingHouses()
    ]);

    // Calculate totals for each account type
    const revenueTotal = revenueData.reduce((sum, item) => sum + item.amount, 0);
    const expensesTotal = expenseData.reduce((sum, item) => sum + item.amount, 0);

    const response = {
      success: true,
      data: {
        dateRange: { startDate: dateStart, endDate: dateEnd },
        boardingHouses: isConsolidatedBool ? 'All Boarding Houses' : boardingHouses.filter(bh => 
          !boardingHouseIdNum || bh.id == boardingHouseIdNum
        ).map(bh => bh.name).join(', '),
        revenue: {
          total: revenueTotal, // Only actual revenue from invoices
          accounts: [
            ...revenueData.map(account => ({
              account_id: account.account_id,
              account_name: account.account_name,
              account_code: account.account_code,
              amount: account.amount
            }))
          ]
        },
        expenses: {
          total: expensesTotal, // All expenses from journal entries
          accounts: [
            ...expenseData.map(account => ({
              account_id: account.account_id,
              account_name: account.account_name,
              account_code: account.account_code,
              amount: account.amount
            }))
          ]
        },
        summary: {
          totalRevenue: revenueTotal,
          totalExpenses: expensesTotal,
          netIncome: revenueTotal - expensesTotal
        }
      }
    };

    console.log('=== INCOME STATEMENT RESPONSE ===');
    console.log('Full Response:', JSON.stringify(response, null, 2));

    res.json(response);

  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Get revenue data from journal entries for date range
 * This shows rental income based on when invoices were created (credit entries to revenue accounts)
 */
const getRevenueData = async (startDate, endDate, boardingHouseId, isConsolidated) => {
  const connection = await db.getConnection();
  
  try {
    let query = `
      SELECT 
        coa.name as account_name,
        coa.type as account_type,
        coa.id as account_id,
        coa.code as account_code,
        SUM(je.amount) as amount,
        COUNT(DISTINCT t.id) as transaction_count,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND t.status = 'posted'
        AND je.entry_type = 'credit'
        AND coa.type = 'Revenue'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND bh.deleted_at IS NULL
    `;

    let params = [startDate, endDate];

    if (!isConsolidated && boardingHouseId) {
      query += ' AND je.boarding_house_id = ?';
      params.push(boardingHouseId);
    }

    query += `
      GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name
      ORDER BY coa.code, bh.name
    `;

    console.log('Revenue Query (from journal entries):', query);
    console.log('Revenue Params:', params);

    const [results] = await connection.query(query, params);
  
    console.log('\n=== REVENUE RESULTS BREAKDOWN ===');
    console.log('Total revenue records found:', results.length);
    
    results.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.account_name} (${row.account_code})`);
      console.log(`   Boarding House: ${row.boarding_house_name}`);
      console.log(`   Amount: $${row.amount}`);
      console.log(`   Transaction Count: ${row.transaction_count}`);
    });
    
    const totalRevenue = results.reduce((sum, row) => sum + Number(row.amount), 0);
    console.log(`\nTOTAL REVENUE: $${totalRevenue}`);
    console.log('=================================\n');
    
    return results.map(row => ({
      account_id: row.account_id,
      account_name: row.account_name,
      account_type: row.account_type,
      account_code: row.account_code,
      amount: Number(row.amount), // Preserve exact decimal precision without rounding
      transaction_count: row.transaction_count,
      boarding_house_name: row.boarding_house_name
    }));
  } catch (error) {
    console.error('Error in getRevenueData:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get expense data from journal entries - includes ALL expenses (regular and petty cash)
 */
const getExpenseData = async (startDate, endDate, boardingHouseId, isConsolidated) => {
  const connection = await db.getConnection();
  
  try {
    let query = `
      SELECT 
        coa.name as account_name,
        coa.type as account_type,
        coa.id as account_id,
        coa.code as account_code,
        SUM(je.amount) as amount,
        COUNT(DISTINCT t.id) as transaction_count,
        bh.name as boarding_house_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN boarding_houses bh ON je.boarding_house_id = bh.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND t.status = 'posted'
        AND je.entry_type = 'debit'
        AND coa.type = 'Expense'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND bh.deleted_at IS NULL
    `;

    let params = [startDate, endDate];

    if (!isConsolidated && boardingHouseId) {
      query += ' AND je.boarding_house_id = ?';
      params.push(boardingHouseId);
    }

    query += `
      GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name
      ORDER BY coa.code, bh.name
    `;

    console.log('Expense Query:', query);
    console.log('Expense Params:', params);

    const [results] = await connection.query(query, params);
    
    return results.map(row => ({
      account_id: row.account_id,
      account_name: row.account_name,
      account_type: row.account_type,
      account_code: row.account_code,
      amount: Number(row.amount), // Preserve exact decimal precision without rounding
      transaction_count: row.transaction_count,
      boarding_house_name: row.boarding_house_name
    }));
  } catch (error) {
    console.error('Error in getExpenseData:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get accounts payable data - credit expenses that haven't been paid yet
 * Matches the logic from accountsPayableController.js
 */
const getAccountsPayableData = async (startDate, endDate, boardingHouseId, isConsolidated) => {
  const connection = await db.getConnection();
  
  try {
    let query = `
    SELECT 
      e.id,
      e.reference_number as invoice_number,
      e.expense_date as date,
      e.expense_date as due_date,
      e.total_amount as amount,
      e.remaining_balance as balance,
      CASE 
        WHEN e.payment_status = 'full' THEN 'paid'
        WHEN e.payment_status = 'partial' THEN 'partial'
        ELSE 'pending'
      END as status,
      e.description,
      e.payment_method,
      e.notes,
      e.created_at,
      coa.name as account_name,
      s.company as supplier_name,
      s.contact_person as supplier_contact,
      bh.name as boarding_house_name,
      bh.id as boarding_house_id,
      DATEDIFF(CURDATE(), e.expense_date) as days_overdue
    FROM expenses e
    LEFT JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
    WHERE e.payment_method = 'credit'
      AND e.payment_status IN ('debt', 'partial')
      AND e.deleted_at IS NULL
      AND coa.deleted_at IS NULL
      AND bh.deleted_at IS NULL
  `;

  let params = [];

  if (!isConsolidated && boardingHouseId) {
    query += ' AND e.boarding_house_id = ?';
    params.push(boardingHouseId);
  }

  // Optionally filter by date range if provided
  if (startDate && endDate) {
    query += ' AND e.expense_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    console.log('=== ACCOUNTS PAYABLE FUNCTION ===');
    console.log('Date Range:', { startDate, endDate });
    console.log('Boarding House ID:', boardingHouseId);
    console.log('Is Consolidated:', isConsolidated);
    console.log('Query:', query);
    console.log('Params:', params);

    const [results] = await connection.query(query, params);

    console.log('Total Payables Found:', results.length);
    console.log('Payables Total Balance:', results.reduce((sum, p) => sum + parseFloat(p.balance), 0));

    return results.map(row => ({
      id: row.id,
      invoice_number: row.invoice_number,
      date: row.date,
      due_date: row.due_date,
      amount: parseFloat(row.amount),
      balance: parseFloat(row.balance),
      status: row.status,
      description: row.description,
      payment_method: row.payment_method,
      notes: row.notes,
      created_at: row.created_at,
      account_name: row.account_name,
      supplier_name: row.supplier_name,
      supplier_contact: row.supplier_contact,
      boarding_house_name: row.boarding_house_name,
      boarding_house_id: row.boarding_house_id,
      days_overdue: row.days_overdue
    }));
  } catch (error) {
    console.error('Error in getAccountsPayableData:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Create transactions for overdue payments
 */
const createOverduePaymentTransactions = async () => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get all overdue payment schedules that don't have transactions yet
    const [overdueSchedules] = await connection.query(`
      SELECT 
        sps.id as schedule_id,
        sps.student_id,
        sps.enrollment_id,
        sps.amount_due,
        sps.amount_paid,
        (sps.amount_due - sps.amount_paid) as overdue_amount,
        sps.period_end_date,
        se.boarding_house_id,
        s.full_name as student_name
      FROM student_payment_schedules sps
      JOIN student_enrollments se ON sps.enrollment_id = se.id
      JOIN students s ON sps.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      WHERE sps.period_end_date < CURDATE()
        AND sps.status IN ('pending', 'partial')
        AND (sps.amount_due - sps.amount_paid) > 0
        AND sps.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM transactions t 
          WHERE t.description LIKE CONCAT('%Schedule ID: ', sps.id, '%')
          AND t.transaction_type = 'overdue_rent'
          AND t.deleted_at IS NULL
        )
    `);

    for (const schedule of overdueSchedules) {
      // Create transaction for overdue payment
      const transactionRef = `OVERDUE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [transactionResult] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, transaction_date, reference, description, 
          amount, currency, status, boarding_house_id, created_by
        ) VALUES (?, ?, ?, ?, ?, 'USD', 'posted', ?, ?)`,
        [
          'overdue_rent',
          schedule.period_end_date,
          transactionRef,
          `Overdue rent - ${schedule.student_name} - Schedule ID: ${schedule.schedule_id}`,
          schedule.overdue_amount,
          schedule.boarding_house_id,
          1 // Default user ID
        ]
      );

      // Use boarding_house_id as branch_id for chart of accounts
      const branchId = schedule.boarding_house_id;

      // Get or create required accounts
      // Check for Accounts Receivable (10005)
      let [receivableAccount] = await connection.query(
        `SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL LIMIT 1`,
        []
      );

      if (receivableAccount.length === 0) {
        // Create Accounts Receivable account if it doesn't exist
        await connection.query(
          `INSERT INTO chart_of_accounts (code, name, type, is_category, created_by, created_at, updated_at)
           VALUES ('10005', 'Accounts Receivable', 'Asset', false, 1, NOW(), NOW())`,
          []
        );
        [receivableAccount] = await connection.query(
          `SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL LIMIT 1`,
          []
        );
      }

      // Check for Rental Income (40001)
      let [incomeAccount] = await connection.query(
        `SELECT id FROM chart_of_accounts WHERE code = '40001' AND deleted_at IS NULL LIMIT 1`,
        []
      );

      if (incomeAccount.length === 0) {
        // Create Rental Income account if it doesn't exist
        await connection.query(
          `INSERT INTO chart_of_accounts (code, name, type, is_category, created_by, created_at, updated_at)
           VALUES ('40001', 'Rentals Income', 'Revenue', false, 1, NOW(), NOW())`,
          []
        );
        [incomeAccount] = await connection.query(
          `SELECT id FROM chart_of_accounts WHERE code = '40001' AND deleted_at IS NULL LIMIT 1`,
          []
        );
      }

      // Create journal entries
      // Debit: Accounts Receivable
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
        [
          transactionResult.insertId,
          receivableAccount[0].id,
          schedule.overdue_amount,
          `Overdue rent receivable - ${schedule.student_name}`,
          schedule.boarding_house_id,
          1
        ]
      );

      // Credit: Rental Income
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by
        ) VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
        [
          transactionResult.insertId,
          incomeAccount[0].id,
          schedule.overdue_amount,
          `Overdue rent income - ${schedule.student_name}`,
          schedule.boarding_house_id,
          1
        ]
      );
    }

    await connection.commit();
    return { success: true, transactionsCreated: overdueSchedules.length };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get accounts receivable data - comprehensive debt calculation matching debtors report logic
 * Returns a list of all outstanding receivables per student, per boarding house.
 */
const getAccountsReceivableData = async (startDate, endDate, boardingHouseId, isConsolidated) => {
  const connection = await db.getConnection();
  
  try {
    let whereClause = '';
    let queryParams = [];
    
    // Handle consolidated vs specific boarding house
    if (!isConsolidated && boardingHouseId) {
      whereClause = 'AND se.boarding_house_id = ?';
      queryParams.push(boardingHouseId);
    }

    // Get all active enrolled students (same logic as debtors report)
    const [activeStudents] = await connection.query(
      `SELECT 
        s.id as student_id,
        s.full_name as student_name,
        se.id as enrollment_id,
        se.admin_fee,
        se.security_deposit,
        se.start_date as enrollment_start,
        se.expected_end_date as enrollment_end,
        r.name as room_number,
        bh.name as boarding_house_name,
        s.status as student_status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND s.status = 'Active'
        AND se.start_date <= CURRENT_DATE
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        ${whereClause}
      ORDER BY bh.name, s.full_name`,
      queryParams
    );

    const receivables = [];

    // For each active student, calculate their debts (same logic as debtors report)
    for (const student of activeStudents) {
      let totalDebt = 0;
      let adminFeeDebt = 0;
      let securityDepositDebt = 0;
      let rentDebt = 0;
      let earliestOverdueDate = null;

      // Check admin fee payment
      if (student.admin_fee > 0) {
        const [adminFeePayments] = await connection.query(
          `SELECT COALESCE(SUM(amount), 0) as total_paid
           FROM student_payments
           WHERE student_id = ? 
             AND enrollment_id = ?
             AND payment_type = 'admin_fee'
             AND status = 'completed'
             AND deleted_at IS NULL`,
          [student.student_id, student.enrollment_id]
        );

        const adminFeePaid = parseFloat(adminFeePayments[0].total_paid) || 0;
        adminFeeDebt = Math.max(0, student.admin_fee - adminFeePaid);
        totalDebt += adminFeeDebt;
        
        if (adminFeeDebt > 0 && (!earliestOverdueDate || student.enrollment_start < earliestOverdueDate)) {
          earliestOverdueDate = student.enrollment_start;
        }
      }

      // Check security deposit payment
      if (student.security_deposit > 0) {
        const [securityDepositPayments] = await connection.query(
          `SELECT COALESCE(SUM(amount), 0) as total_paid
           FROM student_payments
           WHERE student_id = ? 
             AND enrollment_id = ?
             AND payment_type = 'security_deposit'
             AND status = 'completed'
             AND deleted_at IS NULL`,
          [student.student_id, student.enrollment_id]
        );

        const securityDepositPaid = parseFloat(securityDepositPayments[0].total_paid) || 0;
        securityDepositDebt = Math.max(0, student.security_deposit - securityDepositPaid);
        totalDebt += securityDepositDebt;
        
        if (securityDepositDebt > 0 && (!earliestOverdueDate || student.enrollment_start < earliestOverdueDate)) {
          earliestOverdueDate = student.enrollment_start;
        }
      }

      // Check rent payment schedules for overdue/unpaid amounts
      let rentSchedulesQuery = `
        SELECT 
          sps.id,
          sps.period_start_date,
          sps.period_end_date,
          sps.amount_due,
          sps.amount_paid,
          sps.status
        FROM student_payment_schedules sps
        WHERE sps.student_id = ?
          AND sps.enrollment_id = ?
          AND sps.deleted_at IS NULL
          AND (sps.status = 'pending' OR sps.status = 'partial' OR 
               (sps.status = 'paid' AND sps.amount_paid < sps.amount_due))
      `;
      
      let rentSchedulesParams = [student.student_id, student.enrollment_id];
      
      // Filter by date range if provided
      if (startDate && endDate) {
        rentSchedulesQuery += ' AND sps.period_end_date BETWEEN ? AND ?';
        rentSchedulesParams.push(startDate, endDate);
      }
      
      rentSchedulesQuery += ' ORDER BY sps.period_start_date';
      
      const [rentSchedules] = await connection.query(rentSchedulesQuery, rentSchedulesParams);

      for (const schedule of rentSchedules) {
        const scheduleRentDebt = schedule.amount_due - (schedule.amount_paid || 0);
        
        if (scheduleRentDebt > 0) {
          // Check if this rent period is overdue (past the end date)
          const isOverdue = new Date(schedule.period_end_date) < new Date();
          
          if (isOverdue || schedule.status === 'partial') {
            rentDebt += scheduleRentDebt;

            if (isOverdue && (!earliestOverdueDate || schedule.period_end_date < earliestOverdueDate)) {
              earliestOverdueDate = schedule.period_end_date;
            }
          }
        }
      }

      totalDebt += rentDebt;

      // If student has any debt, add to receivables list
      if (totalDebt > 0) {
        const daysOverdue = earliestOverdueDate 
          ? Math.max(0, Math.floor((new Date() - new Date(earliestOverdueDate)) / (1000 * 60 * 60 * 24)))
          : 0;

        receivables.push({
          student_id: student.student_id,
          student_name: student.student_name,
          room_number: student.room_number,
          boarding_house_name: student.boarding_house_name,
          total_due: totalDebt,
          debt_breakdown: {
            admin_fee: adminFeeDebt,
            security_deposit: securityDepositDebt,
            rent: rentDebt
          },
          days_overdue: daysOverdue,
          earliest_overdue_date: earliestOverdueDate,
          enrollment_id: student.enrollment_id
        });
      }
    }

    console.log('=== ACCOUNTS RECEIVABLE FUNCTION ===');
    console.log('Date Range:', { startDate, endDate });
    console.log('Boarding House ID:', boardingHouseId);
    console.log('Is Consolidated:', isConsolidated);
    console.log('Total Receivables Found:', receivables.length);
    console.log('Receivables Total Amount:', receivables.reduce((sum, r) => sum + r.total_due, 0));

    return receivables;

  } catch (error) {
    console.error('Error in getAccountsReceivableData:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get boarding houses for reference
 */
const getBoardingHouses = async () => {
  const connection = await db.getConnection();
  try {
    const [results] = await connection.query(`
      SELECT id, name 
      FROM boarding_houses 
      WHERE deleted_at IS NULL 
      ORDER BY name
    `);
    return results;
  } catch (error) {
    console.error('Error in getBoardingHouses:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Save income statement for future reference
 */
const saveIncomeStatement = async (req, res) => {
  try {
    const {
      name,
      startDate,
      endDate,
      boardingHouseId,
      isConsolidated, 
      apiResponse
    } = req.body;

    if (!name || !startDate || !endDate || !apiResponse) {
      return res.status(400).json({ 
        message: 'Statement name, date range, and API response are required' 
      });
    }

    // Ensure apiResponse is properly stringified
    let apiResponseJson;
    try {
      if (typeof apiResponse === 'string') {
        // If it's already a string, try to parse and re-stringify to ensure it's valid JSON
        if (apiResponse === '[object Object]') {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid API response format - object not properly serialized' 
          });
        }
        apiResponseJson = JSON.stringify(JSON.parse(apiResponse));
      } else if (typeof apiResponse === 'object' && apiResponse !== null) {
        // If it's an object, stringify it
        apiResponseJson = JSON.stringify(apiResponse);
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid API response format - must be object or valid JSON string' 
        });
      }
    } catch (error) {
      console.error('Error processing apiResponse:', error);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid API response format' 
      });
    }

    const [result] = await db.query(`
      INSERT INTO saved_income_statements 
      (name, start_date, end_date, boarding_house_id, is_consolidated, api_response, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      startDate,
      endDate,
      boardingHouseId || null,
      isConsolidated || false,
      apiResponseJson,
      req.user?.id || 1 // Default to user ID 1 if not available
    ]);

    res.json({
      success: true,
      message: 'Income statement saved successfully',
      statementId: result.insertId
    });

  } catch (error) {
    console.error('Error saving income statement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Get saved income statements
 */
const getSavedIncomeStatements = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        sis.id,
        sis.name,
        sis.start_date,
        sis.end_date,
        sis.boarding_house_id,
        sis.is_consolidated,
        sis.created_at,
        u.username as created_by_name
      FROM saved_income_statements sis
      LEFT JOIN users u ON sis.created_by = u.id
      WHERE sis.deleted_at IS NULL
      ORDER BY sis.created_at DESC
    `);

    const statements = results.map(row => {
      return {
        id: row.id,
        name: row.name,
        dateRange: {
          startDate: row.start_date,
          endDate: row.end_date
        },
        boardingHouseId: row.boarding_house_id,
        isConsolidated: row.is_consolidated,
        createdAt: row.created_at,
        createdBy: row.created_by_name
      };
    });

    res.json({
      success: true,
      statements
    });

  } catch (error) {
    console.error('Error fetching saved income statements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Get a specific saved income statement
 */
const getSavedIncomeStatement = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query(`
      SELECT *
      FROM saved_income_statements
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Saved income statement not found' 
      });
    }

    const statement = results[0];
    
    // Console log the raw response from database
    console.log('=== SAVED INCOME STATEMENT DEBUG ===');
    console.log('Statement ID:', statement.id);
    console.log('Statement Name:', statement.name);
    console.log('Raw api_response from DB:', statement.api_response);
    console.log('api_response type:', typeof statement.api_response);
    console.log('api_response length:', statement.api_response ? statement.api_response.length : 'null/undefined');
    
    // Handle the API response - it might be an object or JSON string
    let apiResponse = {};
    try {
      if (statement.api_response) {
        if (typeof statement.api_response === 'object') {
          // If it's already an object, use it directly
          apiResponse = statement.api_response;
          console.log('Using api_response as object directly');
        } else if (typeof statement.api_response === 'string') {
          // If it's a string, try to parse it
          if (statement.api_response !== '' && statement.api_response !== '[object Object]') {
            apiResponse = JSON.parse(statement.api_response);
            console.log('Successfully parsed api_response from string');
          } else {
            console.warn('Invalid api_response string format for statement:', statement.id, statement.api_response);
            apiResponse = {};
          }
        } else {
          console.warn('Unexpected api_response type for statement:', statement.id, typeof statement.api_response);
          apiResponse = {};
        }
      }
    } catch (e) {
      console.warn('Failed to process api_response for statement:', statement.id, e);
      console.log('Error details:', e.message);
      apiResponse = {};
    }
    
    res.json({
      success: true,
      statement: {
        id: statement.id,
        name: statement.name,
        dateRange: {
          startDate: statement.start_date,
          endDate: statement.end_date
        },
        boardingHouseId: statement.boarding_house_id,
        isConsolidated: statement.is_consolidated,
        apiResponse: apiResponse,
        createdAt: statement.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching saved income statement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Delete a saved income statement
 */
const deleteSavedIncomeStatement = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`
      UPDATE saved_income_statements 
      SET deleted_at = NOW() 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Income statement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting saved income statement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  generateIncomeStatement,
  createOverduePaymentTransactions,
  saveIncomeStatement,
  getSavedIncomeStatements,
  getSavedIncomeStatement,
  deleteSavedIncomeStatement
};