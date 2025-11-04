const db = require('../services/db');

const getMonthlyCashflowReport = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boarding_house_id, start_date, end_date } = req.query;
    
    console.log('=== MONTHLY CASHFLOW REPORT REQUEST ===');
    console.log('Params:', { boarding_house_id, start_date, end_date });

    // Handle "all" boarding houses case
    let whereClause = '';
    let queryParams = [];
    
    if (boarding_house_id && boarding_house_id !== 'all') {
      whereClause = 'AND t.boarding_house_id = ?';
      queryParams.push(boarding_house_id);
    }

    // Get all cash and bank accounts
    const [cashAccounts] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004')
       AND type = 'Asset'
       AND deleted_at IS NULL
       ORDER BY code`
    );

    const cashAccountIds = cashAccounts.map(acc => acc.id);

    if (cashAccountIds.length === 0) {
      return res.json({
        months: [],
        operatingActivities: { income: [], expenses: [] },
        investingActivities: [],
        financingActivities: [],
        cashBreakdown: {}
      });
    }

    // Generate list of months in the date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const months = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthStart = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      months.push({
        key: monthKey,
        label: monthLabel,
        start: monthStart,
        end: monthEnd
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Get all transactions grouped by month
    const [transactions] = await connection.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.amount,
        t.transaction_date,
        DATE_FORMAT(t.transaction_date, '%Y-%m') as month_key,
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

    // Initialize data structures
    const operatingIncome = {}; // { category: { month: amount } }
    const operatingExpenses = {}; // { category: { month: amount } }
    const investingActivities = {}; // { category: { month: amount } }
    const financingActivities = {}; // { category: { month: amount } }
    const processedTransactions = new Set();

    // Process transactions
    transactions.forEach(transaction => {
      const { 
        id,
        amount,
        month_key,
        debit_account_id,
        credit_account_id,
        debit_account_code,
        credit_account_code,
        debit_account_name,
        credit_account_name
      } = transaction;

      if (processedTransactions.has(id)) return;

      const parsedAmount = Math.abs(parseFloat(amount || 0));

      // Determine if it's an inflow or outflow
      const isInflow = cashAccountIds.includes(debit_account_id) && !cashAccountIds.includes(credit_account_id);
      const isOutflow = cashAccountIds.includes(credit_account_id) && !cashAccountIds.includes(debit_account_id);

      // Skip internal transfers
      if (cashAccountIds.includes(debit_account_id) && cashAccountIds.includes(credit_account_id)) {
        return;
      }

      let category = '';
      let activityType = 'operating'; // operating, investing, financing

      if (isInflow) {
        // Cash inflow
        if (credit_account_code?.startsWith('4')) {
          // Revenue accounts
          category = credit_account_name || 'Revenue';
          
          // Special handling for rental income
          if (credit_account_code === '40001' || category.toLowerCase().includes('rental')) {
            category = 'Rentals for the month';
          } else if (credit_account_code === '40002' || category.toLowerCase().includes('admin')) {
            category = 'Admin Fee';
          } else if (credit_account_code === '10005' || category.toLowerCase().includes('advance')) {
            category = 'Rentals Paid in Advance';
          }
          
          activityType = 'operating';
        } else if (credit_account_code?.startsWith('2')) {
          category = 'Loan/Advance';
          activityType = 'financing';
        } else if (credit_account_code?.startsWith('3')) {
          category = 'Owner Investment';
          activityType = 'financing';
        } else {
          category = 'Other Income';
          activityType = 'operating';
        }

        // Add to operating income
        if (activityType === 'operating') {
          if (!operatingIncome[category]) {
            operatingIncome[category] = {};
            months.forEach(m => { operatingIncome[category][m.key] = 0; });
          }
          operatingIncome[category][month_key] = (operatingIncome[category][month_key] || 0) + parsedAmount;
        } else if (activityType === 'financing') {
          if (!financingActivities[category]) {
            financingActivities[category] = {};
            months.forEach(m => { financingActivities[category][m.key] = 0; });
          }
          financingActivities[category][month_key] = (financingActivities[category][month_key] || 0) + parsedAmount;
        }

      } else if (isOutflow) {
        // Cash outflow
        if (debit_account_code?.startsWith('5')) {
          // Expense accounts
          category = debit_account_name || 'Operating Expenses';
          activityType = 'operating';

          // Special expense categories
          if (debit_account_code === '50001' || category.toLowerCase().includes('management')) {
            category = 'Alamait Management Fee';
          }

          if (!operatingExpenses[category]) {
            operatingExpenses[category] = {};
            months.forEach(m => { operatingExpenses[category][m.key] = 0; });
          }
          operatingExpenses[category][month_key] = (operatingExpenses[category][month_key] || 0) + parsedAmount;

        } else if (debit_account_code?.startsWith('2')) {
          category = 'Loan Repayment';
          activityType = 'financing';
          
          if (!financingActivities[category]) {
            financingActivities[category] = {};
            months.forEach(m => { financingActivities[category][m.key] = 0; });
          }
          financingActivities[category][month_key] = (financingActivities[category][month_key] || 0) + parsedAmount;

        } else if (debit_account_code?.startsWith('1') && !cashAccountIds.includes(parseInt(debit_account_id))) {
          // Asset purchases (investing)
          category = debit_account_name || 'Asset Purchase';
          activityType = 'investing';
          
          if (!investingActivities[category]) {
            investingActivities[category] = {};
            months.forEach(m => { investingActivities[category][m.key] = 0; });
          }
          investingActivities[category][month_key] = (investingActivities[category][month_key] || 0) + parsedAmount;
        }
      }

      processedTransactions.add(id);
    });

    // Format operating income
    const formattedOperatingIncome = Object.entries(operatingIncome).map(([category, monthlyAmounts]) => {
      const monthlyValues = months.map(m => monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        monthlyValues,
        total
      };
    });

    // Format operating expenses
    const formattedOperatingExpenses = Object.entries(operatingExpenses).map(([category, monthlyAmounts]) => {
      const monthlyValues = months.map(m => monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        monthlyValues,
        total
      };
    });

    // Format investing activities
    const formattedInvesting = Object.entries(investingActivities).map(([category, monthlyAmounts]) => {
      const monthlyValues = months.map(m => monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        monthlyValues,
        total
      };
    });

    // Format financing activities
    const formattedFinancing = Object.entries(financingActivities).map(([category, monthlyAmounts]) => {
      const monthlyValues = months.map(m => monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        monthlyValues,
        total
      };
    });

    // Calculate totals for each month
    const monthlyTotals = {
      operatingIncome: months.map(m => {
        const total = formattedOperatingIncome.reduce((sum, item) => {
          const idx = months.findIndex(month => month.key === m.key);
          return sum + (item.monthlyValues[idx] || 0);
        }, 0);
        return total;
      }),
      operatingExpenses: months.map(m => {
        const total = formattedOperatingExpenses.reduce((sum, item) => {
          const idx = months.findIndex(month => month.key === m.key);
          return sum + (item.monthlyValues[idx] || 0);
        }, 0);
        return total;
      }),
      operatingNet: months.map((m, idx) => {
        const income = formattedOperatingIncome.reduce((sum, item) => sum + (item.monthlyValues[idx] || 0), 0);
        const expenses = formattedOperatingExpenses.reduce((sum, item) => sum + (item.monthlyValues[idx] || 0), 0);
        return income - expenses;
      }),
      investing: months.map(m => {
        const total = formattedInvesting.reduce((sum, item) => {
          const idx = months.findIndex(month => month.key === m.key);
          return sum + (item.monthlyValues[idx] || 0);
        }, 0);
        return total;
      }),
      financing: months.map(m => {
        const total = formattedFinancing.reduce((sum, item) => {
          const idx = months.findIndex(month => month.key === m.key);
          return sum + (item.monthlyValues[idx] || 0);
        }, 0);
        return total;
      })
    };

    // Calculate cumulative cash balance
    let cumulativeCash = 0;
    const cashAtEndOfPeriod = months.map((m, idx) => {
      cumulativeCash += monthlyTotals.operatingNet[idx] - monthlyTotals.investing[idx] - monthlyTotals.financing[idx];
      return cumulativeCash;
    });

    // Get current cash account balances
    const [cashBalances] = await connection.query(
      `SELECT 
        coa.code,
        coa.name,
        CASE 
          WHEN coa.code = '10001' THEN 
            COALESCE((SELECT SUM(current_balance) FROM petty_cash_accounts WHERE deleted_at IS NULL), 0)
          ELSE
            COALESCE(cab.current_balance, 0)
        END as balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.id IN (${cashAccountIds.map(() => '?').join(',')})
      ORDER BY coa.code`,
      cashAccountIds
    );

    const totalCashPosition = cashBalances.reduce((sum, account) => {
      return sum + Number(account.balance);
    }, 0);

    const cashBreakdown = {
      accounts: cashBalances.map(account => ({
        code: account.code,
        name: account.name,
        balance: Number(account.balance)
      })),
      total: totalCashPosition
    };

    res.json({
      months: months.map(m => m.label),
      monthKeys: months.map(m => m.key),
      operatingActivities: {
        income: formattedOperatingIncome,
        expenses: formattedOperatingExpenses,
        totals: monthlyTotals
      },
      investingActivities: formattedInvesting,
      financingActivities: formattedFinancing,
      monthlyTotals,
      cashAtEndOfPeriod,
      cashBreakdown,
      summary: {
        totalOperatingIncome: formattedOperatingIncome.reduce((sum, item) => sum + item.total, 0),
        totalOperatingExpenses: formattedOperatingExpenses.reduce((sum, item) => sum + item.total, 0),
        totalInvesting: formattedInvesting.reduce((sum, item) => sum + item.total, 0),
        totalFinancing: formattedFinancing.reduce((sum, item) => sum + item.total, 0)
      }
    });

  } catch (error) {
    console.error('Error in getMonthlyCashflowReport:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getMonthlyCashflowReport
};

