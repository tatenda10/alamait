const db = require('../services/db');

// Get balance sheet data
const getBalanceSheet = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId, asOfDate } = req.query;
    
    console.log('Balance Sheet request params:', { boardingHouseId, asOfDate });
    
    // Use current date if no asOfDate provided
    const reportDate = asOfDate || new Date().toISOString().split('T')[0];
    
    // Get all account balances grouped by type
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
    `;
    
    const params = [];
    
    // Add date filter if specified
    if (asOfDate) {
      query += ` AND (cab.updated_at <= ? OR cab.updated_at IS NULL)`;
      params.push(asOfDate);
    }
    
    query += ` ORDER BY coa.type, coa.code`;
    
    console.log('Balance Sheet Query:', query);
    console.log('Query Parameters:', params);
    
    const [rows] = await connection.query(query, params);
    
    // Group accounts by type
    const balanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: []
    };
    
    rows.forEach(row => {
      const account = {
        code: row.account_code,
        name: row.account_name,
        type: row.account_type,
        currentBalance: parseFloat(row.current_balance),
        debitBalance: parseFloat(row.debit_balance),
        creditBalance: parseFloat(row.credit_balance)
      };
      
      switch (row.account_type) {
        case 'Asset':
          balanceSheet.assets.push(account);
          break;
        case 'Liability':
          balanceSheet.liabilities.push(account);
          break;
        case 'Equity':
          balanceSheet.equity.push(account);
          break;
        case 'Revenue':
          balanceSheet.revenue.push(account);
          break;
        case 'Expense':
          balanceSheet.expenses.push(account);
          break;
      }
    });
    
    // Calculate totals
    const totalAssets = balanceSheet.assets.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                       balanceSheet.assets.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    const totalLiabilities = balanceSheet.liabilities.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                            balanceSheet.liabilities.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalEquity = balanceSheet.equity.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                       balanceSheet.equity.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalRevenue = balanceSheet.revenue.reduce((sum, acc) => sum + acc.creditBalance, 0) - 
                        balanceSheet.revenue.reduce((sum, acc) => sum + acc.debitBalance, 0);
    
    const totalExpenses = balanceSheet.expenses.reduce((sum, acc) => sum + acc.debitBalance, 0) - 
                         balanceSheet.expenses.reduce((sum, acc) => sum + acc.creditBalance, 0);
    
    // Calculate net income (Revenue - Expenses)
    const netIncome = totalRevenue - totalExpenses;
    
    // Calculate total equity (Equity + Net Income)
    const totalEquityWithIncome = totalEquity + netIncome;
    
    // Calculate totals for balance sheet equation
    const totalAssetsFinal = totalAssets;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;
    
    res.json({
      success: true,
      data: {
        reportDate,
        balanceSheet,
        summary: {
          totalAssets: totalAssetsFinal,
          totalLiabilities: totalLiabilities,
          totalEquity: totalEquity,
          totalRevenue: totalRevenue,
          totalExpenses: totalExpenses,
          netIncome: netIncome,
          totalEquityWithIncome: totalEquityWithIncome,
          totalLiabilitiesAndEquity: totalLiabilitiesAndEquity,
          isBalanced: Math.abs(totalAssetsFinal - totalLiabilitiesAndEquity) < 0.01
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance sheet data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Export balance sheet to CSV
const exportBalanceSheet = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId, asOfDate } = req.query;
    
    // Use current date if no asOfDate provided
    const reportDate = asOfDate || new Date().toISOString().split('T')[0];
    
    // Get balance sheet data (same query as getBalanceSheet)
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
    `;
    
    const params = [];
    
    if (asOfDate) {
      query += ` AND (cab.updated_at <= ? OR cab.updated_at IS NULL)`;
      params.push(asOfDate);
    }
    
    query += ` ORDER BY coa.type, coa.code`;
    
    const [rows] = await connection.query(query, params);
    
    // Generate CSV content
    let csvContent = 'Balance Sheet\n';
    csvContent += `As of: ${reportDate}\n\n`;
    
    // Assets section
    csvContent += 'ASSETS\n';
    csvContent += 'Account Code,Account Name,Debit Balance,Credit Balance\n';
    
    const assets = rows.filter(row => row.account_type === 'Asset');
    assets.forEach(asset => {
      const debit = parseFloat(asset.debit_balance || 0);
      const credit = parseFloat(asset.credit_balance || 0);
      if (debit > 0 || credit > 0) {
        csvContent += `${asset.account_code},"${asset.account_name}",${debit},${credit}\n`;
      }
    });
    
    // Calculate total assets
    const totalAssets = assets.reduce((sum, asset) => {
      return sum + parseFloat(asset.debit_balance || 0) - parseFloat(asset.credit_balance || 0);
    }, 0);
    csvContent += `TOTAL ASSETS,,${totalAssets},0\n\n`;
    
    // Liabilities section
    csvContent += 'LIABILITIES\n';
    csvContent += 'Account Code,Account Name,Debit Balance,Credit Balance\n';
    
    const liabilities = rows.filter(row => row.account_type === 'Liability');
    liabilities.forEach(liability => {
      const debit = parseFloat(liability.debit_balance || 0);
      const credit = parseFloat(liability.credit_balance || 0);
      if (debit > 0 || credit > 0) {
        csvContent += `${liability.account_code},"${liability.account_name}",${debit},${credit}\n`;
      }
    });
    
    const totalLiabilities = liabilities.reduce((sum, liability) => {
      return sum + parseFloat(liability.credit_balance || 0) - parseFloat(liability.debit_balance || 0);
    }, 0);
    csvContent += `TOTAL LIABILITIES,,0,${totalLiabilities}\n\n`;
    
    // Equity section
    csvContent += 'EQUITY\n';
    csvContent += 'Account Code,Account Name,Debit Balance,Credit Balance\n';
    
    const equity = rows.filter(row => row.account_type === 'Equity');
    equity.forEach(equityItem => {
      const debit = parseFloat(equityItem.debit_balance || 0);
      const credit = parseFloat(equityItem.credit_balance || 0);
      if (debit > 0 || credit > 0) {
        csvContent += `${equityItem.account_code},"${equityItem.account_name}",${debit},${credit}\n`;
      }
    });
    
    const totalEquity = equity.reduce((sum, equityItem) => {
      return sum + parseFloat(equityItem.credit_balance || 0) - parseFloat(equityItem.debit_balance || 0);
    }, 0);
    csvContent += `TOTAL EQUITY,,0,${totalEquity}\n\n`;
    
    // Revenue and Expenses (for P&L)
    csvContent += 'REVENUE\n';
    csvContent += 'Account Code,Account Name,Debit Balance,Credit Balance\n';
    
    const revenue = rows.filter(row => row.account_type === 'Revenue');
    revenue.forEach(rev => {
      const debit = parseFloat(rev.debit_balance || 0);
      const credit = parseFloat(rev.credit_balance || 0);
      if (debit > 0 || credit > 0) {
        csvContent += `${rev.account_code},"${rev.account_name}",${debit},${credit}\n`;
      }
    });
    
    const totalRevenue = revenue.reduce((sum, rev) => {
      return sum + parseFloat(rev.credit_balance || 0) - parseFloat(rev.debit_balance || 0);
    }, 0);
    csvContent += `TOTAL REVENUE,,0,${totalRevenue}\n\n`;
    
    csvContent += 'EXPENSES\n';
    csvContent += 'Account Code,Account Name,Debit Balance,Credit Balance\n';
    
    const expenses = rows.filter(row => row.account_type === 'Expense');
    expenses.forEach(expense => {
      const debit = parseFloat(expense.debit_balance || 0);
      const credit = parseFloat(expense.credit_balance || 0);
      if (debit > 0 || credit > 0) {
        csvContent += `${expense.account_code},"${expense.account_name}",${debit},${credit}\n`;
      }
    });
    
    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.debit_balance || 0) - parseFloat(expense.credit_balance || 0);
    }, 0);
    csvContent += `TOTAL EXPENSES,,${totalExpenses},0\n\n`;
    
    // Net Income
    const netIncome = totalRevenue - totalExpenses;
    csvContent += `NET INCOME,,${netIncome < 0 ? Math.abs(netIncome) : 0},${netIncome > 0 ? netIncome : 0}\n\n`;
    
    // Balance Sheet Equation
    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;
    
    csvContent += `BALANCE SHEET EQUATION\n`;
    csvContent += `Total Assets,${totalAssets}\n`;
    csvContent += `Total Liabilities + Equity,${totalLiabilitiesAndEquity}\n`;
    csvContent += `Difference,${totalAssets - totalLiabilitiesAndEquity}\n`;
    csvContent += `Balanced,${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? 'Yes' : 'No'}\n`;
    
    // Set headers for CSV download
    const filename = `balance-sheet-${reportDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting balance sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export balance sheet',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getBalanceSheet,
  exportBalanceSheet
};
