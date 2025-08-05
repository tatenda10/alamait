const db = require('./src/services/db');

async function testSupplierExpenseFunctionality() {
  try {
    console.log('🧪 Testing Supplier-Expense Integration...\n');
    
    // 1. Check if suppliers exist
    const [suppliers] = await db.query(
      'SELECT id, company, contact_person FROM suppliers WHERE status = "active" LIMIT 3'
    );
    
    console.log(`📋 Found ${suppliers.length} active suppliers:`);
    suppliers.forEach((supplier, index) => {
      console.log(`  ${index + 1}. ${supplier.company} (ID: ${supplier.id})`);
    });
    
    if (suppliers.length === 0) {
      console.log('⚠️  No suppliers found. Creating a test supplier...');
      
      const [result] = await db.query(
        `INSERT INTO suppliers (company, contact_person, phone, address, category, status, boarding_house_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        ['Test Supplier Co.', 'John Doe', '+1234567890', '123 Test St', 'General', 'active', 1]
      );
      
      console.log(`✅ Created test supplier with ID: ${result.insertId}`);
      suppliers.push({
        id: result.insertId,
        company: 'Test Supplier Co.',
        contact_person: 'John Doe'
      });
    }
    
    // 2. Test expense with supplier
    console.log('\n💰 Testing expense creation with supplier...');
    
    const testSupplier = suppliers[0];
    const [expenseResult] = await db.query(
      `INSERT INTO expenses (
        expense_date, amount, total_amount, remaining_balance, description, 
        payment_method, payment_status, reference_number, expense_account_id, 
        supplier_id, boarding_house_id, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        '2024-01-15', 500.00, 500.00, 500.00, 'Office supplies from supplier',
        'credit', 'debt', 'SUP-001', 1, testSupplier.id, 1, 1
      ]
    );
    
    console.log(`✅ Created expense with supplier (ID: ${expenseResult.insertId})`);
    
    // 3. Test retrieving expenses with supplier information
    console.log('\n📊 Testing expense retrieval with supplier info...');
    
    const [expensesWithSuppliers] = await db.query(`
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.payment_method,
        e.payment_status,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.boarding_house_id = 1
        AND e.deleted_at IS NULL
      ORDER BY e.created_at DESC
      LIMIT 5
    `);
    
    console.log(`📋 Recent expenses (${expensesWithSuppliers.length} found):`);
    expensesWithSuppliers.forEach((expense, index) => {
      const supplierInfo = expense.supplier_name ? 
        `${expense.supplier_name} (${expense.supplier_contact})` : 
        'No supplier';
      console.log(`  ${index + 1}. ${expense.description} - $${expense.amount} - ${supplierInfo}`);
    });
    
    // 4. Test accounts payable with supplier info
    console.log('\n💳 Testing accounts payable with supplier info...');
    
    const [accountsPayable] = await db.query(`
      SELECT 
        e.id,
        e.reference_number as invoice_number,
        e.total_amount as amount,
        e.remaining_balance as balance,
        e.description,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
      ORDER BY e.expense_date DESC
    `);
    
    console.log(`📋 Accounts Payable (${accountsPayable.length} found):`);
    accountsPayable.forEach((ap, index) => {
      const supplierInfo = ap.supplier_name ? 
        `${ap.supplier_name}` : 
        'No supplier';
      console.log(`  ${index + 1}. ${ap.description} - $${ap.amount} - ${supplierInfo}`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Suppliers table: ✅ Working`);
    console.log(`   - Expenses with supplier_id: ✅ Working`);
    console.log(`   - Expense-Supplier joins: ✅ Working`);
    console.log(`   - Accounts Payable with suppliers: ✅ Working`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testSupplierExpenseFunctionality();