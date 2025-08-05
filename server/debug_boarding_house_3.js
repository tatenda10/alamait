const db = require('./src/services/db');

async function debugBoardingHouse3() {
  try {
    console.log('🔍 Debugging boarding house ID 3 expenses...\n');
    
    // First, check all expenses for boarding house 3
    const [allExpenses] = await db.query(`
      SELECT 
        e.id,
        e.description,
        e.payment_method,
        e.payment_status,
        e.total_amount,
        e.remaining_balance,
        e.boarding_house_id,
        bh.name as boarding_house_name
      FROM expenses e
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      WHERE e.boarding_house_id = 3
        AND e.deleted_at IS NULL
      ORDER BY e.id
    `);
    
    console.log(`📊 All expenses for boarding house 3: ${allExpenses.length} found`);
    allExpenses.forEach((expense, index) => {
      console.log(`${index + 1}. ID: ${expense.id}`);
      console.log(`   Description: ${expense.description}`);
      console.log(`   Payment Method: ${expense.payment_method}`);
      console.log(`   Payment Status: ${expense.payment_status}`);
      console.log(`   Amount: $${expense.total_amount}`);
      console.log(`   Balance: $${expense.remaining_balance}`);
      console.log(`   Boarding House: ${expense.boarding_house_name}`);
      console.log('');
    });
    
    // Check credit expenses specifically
    const [creditExpenses] = await db.query(`
      SELECT 
        e.id,
        e.description,
        e.payment_method,
        e.payment_status,
        e.total_amount,
        e.remaining_balance
      FROM expenses e
      WHERE e.boarding_house_id = 3
        AND e.payment_method = 'credit'
        AND e.deleted_at IS NULL
      ORDER BY e.id
    `);
    
    console.log(`💳 Credit expenses for boarding house 3: ${creditExpenses.length} found`);
    creditExpenses.forEach((expense, index) => {
      console.log(`${index + 1}. ID: ${expense.id}, Status: ${expense.payment_status}, Amount: $${expense.total_amount}`);
    });
    
    // Check what the accounts payable query returns
    const [accountsPayable] = await db.query(`
      SELECT 
        e.id,
        e.description,
        e.payment_method,
        e.payment_status,
        e.total_amount,
        e.remaining_balance
      FROM expenses e
      WHERE e.boarding_house_id = 3
        AND e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
      ORDER BY e.id
    `);
    
    console.log(`🏦 Accounts payable query result: ${accountsPayable.length} found`);
    accountsPayable.forEach((expense, index) => {
      console.log(`${index + 1}. ID: ${expense.id}, Status: ${expense.payment_status}, Amount: $${expense.total_amount}`);
    });
    
    // Check all possible payment statuses
    const [statuses] = await db.query(`
      SELECT DISTINCT payment_status, COUNT(*) as count
      FROM expenses 
      WHERE boarding_house_id = 3 AND deleted_at IS NULL
      GROUP BY payment_status
    `);
    
    console.log('\n📈 Payment status distribution for boarding house 3:');
    statuses.forEach(status => {
      console.log(`   ${status.payment_status}: ${status.count} expenses`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugBoardingHouse3();