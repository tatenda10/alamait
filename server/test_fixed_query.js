const db = require('./src/services/db');

async function testFixedQuery() {
  try {
    console.log('Testing the fixed getAllExpenses query...');

    // Test the exact query from getAllExpenses function
    const [expenses] = await db.query(
      `SELECT 
        'regular' as expense_type,
        e.id,
        e.expense_date,
        e.amount,
        e.description,
        e.payment_method,
        e.reference_number,
        e.expense_account_id,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        coa.type as expense_account_type,
        t.status as transaction_status,
        e.boarding_house_id,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        e.receipt_path,
        e.receipt_original_name,
        e.supplier_id,
        s.company as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        s.address as supplier_address,
        e.created_at,
        e.updated_at
      FROM expenses e
      LEFT JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN transactions t ON e.transaction_id = t.id
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.deleted_at IS NULL

      UNION ALL

      SELECT 
        'petty_cash' as expense_type,
        pce.id,
        pce.expense_date,
        pce.amount,
        pce.description,
        'petty_cash' as payment_method,
        pce.receipt_number as reference_number,
        pce.expense_account_id,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        coa.type as expense_account_type,
        pce.status as transaction_status,
        pca.boarding_house_id,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        pce.receipt_path,
        pce.receipt_original_name,
        NULL as supplier_id,
        NULL as supplier_name,
        NULL as supplier_contact,
        NULL as supplier_phone,
        NULL as supplier_address,
        pce.created_at,
        pce.updated_at
      FROM petty_cash_expenses pce
      LEFT JOIN chart_of_accounts_branch coa ON pce.expense_account_id = coa.id
      LEFT JOIN petty_cash_accounts pca ON pce.petty_cash_account_id = pca.id
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pce.deleted_at IS NULL

      ORDER BY expense_date DESC, created_at DESC`,
      []
    );

    console.log(`✅ Query executed successfully!`);
    console.log(`Found ${expenses.length} expenses total`);
    
    if (expenses.length > 0) {
      console.log('\nSample results:');
      expenses.slice(0, 3).forEach((expense, index) => {
        console.log(`\n${index + 1}. Expense ID: ${expense.id}`);
        console.log(`   Type: ${expense.expense_type}`);
        console.log(`   Description: ${expense.description}`);
        console.log(`   Amount: $${expense.amount}`);
        console.log(`   Payment Method: ${expense.payment_method}`);
        if (expense.supplier_id) {
          console.log(`   Supplier: ${expense.supplier_name} (${expense.supplier_contact})`);
        } else {
          console.log(`   Supplier: None`);
        }
      });
    }

    console.log('\n✅ The UNION ALL query is now working correctly!');
    console.log('✅ Both regular expenses and petty cash expenses have the same number of columns');
    console.log('✅ Supplier information is included for regular expenses');
    console.log('✅ NULL values are used for supplier fields in petty cash expenses');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.sql) {
      console.log('SQL Query:', error.sql);
    }
  } finally {
    process.exit(0);
  }
}

testFixedQuery();