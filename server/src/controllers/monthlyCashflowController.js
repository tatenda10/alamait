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

    // Get Opening Balance Equity account ID to exclude opening balance transactions
    const [openingBalanceEquity] = await connection.query(
      `SELECT id, code FROM chart_of_accounts 
       WHERE code = '30004' AND type = 'Equity' AND deleted_at IS NULL
       LIMIT 1`
    );
    const openingBalanceEquityId = openingBalanceEquity.length > 0 ? openingBalanceEquity[0].id : null;

    // Get all transactions grouped by month
    // Only include transactions where cash account is debited (inflow) or credited (outflow)
    // Exclude opening balances (where credit account is Opening Balance Equity 30004)
    // Exclude internal transfers (both debit and credit are cash accounts)
    // IMPORTANT: Exclude September 2025 transactions - they shouldn't be in the cashflow
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
        ${openingBalanceEquityId ? `AND je_credit.account_id != ?` : ''}
      ORDER BY t.transaction_date`,
      openingBalanceEquityId 
        ? [start_date, end_date, ...queryParams, ...cashAccountIds, ...cashAccountIds, openingBalanceEquityId]
        : [start_date, end_date, ...queryParams, ...cashAccountIds, ...cashAccountIds]
    );

    console.log(`📊 Total transactions found: ${transactions.length}`);
    console.log(`💰 Cash account IDs: ${cashAccountIds.join(', ')}`);
    console.log(`🏦 Opening Balance Equity ID: ${openingBalanceEquityId || 'Not found'}`);

    // Initialize data structures - include account info for navigation
    const operatingIncome = {}; // { category: { month: amount, account_id, account_code, account_name } }
    const operatingExpenses = {}; // { category: { month: amount, account_id, account_code, account_name } }
    const investingActivities = {}; // { category: { month: amount, account_id, account_code, account_name } }
    const financingActivities = {}; // { category: { month: amount, account_id, account_code, account_name } }
    const processedTransactions = new Set();

    let skippedInternalTransfers = 0;
    let skippedOpeningBalances = 0;
    let processedInflows = 0;
    let processedOutflows = 0;

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
      // Inflow: Cash account is debited (money coming into cash)
      // Outflow: Cash account is credited (money going out of cash)
      const isInflow = cashAccountIds.includes(debit_account_id) && !cashAccountIds.includes(credit_account_id);
      const isOutflow = cashAccountIds.includes(credit_account_id) && !cashAccountIds.includes(debit_account_id);

      // Skip internal transfers between cash accounts (e.g., vault to cash)
      // These are inflows to one cash account but outflows from another, so they cancel out
      if (cashAccountIds.includes(debit_account_id) && cashAccountIds.includes(credit_account_id)) {
        skippedInternalTransfers++;
        console.log(`🔄 Skipped internal transfer: Txn ${id} | ${debit_account_code} -> ${credit_account_code} | Amount: $${parsedAmount}`);
        return; // Skip internal transfers - they don't affect operating cash flow
      }

      // Skip opening balance transactions (credit to Opening Balance Equity 30004)
      // Opening balances are not operating cash flows
      if (openingBalanceEquityId && credit_account_id === openingBalanceEquityId && isInflow) {
        skippedOpeningBalances++;
        console.log(`📅 Skipped opening balance: Txn ${id} | Cash: ${debit_account_code} | Equity: ${credit_account_code} | Amount: $${parsedAmount}`);
        return; // Skip opening balances - they're not operating inflows
      }

      let category = '';
      let activityType = 'operating'; // operating, investing, financing
      let accountId = null;
      let accountCode = null;
      let accountName = null;

      if (isInflow) {
        // Cash inflow - use credit account info
        // This means: Cash account is DEBITED (money coming into cash)
        accountId = credit_account_id;
        accountCode = credit_account_code;
        accountName = credit_account_name;
        
        processedInflows++;
        console.log(`💰 CASH INFLOW: Txn ${id} | Month: ${month_key} | Cash Account (Debit): ${debit_account_code} (${debit_account_name}) | Source Account (Credit): ${credit_account_code} (${credit_account_name}) | Amount: $${parsedAmount}`);
        
        // Accounts Receivable (10005) collections ARE cash inflows - when customers pay their receivables
        if (credit_account_code === '10005') {
          category = 'Collections from Accounts Receivable';
          activityType = 'operating';
          console.log(`   ✅ Operating Income: ${category} - Cash collected from receivables`);
        } else if (credit_account_code?.startsWith('4')) {
          // Revenue accounts (40001, 40002, etc.)
          category = credit_account_name || 'Revenue';
          
          // Special handling for rental income
          if (credit_account_code === '40001' || category.toLowerCase().includes('rental')) {
            category = 'Rentals for the month';
          } else if (credit_account_code === '40002' || category.toLowerCase().includes('admin')) {
            category = 'Admin Fee';
          }
          
          activityType = 'operating';
          console.log(`   ✅ Operating Income: ${category} from ${credit_account_code}`);
        } else if (credit_account_code?.startsWith('2')) {
          category = 'Loan/Advance';
          activityType = 'financing';
          console.log(`   ✅ Financing Activity: ${category} from ${credit_account_code}`);
        } else if (credit_account_code?.startsWith('3')) {
          category = 'Owner Investment';
          activityType = 'financing';
          console.log(`   ✅ Financing Activity: ${category} from ${credit_account_code}`);
        } else {
          category = 'Other Income';
          activityType = 'operating';
          console.log(`   ✅ Operating Income: ${category} from ${credit_account_code}`);
        }

        // Add to operating income (including accounts receivable collections)
        if (activityType === 'operating') {
          if (!operatingIncome[category]) {
            operatingIncome[category] = {
              account_id: accountId,
              account_code: accountCode,
              account_name: accountName,
              monthlyAmounts: {}
            };
            months.forEach(m => { operatingIncome[category].monthlyAmounts[m.key] = 0; });
          }
          const previousAmount = operatingIncome[category].monthlyAmounts[month_key] || 0;
          operatingIncome[category].monthlyAmounts[month_key] = previousAmount + parsedAmount;
          console.log(`   ✅ Added to ${category}: $${parsedAmount} for ${month_key} | Previous: $${previousAmount} | New Total: $${operatingIncome[category].monthlyAmounts[month_key]}`);
        } else if (activityType === 'financing') {
          if (!financingActivities[category]) {
            financingActivities[category] = {
              account_id: accountId,
              account_code: accountCode,
              account_name: accountName,
              monthlyAmounts: {}
            };
            months.forEach(m => { financingActivities[category].monthlyAmounts[m.key] = 0; });
          }
          financingActivities[category].monthlyAmounts[month_key] = (financingActivities[category].monthlyAmounts[month_key] || 0) + parsedAmount;
        }

      } else if (isOutflow) {
        // Cash outflow - use debit account info
        // This means: Cash account is CREDITED (money going out of cash)
        accountId = debit_account_id;
        accountCode = debit_account_code;
        accountName = debit_account_name;
        
        processedOutflows++;
        console.log(`💸 CASH OUTFLOW: Txn ${id} | Month: ${month_key} | Cash Account (Credit): ${credit_account_code} (${credit_account_name}) | Destination Account (Debit): ${debit_account_code} (${debit_account_name}) | Amount: $${parsedAmount}`);
        
        if (debit_account_code?.startsWith('5')) {
          // Expense accounts
          category = debit_account_name || 'Operating Expenses';
          activityType = 'operating';

          // Special expense categories
          if (debit_account_code === '50001' || category.toLowerCase().includes('management')) {
            category = 'Alamait Management Fee';
          }

          if (!operatingExpenses[category]) {
            operatingExpenses[category] = {
              account_id: accountId,
              account_code: accountCode,
              account_name: accountName,
              monthlyAmounts: {}
            };
            months.forEach(m => { operatingExpenses[category].monthlyAmounts[m.key] = 0; });
          }
          operatingExpenses[category].monthlyAmounts[month_key] = (operatingExpenses[category].monthlyAmounts[month_key] || 0) + parsedAmount;

        } else if (debit_account_code?.startsWith('2')) {
          category = 'Loan Repayment';
          activityType = 'financing';
          
          if (!financingActivities[category]) {
            financingActivities[category] = {
              account_id: accountId,
              account_code: accountCode,
              account_name: accountName,
              monthlyAmounts: {}
            };
            months.forEach(m => { financingActivities[category].monthlyAmounts[m.key] = 0; });
          }
          financingActivities[category].monthlyAmounts[month_key] = (financingActivities[category].monthlyAmounts[month_key] || 0) + parsedAmount;

        } else if (debit_account_code?.startsWith('1') && !cashAccountIds.includes(parseInt(debit_account_id))) {
          // Asset purchases (investing)
          category = debit_account_name || 'Asset Purchase';
          activityType = 'investing';
          
          if (!investingActivities[category]) {
            investingActivities[category] = {
              account_id: accountId,
              account_code: accountCode,
              account_name: accountName,
              monthlyAmounts: {}
            };
            months.forEach(m => { investingActivities[category].monthlyAmounts[m.key] = 0; });
          }
          investingActivities[category].monthlyAmounts[month_key] = (investingActivities[category].monthlyAmounts[month_key] || 0) + parsedAmount;
        }
      }

      processedTransactions.add(id);
    });

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total transactions processed: ${processedTransactions.size}`);
    console.log(`   Cash inflows processed: ${processedInflows}`);
    console.log(`   Cash outflows processed: ${processedOutflows}`);
    console.log(`   Internal transfers skipped: ${skippedInternalTransfers}`);
    console.log(`   Opening balances skipped: ${skippedOpeningBalances}`);
    console.log(`   Operating income categories: ${Object.keys(operatingIncome).length}`);
    console.log(`   Operating expense categories: ${Object.keys(operatingExpenses).length}`);
    console.log(`   Investing activity categories: ${Object.keys(investingActivities).length}`);
    console.log(`   Financing activity categories: ${Object.keys(financingActivities).length}`);
    
    // Detailed breakdown by month for operating income
    console.log(`\n📊 OPERATING INCOME BY MONTH:`);
    Object.entries(operatingIncome).forEach(([category, data]) => {
      console.log(`   ${category}:`);
      months.forEach(m => {
        const amount = data.monthlyAmounts[m.key] || 0;
        if (amount > 0) {
          console.log(`      ${m.key} (${m.label}): $${amount.toFixed(2)}`);
        }
      });
      const total = Object.values(data.monthlyAmounts).reduce((sum, val) => sum + val, 0);
      console.log(`      TOTAL: $${total.toFixed(2)}\n`);
    });

    // Format operating income - include account info
    const formattedOperatingIncome = Object.entries(operatingIncome).map(([category, data]) => {
      const monthlyValues = months.map(m => data.monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        account_id: data.account_id,
        account_code: data.account_code,
        account_name: data.account_name,
        monthlyValues,
        total
      };
    });

    // Format operating expenses - include account info
    const formattedOperatingExpenses = Object.entries(operatingExpenses).map(([category, data]) => {
      const monthlyValues = months.map(m => data.monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        account_id: data.account_id,
        account_code: data.account_code,
        account_name: data.account_name,
        monthlyValues,
        total
      };
    });

    // Format investing activities - include account info
    const formattedInvesting = Object.entries(investingActivities).map(([category, data]) => {
      const monthlyValues = months.map(m => data.monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        account_id: data.account_id,
        account_code: data.account_code,
        account_name: data.account_name,
        monthlyValues,
        total
      };
    });

    // Format financing activities - include account info
    const formattedFinancing = Object.entries(financingActivities).map(([category, data]) => {
      const monthlyValues = months.map(m => data.monthlyAmounts[m.key] || 0);
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return {
        category,
        account_id: data.account_id,
        account_code: data.account_code,
        account_name: data.account_name,
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

