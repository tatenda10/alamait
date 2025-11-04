const db = require('../services/db');

// Get trial balance data
const getTrialBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId, startDate, endDate } = req.query;
    
    // Build date filter for transactions
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = `AND DATE(t.transaction_date) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    // Calculate balances directly from journal entries
    // This ensures accuracy instead of relying on potentially stale current_account_balances
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(
          SUM(
            CASE 
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
              ELSE 0
            END
          ), 0
        ) as current_balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
        ${dateFilter}
      GROUP BY coa.id, coa.code, coa.name, coa.type
    `;
    
    const [rows] = await connection.query(query, params);
    
    // Get Petty Cash balance from petty_cash_accounts table (if code is 10001)
    const pettyCashCode = '10001';
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);
    const pettyCashBalance = parseFloat(pettyCashResult[0]?.total_balance || 0);
    
    // Process rows to calculate debit/credit balances and replace Petty Cash if needed
    const processedRows = rows.map(row => {
      let balance = parseFloat(row.current_balance || 0);
      
      // Replace Petty Cash balance with actual petty cash accounts sum
      if (row.account_code === pettyCashCode) {
        balance = pettyCashBalance;
      }
      
      // Calculate debit and credit balances based on account type
      let debitBalance = 0;
      let creditBalance = 0;
      
      if (row.account_type === 'Asset' || row.account_type === 'Expense') {
        if (balance > 0) {
          debitBalance = balance;
        } else if (balance < 0) {
          creditBalance = Math.abs(balance);
        }
      } else if (row.account_type === 'Liability' || row.account_type === 'Equity' || row.account_type === 'Revenue') {
        if (balance > 0) {
          creditBalance = balance;
        } else if (balance < 0) {
          debitBalance = Math.abs(balance);
        }
      }
      
      return {
        ...row,
        current_balance: balance,
        debit_balance: debitBalance,
        credit_balance: creditBalance
      };
    });
    
    // Calculate totals
    const totalDebits = processedRows.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const totalCredits = processedRows.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    
    res.json({
      success: true,
      data: {
        accounts: processedRows,
        summary: {
          totalDebits: totalDebits,
          totalCredits: totalCredits,
          difference: totalDebits - totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching trial balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trial balance data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get trial balance for specific boarding house
// Note: Boarding house filtering is not supported in the current global chart of accounts structure
const getTrialBalanceByBoardingHouse = async (req, res) => {
  // Just call getTrialBalance and add warning
  try {
    // Temporarily override res.json to add warning
    const originalJson = res.json;
    res.json = function(data) {
      if (data && data.success && data.data) {
        data.warning = 'Boarding house filtering is not supported in the current system. Showing global trial balance data.';
      }
      originalJson.call(this, data);
    };
    
    await getTrialBalance(req, res);
  } catch (error) {
    // If getTrialBalance already sent response, handle error here
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trial balance data',
        error: error.message
      });
    }
  }
};

// Export trial balance to CSV
const exportTrialBalance = async (req, res) => {
  // Use the same logic as getTrialBalance but return CSV instead
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId, startDate, endDate } = req.query;
    
    // Build date filter for transactions
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = `AND DATE(t.transaction_date) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    // Calculate balances directly from journal entries
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(
          SUM(
            CASE 
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
              ELSE 0
            END
          ), 0
        ) as current_balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
        ${dateFilter}
      GROUP BY coa.id, coa.code, coa.name, coa.type
      ORDER BY coa.code
    `;
    
    const [rows] = await connection.query(query, params);
    
    // Get Petty Cash balance from petty_cash_accounts table
    const pettyCashCode = '10001';
    const [pettyCashResult] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);
    const pettyCashBalance = parseFloat(pettyCashResult[0]?.total_balance || 0);
    
    // Process rows to calculate debit/credit balances
    const processedRows = rows.map(row => {
      let balance = parseFloat(row.current_balance || 0);
      
      // Replace Petty Cash balance with actual petty cash accounts sum
      if (row.account_code === pettyCashCode) {
        balance = pettyCashBalance;
      }
      
      // Calculate debit and credit balances based on account type
      let debitBalance = 0;
      let creditBalance = 0;
      
      if (row.account_type === 'Asset' || row.account_type === 'Expense') {
        if (balance > 0) {
          debitBalance = balance;
        } else if (balance < 0) {
          creditBalance = Math.abs(balance);
        }
      } else if (row.account_type === 'Liability' || row.account_type === 'Equity' || row.account_type === 'Revenue') {
        if (balance > 0) {
          creditBalance = balance;
        } else if (balance < 0) {
          debitBalance = Math.abs(balance);
        }
      }
      
      return {
        ...row,
        debit_balance: debitBalance,
        credit_balance: creditBalance
      };
    });
    
    // Calculate totals
    const totalDebits = processedRows.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const totalCredits = processedRows.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    
    // Generate CSV content
    const csvHeader = 'Account Code,Account Name,Account Type,Debit Balance,Credit Balance\n';
    const csvRows = processedRows.map(account => 
      `${account.account_code},"${account.account_name}",${account.account_type},${account.debit_balance.toFixed(2)},${account.credit_balance.toFixed(2)}`
    ).join('\n');
    
    const csvFooter = `\nTOTAL,,,${totalDebits.toFixed(2)},${totalCredits.toFixed(2)}`;
    const csvContent = csvHeader + csvRows + csvFooter;
    
    // Set headers for CSV download
    const filename = `trial-balance-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting trial balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export trial balance',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getTrialBalance,
  getTrialBalanceByBoardingHouse,
  exportTrialBalance
};