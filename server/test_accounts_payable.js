const db = require('./src/services/db');

async function testAccountsPayable() {
  try {
    console.log('Testing Accounts Payable functionality...\n');
    
    // 1. Check current credit expenses
    const [creditExpenses] = await db.query(
      'SELECT COUNT(*) as count FROM expenses WHERE payment_method = "credit"'
    );
    console.log(`Current credit expenses: ${creditExpenses[0].count}`);
    
    // 2. Test the accounts payable query directly
    const [apResults] = await db.query(`
      SELECT 
        e.id,
        e.reference_number as invoice_number,
        e.expense_date as date,
        e.total_amount as amount,
        e.remaining_balance as balance,
        e.payment_status,
        e.description,
        coa.name as account_name,
        bh.name as boarding_house_name
      FROM expenses e
      LEFT JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      WHERE e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
      ORDER BY e.expense_date DESC
      LIMIT 5
    `);
    
    console.log(`\nAccounts Payable Results (${apResults.length} records):`);
    apResults.forEach((record, index) => {
      console.log(`${index + 1}. ${record.description} - $${record.amount} (Status: ${record.payment_status})`);
    });
    
    // 3. Check if Accounts Payable account exists
    const [apAccount] = await db.query(
      'SELECT * FROM chart_of_accounts_branch WHERE code = "20001" LIMIT 1'
    );
    
    if (apAccount.length > 0) {
      console.log(`\nAccounts Payable account found: ${apAccount[0].name} (Code: ${apAccount[0].code})`);
    } else {
      console.log('\nWARNING: Accounts Payable account (20001) not found!');
    }
    
    console.log('\n✅ Accounts Payable test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing accounts payable:', error.message);
  } finally {
    process.exit(0);
  }
}

testAccountsPayable();