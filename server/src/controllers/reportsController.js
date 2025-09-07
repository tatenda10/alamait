const db = require('../services/db');

const getCashflowReport = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, start_date, end_date } = req.query;
    
    console.log('Cashflow request params:', { boarding_house_id, start_date, end_date });

    // Handle "all" boarding houses case
    let whereClause = '';
    let queryParams = [];
    
    if (boarding_house_id && boarding_house_id !== 'all') {
      whereClause = 'AND t.boarding_house_id = ?';
      queryParams.push(boarding_house_id);
    }

    // Get all cash and bank accounts (specific accounts from your chart)
    const [cashAccounts] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')  -- Petty Cash, Cash, CBZ Bank Account, CBZ Vault
       AND type = 'Asset'
       AND deleted_at IS NULL
       ORDER BY code`
    );

    const cashAccountIds = cashAccounts.map(acc => acc.id);
    console.log('Cash account IDs:', cashAccountIds);

    if (cashAccountIds.length === 0) {
      return res.json({
        inflows: [],
        outflows: [],
        totalInflows: { amount: 0 },
        totalOutflows: { amount: 0 },
        netCashflow: { amount: 0 }
      });
    }

    // Get all transactions with their journal entries for the period
    const [transactions] = await connection.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_debit.type as debit_account_type,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.type as credit_account_type,
        coa_credit.name as credit_account_name
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
        ${whereClause}
        AND (je_debit.account_id IN (${cashAccountIds.map(() => '?').join(',')}) 
             OR je_credit.account_id IN (${cashAccountIds.map(() => '?').join(',')}))
      ORDER BY t.transaction_date`,
      [start_date, end_date, ...queryParams, ...cashAccountIds, ...cashAccountIds]
    );

    console.log('Raw transactions count:', transactions.length);

    // Process transactions into inflows and outflows
    const inflows = [];
    const outflows = [];
    let totalInflows = 0;
    let totalOutflows = 0;

    // Group transactions by category
    const categoryTotals = {};
    const processedTransactions = new Set();

    transactions.forEach(transaction => {
      const { 
        id,
        amount,
        debit_account_id,
        credit_account_id,
        debit_account_code,
        credit_account_code,
        debit_account_name,
        credit_account_name,
        transaction_type
      } = transaction;

      // Skip if we've already processed this transaction
      if (processedTransactions.has(id)) {
        return;
      }

      const parsedAmount = Math.abs(parseFloat(amount || 0));

      // For cash inflows: when a cash account is debited (money coming in)
      if (cashAccountIds.includes(debit_account_id)) {
        let category = 'Other Income';
        
        // Determine category based on credit account
        if (credit_account_code?.startsWith('4')) {
          category = credit_account_name || 'Revenue';
        } else if (credit_account_code?.startsWith('2')) {
          category = 'Loan/Advance';
        } else if (credit_account_code?.startsWith('3')) {
          category = 'Owner Investment';
        }

        if (!categoryTotals[category]) {
          categoryTotals[category] = { inflow: 0, outflow: 0 };
        }
        categoryTotals[category].inflow += parsedAmount;
        totalInflows += parsedAmount;
        processedTransactions.add(id);
      }
      // For cash outflows: when a cash account is credited (money going out)
      else if (cashAccountIds.includes(credit_account_id)) {
        let category = 'Other Expenses';
        
        // Determine category based on debit account
        if (debit_account_code?.startsWith('5')) {
          category = debit_account_name || 'Operating Expenses';
        } else if (debit_account_code?.startsWith('2')) {
          category = 'Loan Repayment';
        } else if (debit_account_code?.startsWith('3')) {
          category = 'Owner Withdrawal';
        }

        if (!categoryTotals[category]) {
          categoryTotals[category] = { inflow: 0, outflow: 0 };
        }
        categoryTotals[category].outflow += parsedAmount;
        totalOutflows += parsedAmount;
        processedTransactions.add(id);
      }
      
      // Additional check: Handle expenses where cash is debited and expense is credited
      // This is the typical pattern for expense transactions
      if (debit_account_code?.startsWith('5') && cashAccountIds.includes(credit_account_id) && !processedTransactions.has(id)) {
        let category = debit_account_name || 'Operating Expenses';
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { inflow: 0, outflow: 0 };
        }
        categoryTotals[category].outflow += parsedAmount;
        totalOutflows += parsedAmount;
        processedTransactions.add(id);
      }
      
      // Additional check: Handle revenue where cash is credited and revenue is debited
      // This is the typical pattern for revenue transactions
      if (credit_account_code?.startsWith('4') && cashAccountIds.includes(debit_account_id) && !processedTransactions.has(id)) {
        let category = credit_account_name || 'Revenue';
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { inflow: 0, outflow: 0 };
        }
        categoryTotals[category].inflow += parsedAmount;
        totalInflows += parsedAmount;
        processedTransactions.add(id);
      }
    });

    console.log('Category totals:', categoryTotals);

    // Convert category totals to arrays
    for (const [category, totals] of Object.entries(categoryTotals)) {
      if (totals.inflow > 0) {
        inflows.push({
          category,
          amount: totals.inflow
        });
      }
      if (totals.outflow > 0) {
        outflows.push({
          category,
          amount: totals.outflow
        });
      }
    }

    // Sort by amount descending
    inflows.sort((a, b) => b.amount - a.amount);
    outflows.sort((a, b) => b.amount - a.amount);

    console.log('Response data:', {
      inflows,
      outflows,
      totalInflows,
      totalOutflows
    });

    res.json({
      inflows,
      outflows,
      totalInflows: { amount: totalInflows },
      totalOutflows: { amount: totalOutflows },
      netCashflow: { amount: totalInflows - totalOutflows }
    });

  } catch (error) {
    console.error('Error in getCashflowReport:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    connection.release();
  }
};

const exportCashflowReport = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, start_date, end_date } = req.query;

    // Handle "all" boarding houses case
    let whereClause = '';
    let queryParams = [];
    
    if (boarding_house_id && boarding_house_id !== 'all') {
      whereClause = 'AND t.boarding_house_id = ?';
      queryParams.push(boarding_house_id);
    }

    // Get all cash and bank accounts (specific accounts from your chart)
    const [cashAccounts] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')  -- Petty Cash, Cash, CBZ Bank Account, CBZ Vault
       AND type = 'Asset'
       AND deleted_at IS NULL
       ORDER BY code`
    );

    const cashAccountIds = cashAccounts.map(acc => acc.id);

    // Get all transactions with their journal entries
    const [transactions] = await connection.query(
      `SELECT 
        t.transaction_date,
        t.reference,
        t.amount,
        t.description as notes,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_debit.type as debit_account_type,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.type as credit_account_type,
        coa_credit.name as credit_account_name
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
        ${whereClause}
        AND (je_debit.account_id IN (${cashAccountIds.map(() => '?').join(',')}) 
             OR je_credit.account_id IN (${cashAccountIds.map(() => '?').join(',')}))
      ORDER BY t.transaction_date`,
      [start_date, end_date, ...queryParams, ...cashAccountIds, ...cashAccountIds]
    );

    // Get boarding house details for the report header
    let boardingHouseName = 'All Boarding Houses';
    if (boarding_house_id && boarding_house_id !== 'all') {
      const [boardingHouse] = await connection.query(
        'SELECT name FROM boarding_houses WHERE id = ?',
        [boarding_house_id]
      );
      if (boardingHouse.length > 0) {
        boardingHouseName = boardingHouse[0].name;
      }
    }

    // Generate CSV content
    let csvContent = 'Cashflow Report\n';
    csvContent += `${boardingHouseName}\n`;
    csvContent += `Period: ${start_date} to ${end_date}\n\n`;
    csvContent += 'Date,Reference,Category,Type,Amount,Notes\n';

    transactions.forEach(t => {
      let category, type, amount;
      
      // Determine if it's an inflow or outflow
      if (cashAccountIds.includes(t.debit_account_id)) {
        // Cash inflow: when a cash account is debited
        if (t.credit_account_code?.startsWith('4')) {
          category = t.credit_account_name || 'Revenue';
        } else if (t.credit_account_code?.startsWith('2')) {
          category = 'Loan/Advance';
        } else if (t.credit_account_code?.startsWith('3')) {
          category = 'Owner Investment';
        } else {
          category = 'Other Income';
        }
        type = 'Inflow';
        amount = Math.abs(parseFloat(t.amount));
      } else if (cashAccountIds.includes(t.credit_account_id)) {
        // Cash outflow: when a cash account is credited
        if (t.debit_account_code?.startsWith('5')) {
          category = t.debit_account_name || 'Operating Expenses';
        } else if (t.debit_account_code?.startsWith('2')) {
          category = 'Loan Repayment';
        } else if (t.debit_account_code?.startsWith('3')) {
          category = 'Owner Withdrawal';
        } else {
          category = 'Other Expenses';
        }
        type = 'Outflow';
        amount = -Math.abs(parseFloat(t.amount));
      }
      
      // Additional check: Handle expenses where expense is debited and cash is credited
      else if (t.debit_account_code?.startsWith('5') && cashAccountIds.includes(t.credit_account_id)) {
        category = t.debit_account_name || 'Operating Expenses';
        type = 'Outflow';
        amount = -Math.abs(parseFloat(t.amount));
      }
      
      // Additional check: Handle revenue where revenue is credited and cash is debited
      else if (t.credit_account_code?.startsWith('4') && cashAccountIds.includes(t.debit_account_id)) {
        category = t.credit_account_name || 'Revenue';
        type = 'Inflow';
        amount = Math.abs(parseFloat(t.amount));
      }

      if (category) {
        csvContent += `${new Date(t.transaction_date).toLocaleDateString()},`;
        csvContent += `${t.reference || ''},`;
        csvContent += `${category},`;
        csvContent += `${type},`;
        csvContent += `${amount},`;
        csvContent += `${(t.notes || '').replace(/,/g, ';')}\n`;
      }
    });

    // Calculate totals
    const totalInflows = transactions
      .filter(t => 
        cashAccountIds.includes(t.debit_account_id) || 
        (t.credit_account_code?.startsWith('4') && cashAccountIds.includes(t.debit_account_id))
      )
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const totalOutflows = transactions
      .filter(t => 
        cashAccountIds.includes(t.credit_account_id) || 
        (t.debit_account_code?.startsWith('5') && cashAccountIds.includes(t.credit_account_id))
      )
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    csvContent += '\nSummary\n';
    csvContent += `Total Inflows,${totalInflows}\n`;
    csvContent += `Total Outflows,${totalOutflows}\n`;
    csvContent += `Net Cashflow,${totalInflows - totalOutflows}\n`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cashflow-report-${start_date}-to-${end_date}.csv`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error in exportCashflowReport:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}; 

const getIncomeStatement = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, start_date, end_date } = req.query;

    // Get all revenue and expense accounts with their balances
    const [accounts] = await connection.query(
      `WITH RECURSIVE AccountHierarchy AS (
        -- Get all revenue and expense accounts
        SELECT 
          id,
          parent_id,
          code,
          name,
          type,
          CAST(code AS CHAR(255)) as path,
          1 as level
        FROM chart_of_accounts
        WHERE type IN ('Revenue', 'Expense')
          AND parent_id IS NULL
          AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT 
          c.id,
          c.parent_id,
          c.code,
          c.name,
          c.type,
          CONCAT(ah.path, ' > ', c.code),
          ah.level + 1
        FROM chart_of_accounts c
        JOIN AccountHierarchy ah ON c.parent_id = ah.id
        WHERE c.deleted_at IS NULL
      )
      SELECT 
        ah.id,
        ah.parent_id,
        ah.code,
        ah.name,
        ah.type,
        ah.path,
        ah.level,
        COALESCE(
          SUM(
            CASE 
              WHEN ah.type = 'Revenue' AND je.entry_type = 'credit' THEN je.amount
              WHEN ah.type = 'Revenue' AND je.entry_type = 'debit' THEN -je.amount
              WHEN ah.type = 'Expense' AND je.entry_type = 'debit' THEN je.amount
              WHEN ah.type = 'Expense' AND je.entry_type = 'credit' THEN -je.amount
            END
          ),
          0
        ) as balance
      FROM AccountHierarchy ah
      LEFT JOIN journal_entries je ON je.account_id = ah.id
      LEFT JOIN transactions t ON je.transaction_id = t.id
      WHERE (t.transaction_date BETWEEN ? AND ? OR t.id IS NULL)
        AND (t.deleted_at IS NULL OR t.id IS NULL)
        AND (t.status = 'posted' OR t.id IS NULL)
        AND (t.boarding_house_id = ? OR t.id IS NULL)
      GROUP BY ah.id, ah.parent_id, ah.code, ah.name, ah.type, ah.path, ah.level
      ORDER BY ah.path`,
      [start_date, end_date, boarding_house_id]
    );

    // Process accounts into revenue and expense sections
    const revenues = accounts.filter(acc => acc.type === 'Revenue');
    const expenses = accounts.filter(acc => acc.type === 'Expense');

    // Calculate totals
    const totalRevenue = revenues.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const netIncome = totalRevenue - totalExpenses;

    // Format the response
    const response = {
      period: {
      start_date,
        end_date
      },
      revenues: revenues.map(acc => ({
        code: acc.code,
        name: acc.name,
        amount: Math.abs(acc.balance),
        path: acc.path,
        level: acc.level
      })),
      expenses: expenses.map(acc => ({
        code: acc.code,
        name: acc.name,
        amount: Math.abs(acc.balance),
        path: acc.path,
        level: acc.level
      })),
      summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_income: netIncome
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getIncomeStatement:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const exportIncomeStatement = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, start_date, end_date } = req.query;

    // Get boarding house details
    const [boardingHouse] = await connection.query(
      'SELECT name FROM boarding_houses WHERE id = ?',
      [boarding_house_id]
    );

    // Get all revenue and expense accounts with their balances
    const [accounts] = await connection.query(
      `WITH RECURSIVE AccountHierarchy AS (
        SELECT 
          id,
          parent_id,
          code,
          name,
          type,
          CAST(code AS CHAR(255)) as path,
          1 as level
        FROM chart_of_accounts_branch
        WHERE branch_id = ?
          AND type IN ('Revenue', 'Expense')
          AND parent_id IS NULL
          AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT 
          c.id,
          c.parent_id,
          c.code,
          c.name,
          c.type,
          CONCAT(ah.path, ' > ', c.code),
          ah.level + 1
        FROM chart_of_accounts_branch c
        JOIN AccountHierarchy ah ON c.parent_id = ah.id
        WHERE c.deleted_at IS NULL
      )
      SELECT 
        ah.*,
        COALESCE(
          SUM(
            CASE 
              WHEN je.entry_type = 'debit' THEN je.amount
              WHEN je.entry_type = 'credit' THEN -je.amount
            END
          ),
          0
        ) as balance
      FROM AccountHierarchy ah
      LEFT JOIN journal_entries je ON je.account_id = ah.id
      LEFT JOIN transactions t ON je.transaction_id = t.id
      WHERE (t.transaction_date BETWEEN ? AND ? OR t.id IS NULL)
        AND (t.deleted_at IS NULL OR t.id IS NULL)
        AND (t.status = 'posted' OR t.id IS NULL)
      GROUP BY ah.id
      ORDER BY ah.path`,
      [boarding_house_id, start_date, end_date]
    );

    // Generate CSV content
    let csvContent = 'Income Statement\n';
    csvContent += `${boardingHouse[0].name}\n`;
    csvContent += `Period: ${start_date} to ${end_date}\n\n`;

    // Add Revenues section
    csvContent += 'REVENUES\n';
    let totalRevenue = 0;
    accounts
      .filter(acc => acc.type === 'Revenue')
      .forEach(acc => {
        const amount = Math.abs(acc.balance);
        totalRevenue += amount;
        csvContent += `${'\t'.repeat(acc.level - 1)}${acc.code} - ${acc.name},${amount}\n`;
      });
    csvContent += `Total Revenues,${totalRevenue}\n\n`;

    // Add Expenses section
    csvContent += 'EXPENSES\n';
    let totalExpenses = 0;
    accounts
      .filter(acc => acc.type === 'Expense')
      .forEach(acc => {
        const amount = Math.abs(acc.balance);
        totalExpenses += amount;
        csvContent += `${'\t'.repeat(acc.level - 1)}${acc.code} - ${acc.name},${amount}\n`;
      });
    csvContent += `Total Expenses,${totalExpenses}\n\n`;

    // Add Summary
    csvContent += 'SUMMARY\n';
    csvContent += `Total Revenues,${totalRevenue}\n`;
    csvContent += `Total Expenses,${totalExpenses}\n`;
    csvContent += `Net Income,${totalRevenue - totalExpenses}\n`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=income-statement-${start_date}-to-${end_date}.csv`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error in exportIncomeStatement:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const getDebtorsReport = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, status = 'all' } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    
    // Handle consolidated vs specific boarding house
    if (boarding_house_id && boarding_house_id !== 'all') {
      whereClause = 'AND se.boarding_house_id = ?';
      queryParams.push(boarding_house_id);
    }

    // Get all active enrolled students
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

    const debtors = [];

    // For each active student, calculate their debts
    for (const student of activeStudents) {
      let totalDebt = 0;
      let adminFeeDebt = 0;
      let securityDepositDebt = 0;
      let rentDebt = 0;
      let earliestOverdueDate = null;
      let lastPaymentDate = null;

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
      const [rentSchedules] = await connection.query(
        `SELECT 
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
        ORDER BY sps.period_start_date`,
        [student.student_id, student.enrollment_id]
      );

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

      // Get last payment date for this student
      const [lastPayment] = await connection.query(
        `SELECT payment_date
         FROM student_payments
         WHERE student_id = ?
           AND enrollment_id = ?
           AND status = 'completed'
           AND deleted_at IS NULL
         ORDER BY payment_date DESC
         LIMIT 1`,
        [student.student_id, student.enrollment_id]
      );

      if (lastPayment.length > 0) {
        lastPaymentDate = lastPayment[0].payment_date;
      }

      // If student has any debt, add to debtors list
      if (totalDebt > 0) {
        const daysOverdue = earliestOverdueDate 
          ? Math.max(0, Math.floor((new Date() - new Date(earliestOverdueDate)) / (1000 * 60 * 60 * 24)))
          : 0;

        // Determine status based on debt types and overdue status
        let studentStatus = 'pending';
        if (daysOverdue > 0) {
          studentStatus = 'overdue';
        } else if (rentDebt > 0 && (adminFeeDebt > 0 || securityDepositDebt > 0)) {
          studentStatus = 'partial';
        }
        
        // Filter by status only (no day filters)
        if (status !== 'all') {
          if (status === 'overdue' && studentStatus !== 'overdue') continue;
          if (status === 'partial' && studentStatus !== 'partial') continue;
        }

        debtors.push({
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
          last_payment: lastPaymentDate,
          status: studentStatus,
          earliest_overdue_date: earliestOverdueDate
        });
      }
    }

    // Calculate summary statistics
    const totalOutstanding = debtors.reduce((sum, debtor) => sum + debtor.total_due, 0);
    const overdueAccounts = debtors.filter(d => d.status === 'overdue').length;
    const avgDaysOverdue = debtors.length > 0 
      ? Math.round(debtors.reduce((sum, d) => sum + d.days_overdue, 0) / debtors.length)
      : 0;

    // Calculate debt breakdown totals
    const totalAdminFeeDebt = debtors.reduce((sum, d) => sum + d.debt_breakdown.admin_fee, 0);
    const totalSecurityDepositDebt = debtors.reduce((sum, d) => sum + d.debt_breakdown.security_deposit, 0);
    const totalRentDebt = debtors.reduce((sum, d) => sum + d.debt_breakdown.rent, 0);

    // Format the response
    const response = {
      summary: {
        total_outstanding: totalOutstanding,
        overdue_accounts: overdueAccounts,
        avg_days_overdue: avgDaysOverdue,
        total_debtors: debtors.length,
        debt_breakdown: {
          admin_fee: totalAdminFeeDebt,
          security_deposit: totalSecurityDepositDebt,
          rent: totalRentDebt
        }
      },
      debtors: debtors
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getDebtorsReport:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const exportDebtorsReport = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, status = 'all' } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    let reportTitle = 'Consolidated Debtors Report';
    
    // Handle consolidated vs specific boarding house
    if (boarding_house_id && boarding_house_id !== 'all') {
      whereClause = 'AND se.boarding_house_id = ?';
      queryParams.push(boarding_house_id);
      
      // Get boarding house details
      const [boardingHouse] = await connection.query(
        'SELECT name FROM boarding_houses WHERE id = ?',
        [boarding_house_id]
      );
      
      if (boardingHouse.length > 0) {
        reportTitle = `${boardingHouse[0].name} - Debtors Report`;
      }
    }

    // Get all active enrolled students
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

    const debtors = [];

    // For each active student, calculate their debts
    for (const student of activeStudents) {
      let totalDebt = 0;
      let adminFeeDebt = 0;
      let securityDepositDebt = 0;
      let rentDebt = 0;
      let earliestOverdueDate = null;
      let lastPaymentDate = null;

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
      const [rentSchedules] = await connection.query(
        `SELECT 
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
        ORDER BY sps.period_start_date`,
        [student.student_id, student.enrollment_id]
      );

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

      // Get last payment date for this student
      const [lastPayment] = await connection.query(
        `SELECT payment_date
         FROM student_payments
         WHERE student_id = ?
           AND enrollment_id = ?
           AND status = 'completed'
           AND deleted_at IS NULL
         ORDER BY payment_date DESC
         LIMIT 1`,
        [student.student_id, student.enrollment_id]
      );

      if (lastPayment.length > 0) {
        lastPaymentDate = lastPayment[0].payment_date;
      }

      // If student has any debt, add to debtors list
      if (totalDebt > 0) {
        const daysOverdue = earliestOverdueDate 
          ? Math.max(0, Math.floor((new Date() - new Date(earliestOverdueDate)) / (1000 * 60 * 60 * 24)))
          : 0;

        // Determine status based on debt types and overdue status
        let studentStatus = 'pending';
        if (daysOverdue > 0) {
          studentStatus = 'overdue';
        } else if (rentDebt > 0 && (adminFeeDebt > 0 || securityDepositDebt > 0)) {
          studentStatus = 'partial';
        }
        
        // Filter by status only (no day filters)
        if (status !== 'all') {
          if (status === 'overdue' && studentStatus !== 'overdue') continue;
          if (status === 'partial' && studentStatus !== 'partial') continue;
        }

        debtors.push({
          student_name: student.student_name,
          room_number: student.room_number,
          boarding_house_name: student.boarding_house_name,
          total_debt: totalDebt,
          admin_fee_debt: adminFeeDebt,
          security_deposit_debt: securityDepositDebt,
          rent_debt: rentDebt,
          days_overdue: daysOverdue,
          last_payment_date: lastPaymentDate,
          status: studentStatus
        });
      }
    }

    // Calculate summary statistics
    const totalOutstanding = debtors.reduce((sum, d) => sum + d.total_debt, 0);
    const totalAdminFeeDebt = debtors.reduce((sum, d) => sum + d.admin_fee_debt, 0);
    const totalSecurityDepositDebt = debtors.reduce((sum, d) => sum + d.security_deposit_debt, 0);
    const totalRentDebt = debtors.reduce((sum, d) => sum + d.rent_debt, 0);
    const overdueAccounts = debtors.filter(d => d.status === 'overdue').length;
    const avgDaysOverdue = debtors.length > 0 
      ? Math.round(debtors.reduce((sum, d) => sum + d.days_overdue, 0) / debtors.length)
      : 0;

    // Generate CSV content
    let csvContent = `${reportTitle}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'Summary\n';
    csvContent += `Total Outstanding,$${totalOutstanding.toFixed(2)}\n`;
    csvContent += `Admin Fee Debt,$${totalAdminFeeDebt.toFixed(2)}\n`;
    csvContent += `Security Deposit Debt,$${totalSecurityDepositDebt.toFixed(2)}\n`;
    csvContent += `Rent Debt,$${totalRentDebt.toFixed(2)}\n`;
    csvContent += `Overdue Accounts,${overdueAccounts}\n`;
    csvContent += `Average Days Overdue,${avgDaysOverdue}\n`;
    csvContent += `Total Debtors,${debtors.length}\n\n`;

    // Add headers
    if (boarding_house_id === 'all') {
      csvContent += 'Student Name,Boarding House,Room,Total Due,Admin Fee Due,Security Deposit Due,Rent Due,Days Overdue,Last Payment,Status\n';
    } else {
      csvContent += 'Student Name,Room,Total Due,Admin Fee Due,Security Deposit Due,Rent Due,Days Overdue,Last Payment,Status\n';
    }

    // Add data rows
    debtors.forEach(d => {
      csvContent += `"${d.student_name}",`;
      if (boarding_house_id === 'all') {
        csvContent += `"${d.boarding_house_name}",`;
      }
      csvContent += `"${d.room_number}",`;
      csvContent += `$${d.total_debt.toFixed(2)},`;
      csvContent += `$${d.admin_fee_debt.toFixed(2)},`;
      csvContent += `$${d.security_deposit_debt.toFixed(2)},`;
      csvContent += `$${d.rent_debt.toFixed(2)},`;
      csvContent += `${d.days_overdue},`;
      csvContent += `"${d.last_payment_date || 'Never'}",`;
      csvContent += `"${d.status}"\n`;
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=debtors-report-${new Date().toISOString().split('T')[0]}.csv`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error in exportDebtorsReport:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const getIncomeProjection = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, months = 6 } = req.query;
    
    // Get current date and end date for projection
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(months));

    // Get all active enrollments and their payment schedules
    const [projections] = await connection.query(
      `WITH MonthlyProjection AS (
        -- Get all months in the projection period
        WITH RECURSIVE months AS (
          SELECT 
            DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') as month_start,
            DATE_FORMAT(LAST_DAY(CURRENT_DATE), '%Y-%m-%d') as month_end
          UNION ALL
          SELECT 
            DATE_FORMAT(DATE_ADD(month_start, INTERVAL 1 MONTH), '%Y-%m-01'),
            LAST_DAY(DATE_ADD(month_start, INTERVAL 1 MONTH))
          FROM months
          WHERE month_start < DATE_FORMAT(?, '%Y-%m-01')
        )
        -- Calculate expected and confirmed income for each month
        SELECT 
          m.month_start,
          m.month_end,
          -- Expected income based on room rates
          COALESCE(
            (SELECT SUM(r.price_per_bed * r.capacity)
             FROM rooms r
             WHERE r.boarding_house_id = ?
               AND r.status = 'active'
               AND r.deleted_at IS NULL
            ), 0
          ) as expected_income,
          -- Confirmed income from existing payment schedules
          COALESCE(
            (SELECT SUM(sps.amount_due)
             FROM student_payment_schedules sps
             JOIN student_enrollments se ON sps.enrollment_id = se.id
             WHERE se.boarding_house_id = ?
               AND sps.period_start_date BETWEEN m.month_start AND m.month_end
               AND sps.deleted_at IS NULL
            ), 0
          ) as confirmed_income,
          -- Calculate occupancy rate
          ROUND(
            (SELECT COUNT(DISTINCT se.room_id) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0)
             FROM rooms r
             LEFT JOIN student_enrollments se ON r.id = se.room_id
               AND se.start_date <= m.month_end
               AND (se.expected_end_date >= m.month_start OR se.expected_end_date IS NULL)
               AND se.deleted_at IS NULL
             WHERE r.boarding_house_id = ?
               AND r.status = 'active'
               AND r.deleted_at IS NULL
            ), 1
          ) as occupancy_rate
        FROM months m
      )
      SELECT 
        DATE_FORMAT(month_start, '%M %Y') as month,
        CAST(expected_income AS DECIMAL(15,2)) as expected_income,
        CAST(confirmed_income AS DECIMAL(15,2)) as confirmed_income,
        CAST(occupancy_rate AS DECIMAL(5,1)) as occupancy_rate,
        CONCAT(
          CASE 
            WHEN LAG(confirmed_income) OVER (ORDER BY month_start) IS NULL THEN '0'
            WHEN confirmed_income > LAG(confirmed_income) OVER (ORDER BY month_start) THEN '+'
            ELSE '-'
          END,
        COALESCE(
            ROUND(
              ABS(
                (confirmed_income - LAG(confirmed_income) OVER (ORDER BY month_start)) * 100.0 /
                NULLIF(LAG(confirmed_income) OVER (ORDER BY month_start), 0)
              ), 1
            ),
            0
          ),
          '%'
        ) as trend
      FROM MonthlyProjection
      ORDER BY month_start`,
      [endDate, boarding_house_id, boarding_house_id, boarding_house_id]
    );

    // Process the projections to ensure numbers are properly formatted
    const processedProjections = projections.map(row => ({
      ...row,
      expected_income: parseFloat(row.expected_income) || 0,
      confirmed_income: parseFloat(row.confirmed_income) || 0,
      occupancy_rate: parseFloat(row.occupancy_rate) || 0
    }));

    // Calculate summary statistics
    const totalProjected = processedProjections.reduce((sum, p) => sum + p.expected_income, 0);
    const totalConfirmed = processedProjections.reduce((sum, p) => sum + p.confirmed_income, 0);
    const avgOccupancy = processedProjections.reduce((sum, p) => sum + p.occupancy_rate, 0) / processedProjections.length;
    
    // Get current occupancy for comparison
    const [currentOccupancy] = await connection.query(
      `SELECT ROUND(
         COUNT(DISTINCT se.room_id) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0),
         1
       ) as current_occupancy
       FROM rooms r
       LEFT JOIN student_enrollments se ON r.id = se.room_id
         AND se.start_date <= CURRENT_DATE
         AND (se.expected_end_date >= CURRENT_DATE OR se.expected_end_date IS NULL)
         AND se.deleted_at IS NULL
       WHERE r.boarding_house_id = ?
         AND r.status = 'active'
         AND r.deleted_at IS NULL`,
      [boarding_house_id]
    );

    const occupancyTrend = parseFloat((avgOccupancy - (parseFloat(currentOccupancy[0].current_occupancy) || 0)).toFixed(1));

    // Format the response
    const response = {
      summary: {
        total_projected: parseFloat(totalProjected.toFixed(2)),
        total_confirmed: parseFloat(totalConfirmed.toFixed(2)),
        confirmed_percentage: parseFloat(((totalConfirmed * 100 / totalProjected) || 0).toFixed(1)),
        avg_occupancy: parseFloat(avgOccupancy.toFixed(1)),
        occupancy_trend: occupancyTrend > 0 ? `+${occupancyTrend}` : occupancyTrend.toString()
      },
      projections: processedProjections
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getIncomeProjection:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    connection.release();
  }
};

const exportIncomeProjection = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, months = 6 } = req.query;
    
    // Get boarding house details
    const [boardingHouse] = await connection.query(
      'SELECT name FROM boarding_houses WHERE id = ?',
      [boarding_house_id]
    );

    // Get projection data using the same query
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(months));

    const [projections] = await connection.query(
      `WITH MonthlyProjection AS (
        -- Get all months in the projection period
        WITH RECURSIVE months AS (
        SELECT 
            DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') as month_start,
            DATE_FORMAT(LAST_DAY(CURRENT_DATE), '%Y-%m-%d') as month_end
          UNION ALL
          SELECT 
            DATE_FORMAT(DATE_ADD(month_start, INTERVAL 1 MONTH), '%Y-%m-01'),
            LAST_DAY(DATE_ADD(month_start, INTERVAL 1 MONTH))
          FROM months
          WHERE month_start < DATE_FORMAT(?, '%Y-%m-01')
        )
        -- Calculate expected and confirmed income for each month
        SELECT 
          m.month_start,
          m.month_end,
          -- Expected income based on room rates
          COALESCE(
            (SELECT SUM(r.monthly_rate)
             FROM rooms r
             WHERE r.boarding_house_id = ?
               AND r.deleted_at IS NULL
            ), 0
          ) as expected_income,
          -- Confirmed income from existing payment schedules
          COALESCE(
            (SELECT SUM(sps.amount_due)
             FROM student_payment_schedules sps
             JOIN student_enrollments se ON sps.enrollment_id = se.id
        WHERE se.boarding_house_id = ?
               AND sps.period_start_date BETWEEN m.month_start AND m.month_end
               AND sps.deleted_at IS NULL
            ), 0
          ) as confirmed_income,
          -- Calculate occupancy rate
          ROUND(
            (SELECT COUNT(DISTINCT se.room_id) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0)
             FROM rooms r
             LEFT JOIN student_enrollments se ON r.id = se.room_id
               AND se.start_date <= m.month_end
               AND (se.expected_end_date >= m.month_start OR se.expected_end_date IS NULL)
               AND se.deleted_at IS NULL
             WHERE r.boarding_house_id = ?
               AND r.deleted_at IS NULL
            ), 1
          ) as occupancy_rate
        FROM months m
      )
        SELECT 
        DATE_FORMAT(month_start, '%M %Y') as month,
        expected_income,
        confirmed_income,
        occupancy_rate,
        CONCAT(
          CASE 
            WHEN LAG(confirmed_income) OVER (ORDER BY month_start) IS NULL THEN '0'
            WHEN confirmed_income > LAG(confirmed_income) OVER (ORDER BY month_start) THEN '+'
            ELSE '-'
          END,
          COALESCE(
            ROUND(
              ABS(
                (confirmed_income - LAG(confirmed_income) OVER (ORDER BY month_start)) * 100.0 /
                NULLIF(LAG(confirmed_income) OVER (ORDER BY month_start), 0)
              ), 1
            ),
            0
          ),
          '%'
        ) as trend
      FROM MonthlyProjection
      ORDER BY month_start`,
      [endDate, boarding_house_id, boarding_house_id, boarding_house_id]
    );

    // Calculate summary statistics
    const totalProjected = projections.reduce((sum, p) => sum + p.expected_income, 0);
    const totalConfirmed = projections.reduce((sum, p) => sum + p.confirmed_income, 0);
    const avgOccupancy = projections.reduce((sum, p) => sum + p.occupancy_rate, 0) / projections.length;

    // Generate CSV content
    let csvContent = 'Income Projection Report\n';
    csvContent += `${boardingHouse[0].name}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    csvContent += 'Summary\n';
    csvContent += `Total Projected Income,${totalProjected}\n`;
    csvContent += `Total Confirmed Income,${totalConfirmed}\n`;
    csvContent += `Confirmation Rate,${(totalConfirmed * 100 / totalProjected).toFixed(1)}%\n`;
    csvContent += `Average Occupancy,${avgOccupancy.toFixed(1)}%\n\n`;

    csvContent += 'Monthly Projections\n';
    csvContent += 'Month,Expected Income,Confirmed Income,Occupancy Rate,Trend\n';
    projections.forEach(p => {
      csvContent += `${p.month},`;
      csvContent += `${p.expected_income.toFixed(2)},`;
      csvContent += `${p.confirmed_income.toFixed(2)},`;
      csvContent += `${p.occupancy_rate}%,`;
      csvContent += `${p.trend}\n`;
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=income-projection-${new Date().toISOString().split('T')[0]}.csv`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error in exportIncomeProjection:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getCashflowReport,
  exportCashflowReport,
  getIncomeStatement,
  exportIncomeStatement,
  getDebtorsReport,
  exportDebtorsReport,
  getIncomeProjection,
  exportIncomeProjection
};