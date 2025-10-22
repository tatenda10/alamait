const db = require('../src/services/db');

async function testExpensesAPI() {
  try {
    console.log('🔍 Testing expenses API for boarding house 4...');
    
    // Simulate the same query as the API
    const boardingHouseId = 4;
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = '';
    
    // Get total count
    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM expenses e
       JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
       WHERE e.boarding_house_id = ?
         AND e.deleted_at IS NULL
         AND coa.name != 'Petty Cash Expense'
         AND (
           e.description LIKE ?
           OR e.reference_number LIKE ?
           OR coa.name LIKE ?
           OR coa.code LIKE ?
         )`,
      [boardingHouseId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    );
    
    console.log('Total expenses found:', totalResult[0].total);
    
    // Get expenses
    const [expenses] = await db.query(
      `SELECT 
        e.*,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        t.status as transaction_status,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
      LEFT JOIN transactions t ON e.transaction_id = t.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.boarding_house_id = ?
        AND e.deleted_at IS NULL
        AND coa.name != 'Petty Cash Expense'
        AND (
          e.description LIKE ?
          OR e.reference_number LIKE ?
          OR coa.name LIKE ?
          OR coa.code LIKE ?
        )
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?`,
      [boardingHouseId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    );
    
    console.log('Expenses found:');
    console.table(expenses);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testExpensesAPI();
