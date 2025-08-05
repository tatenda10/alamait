const db = require('../services/db');

/**
 * Get all accounts payable data
 * This includes credit expenses that haven't been paid yet
 */
exports.getAccountsPayable = async (req, res) => {
  try {
    const { boarding_house_id } = req.query;
    const userBoardingHouseId = req.user?.boarding_house_id;
    
    // Use provided boarding_house_id or fall back to user's boarding house
    const filterBoardingHouseId = boarding_house_id || userBoardingHouseId;
    
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
        bh.name as boarding_house_name
      FROM expenses e
      LEFT JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      WHERE e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
    `;
    
    const params = [];
    
    if (filterBoardingHouseId) {
      query += ' AND e.boarding_house_id = ?';
      params.push(filterBoardingHouseId);
    }
    
    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    const [accountsPayable] = await db.query(query, params);
    
    res.json({
      data: accountsPayable,
      message: 'Accounts payable retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching accounts payable:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get accounts payable summary/totals
 */
exports.getAccountsPayableSummary = async (req, res) => {
  try {
    const { boarding_house_id } = req.query;
    const userBoardingHouseId = req.user?.boarding_house_id;
    
    // Use provided boarding_house_id or fall back to user's boarding house
    const filterBoardingHouseId = boarding_house_id || userBoardingHouseId;
    
    let query = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(e.remaining_balance) as total_outstanding,
        SUM(CASE WHEN e.payment_status = 'debt' THEN e.remaining_balance ELSE 0 END) as pending_amount,
        SUM(CASE WHEN e.payment_status = 'partial' THEN e.remaining_balance ELSE 0 END) as partial_amount,
        COUNT(CASE WHEN DATEDIFF(CURDATE(), e.expense_date) > 30 THEN 1 END) as overdue_count,
        SUM(CASE WHEN DATEDIFF(CURDATE(), e.expense_date) > 30 THEN e.remaining_balance ELSE 0 END) as overdue_amount
      FROM expenses e
      WHERE e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
    `;
    
    const params = [];
    
    if (filterBoardingHouseId) {
      query += ' AND e.boarding_house_id = ?';
      params.push(filterBoardingHouseId);
    }
    
    const [summary] = await db.query(query, params);
    
    res.json({
      data: summary[0] || {
        total_invoices: 0,
        total_outstanding: 0,
        pending_amount: 0,
        partial_amount: 0,
        overdue_count: 0,
        overdue_amount: 0
      },
      message: 'Accounts payable summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching accounts payable summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};