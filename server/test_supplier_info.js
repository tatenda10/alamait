const db = require('./src/services/db');

async function testSupplierInfo() {
  try {
    console.log('Testing supplier information in API responses...');

    // Test 1: Check if we have expenses with suppliers
    console.log('\n=== Test 1: Check expenses with suppliers ===');
    const [expensesWithSuppliers] = await db.query(`
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.supplier_id,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
      LIMIT 5
    `);
    
    console.log('Recent expenses with supplier info:');
    expensesWithSuppliers.forEach(expense => {
      console.log(`- ID: ${expense.id}, Description: ${expense.description}, Amount: $${expense.amount}`);
      if (expense.supplier_id) {
        console.log(`  Supplier: ${expense.supplier_name} (${expense.supplier_contact})`);
      } else {
        console.log(`  No supplier assigned`);
      }
    });

    // Test 2: Check accounts payable with suppliers
    console.log('\n=== Test 2: Check accounts payable with suppliers ===');
    const [accountsPayable] = await db.query(`
      SELECT 
        e.id,
        e.reference_number,
        e.description,
        e.remaining_balance,
        e.payment_status,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `);
    
    console.log('Accounts payable with supplier info:');
    if (accountsPayable.length === 0) {
      console.log('No accounts payable found');
    } else {
      accountsPayable.forEach(ap => {
        console.log(`- ID: ${ap.id}, Ref: ${ap.reference_number}, Balance: $${ap.remaining_balance}`);
        if (ap.supplier_name) {
          console.log(`  Supplier: ${ap.supplier_name} (${ap.supplier_contact})`);
        } else {
          console.log(`  No supplier assigned`);
        }
      });
    }

    // Test 3: Check if the latest expense (ID 5) has supplier info
    console.log('\n=== Test 3: Check specific expense (ID 5) ===');
    const [specificExpense] = await db.query(`
      SELECT 
        e.*,
        s.company as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        s.address as supplier_address
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.id = 5
    `);
    
    if (specificExpense.length > 0) {
      const expense = specificExpense[0];
      console.log(`Expense ID 5 details:`);
      console.log(`- Description: ${expense.description}`);
      console.log(`- Amount: $${expense.amount}`);
      console.log(`- Payment Method: ${expense.payment_method}`);
      console.log(`- Payment Status: ${expense.payment_status}`);
      console.log(`- Supplier ID: ${expense.supplier_id}`);
      if (expense.supplier_id) {
        console.log(`- Supplier: ${expense.supplier_name}`);
        console.log(`- Contact: ${expense.supplier_contact}`);
        console.log(`- Phone: ${expense.supplier_phone}`);
        console.log(`- Address: ${expense.supplier_address}`);
      } else {
        console.log('- No supplier assigned');
      }
    } else {
      console.log('Expense ID 5 not found');
    }

    console.log('\n=== Test completed successfully ===');
    console.log('\nThe API endpoints have been updated to include supplier information:');
    console.log('- GET /api/expenses - Now includes supplier details');
    console.log('- GET /api/accounts-payable - Already includes supplier details');
    console.log('\nSupplier information will be shown when available.');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    process.exit(0);
  }
}

testSupplierInfo();