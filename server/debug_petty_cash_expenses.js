const db = require('./src/services/db');

async function debugPettyCashExpenses() {
  try {
    console.log('Debugging petty cash expenses in accounts payable...\n');
    
    // 1. Check for any expenses with payment_method = 'petty_cash'
    console.log('1. Checking for expenses with payment_method = "petty_cash":');
    const [pettyCashExpenses] = await db.query(`
      SELECT id, reference_number, expense_date, amount, payment_method, payment_status, 
             remaining_balance, description, supplier_id
      FROM expenses 
      WHERE payment_method = 'petty_cash' 
        AND deleted_at IS NULL
      ORDER BY expense_date DESC
    `);
    
    if (pettyCashExpenses.length > 0) {
      console.log(`Found ${pettyCashExpenses.length} expenses with payment_method = 'petty_cash':`);
      pettyCashExpenses.forEach(expense => {
        console.log(`  - ID: ${expense.id}, Date: ${expense.expense_date}, Amount: $${expense.amount}, Status: ${expense.payment_status}, Balance: $${expense.remaining_balance}`);
      });
    } else {
      console.log('No expenses found with payment_method = "petty_cash"');
    }
    
    console.log('\n2. Checking what the accounts payable query returns:');
    const [accountsPayable] = await db.query(`
      SELECT 
        e.id,
        e.reference_number as invoice_number,
        e.expense_date as date,
        e.total_amount as amount,
        e.remaining_balance as balance,
        e.payment_method,
        e.payment_status,
        e.description,
        s.company as supplier_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
      ORDER BY e.expense_date DESC
    `);
    
    console.log(`Accounts payable query returned ${accountsPayable.length} records:`);
    accountsPayable.forEach(ap => {
      console.log(`  - ID: ${ap.id}, Date: ${ap.date}, Amount: $${ap.amount}, Method: ${ap.payment_method}, Status: ${ap.payment_status}`);
    });
    
    console.log('\n3. Checking for any expenses that might be incorrectly categorized:');
    const [suspiciousExpenses] = await db.query(`
      SELECT id, reference_number, expense_date, amount, payment_method, payment_status, 
             remaining_balance, description
      FROM expenses 
      WHERE (payment_method = 'petty_cash' AND payment_status IN ('debt', 'partial'))
         OR (payment_method != 'credit' AND payment_status IN ('debt', 'partial'))
        AND deleted_at IS NULL
      ORDER BY expense_date DESC
    `);
    
    if (suspiciousExpenses.length > 0) {
      console.log(`Found ${suspiciousExpenses.length} suspicious expenses:`);
      suspiciousExpenses.forEach(expense => {
        console.log(`  - ID: ${expense.id}, Method: ${expense.payment_method}, Status: ${expense.payment_status}, Balance: $${expense.remaining_balance}`);
      });
    } else {
      console.log('No suspicious expenses found');
    }
    
    console.log('\n4. Checking petty_cash_transactions table:');
    const [pettyCashTransactions] = await db.query(`
      SELECT id, transaction_type, amount, description, vendor_name, status, transaction_date
      FROM petty_cash_transactions 
      WHERE transaction_type = 'expense' AND status = 'approved'
      ORDER BY transaction_date DESC
      LIMIT 10
    `);
    
    console.log(`Found ${pettyCashTransactions.length} approved petty cash transactions:`);
    pettyCashTransactions.forEach(tx => {
      console.log(`  - ID: ${tx.id}, Date: ${tx.transaction_date}, Amount: $${tx.amount}, Vendor: ${tx.vendor_name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error debugging petty cash expenses:', error);
  } finally {
    process.exit(0);
  }
}

debugPettyCashExpenses();