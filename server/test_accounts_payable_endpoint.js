const db = require('./src/services/db');

async function testAccountsPayableEndpoint() {
  try {
    console.log('Testing Accounts Payable endpoint logic...\n');
    
    // Simulate the exact query from accountsPayableController.js
    const query = `
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
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;
    
    console.log('Executing accounts payable query...');
    const [accountsPayable] = await db.query(query);
    
    console.log(`\nAccounts Payable Results: ${accountsPayable.length} records found`);
    
    if (accountsPayable.length > 0) {
      console.log('\nDetailed results:');
      accountsPayable.forEach((ap, index) => {
        console.log(`${index + 1}. ID: ${ap.id}`);
        console.log(`   Date: ${ap.date}`);
        console.log(`   Description: ${ap.description}`);
        console.log(`   Payment Method: ${ap.payment_method}`);
        console.log(`   Payment Status: ${ap.status}`);
        console.log(`   Amount: $${ap.amount}`);
        console.log(`   Balance: $${ap.balance}`);
        console.log(`   Supplier: ${ap.supplier_name || 'N/A'}`);
        console.log(`   Boarding House: ${ap.boarding_house_name}`);
        console.log('   ---');
      });
    } else {
      console.log('No accounts payable records found.');
    }
    
    // Also check what the getAllExpenses endpoint would return
    console.log('\n\nTesting getAllExpenses endpoint logic...');
    
    const getAllExpensesQuery = `
      SELECT 
        'regular' as expense_type,
        e.id,
        e.expense_date,
        e.amount,
        e.description,
        e.payment_method,
        e.payment_status,
        e.remaining_balance,
        e.reference_number,
        s.company as supplier_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.deleted_at IS NULL

      UNION ALL

      SELECT 
        'petty_cash' as expense_type,
        pct.id,
        pct.transaction_date as expense_date,
        pct.amount,
        pct.description,
        'petty_cash' as payment_method,
        'full' as payment_status,
        0 as remaining_balance,
        pct.receipt_number as reference_number,
        pct.vendor_name as supplier_name
      FROM petty_cash_transactions pct
      WHERE pct.deleted_at IS NULL 
        AND pct.transaction_type = 'expense' 
        AND pct.status = 'approved'

      ORDER BY expense_date DESC
    `;
    
    const [allExpenses] = await db.query(getAllExpensesQuery);
    
    console.log(`\nAll Expenses Results: ${allExpenses.length} records found`);
    
    const regularExpenses = allExpenses.filter(e => e.expense_type === 'regular');
    const pettyCashExpenses = allExpenses.filter(e => e.expense_type === 'petty_cash');
    
    console.log(`- Regular expenses: ${regularExpenses.length}`);
    console.log(`- Petty cash expenses: ${pettyCashExpenses.length}`);
    
    if (pettyCashExpenses.length > 0) {
      console.log('\nPetty Cash Expenses:');
      pettyCashExpenses.forEach((expense, index) => {
        console.log(`${index + 1}. ID: ${expense.id}, Amount: $${expense.amount}, Description: ${expense.description}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
  } finally {
    process.exit(0);
  }
}

testAccountsPayableEndpoint();