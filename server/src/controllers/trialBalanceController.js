const db = require('../services/db');

// Get trial balance data
const getTrialBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId, startDate, endDate } = req.query;
    
    // Build the query to get account balances
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.deleted_at IS NULL
    `;
    
    const params = [];
    
    // Note: Boarding house filtering is not supported in the current global chart of accounts structure
    // The current_account_balances table doesn't have a boarding_house_id column
    
    // Add date range filter if specified
    if (startDate && endDate) {
      query += ` AND cab.updated_at >= ? AND cab.updated_at <= ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY coa.code`;
    
    console.log('Trial Balance Query:', query);
    console.log('Query Parameters:', params);
    
    const [rows] = await connection.query(query, params);
    
    // Calculate totals
    const totalDebits = rows.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const totalCredits = rows.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    
    res.json({
      success: true,
      data: {
        accounts: rows,
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
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!boardingHouseId) {
      return res.status(400).json({
        success: false,
        message: 'Boarding house ID is required'
      });
    }
    
    // Since boarding house filtering is not supported, return the same data as general trial balance
    // but with a warning message
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.deleted_at IS NULL
    `;
    
    const params = [];
    
    // Add date range filter if specified
    if (startDate && endDate) {
      query += ` AND cab.updated_at >= ? AND cab.updated_at <= ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY coa.code`;
    
    const [rows] = await connection.query(query, params);
    
    // Calculate totals
    const totalDebits = rows.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const totalCredits = rows.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    
    res.json({
      success: true,
      data: {
        accounts: rows,
        summary: {
          totalDebits: totalDebits,
          totalCredits: totalCredits,
          difference: totalDebits - totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      },
      warning: 'Boarding house filtering is not supported in the current system. Showing global trial balance data.'
    });
    
  } catch (error) {
    console.error('Error fetching trial balance for boarding house:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trial balance data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Export trial balance to CSV
const exportTrialBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { boardingHouseId, startDate, endDate } = req.query;
    
    // Build the query to get account balances (same as getTrialBalance)
    let query = `
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.deleted_at IS NULL
    `;
    
    const params = [];
    
    // Note: Boarding house filtering is not supported in the current global chart of accounts structure
    // The current_account_balances table doesn't have a boarding_house_id column
    
    // Add date range filter if specified
    if (startDate && endDate) {
      query += ` AND cab.updated_at >= ? AND cab.updated_at <= ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY coa.code`;
    
    const [rows] = await connection.query(query, params);
    
    // Calculate totals
    const totalDebits = rows.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const totalCredits = rows.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    
    // Generate CSV content
    const csvHeader = 'Account Code,Account Name,Account Type,Debit Balance,Credit Balance\n';
    const csvRows = rows.map(account => 
      `${account.account_code},"${account.account_name}",${account.account_type},${account.debit_balance},${account.credit_balance}`
    ).join('\n');
    
    const csvFooter = `\nTOTAL,,,${totalDebits},${totalCredits}`;
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