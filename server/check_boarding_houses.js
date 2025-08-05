const db = require('./src/services/db');

async function checkBoardingHouses() {
  try {
    console.log('🏠 Checking boarding houses...\n');
    
    const [boardingHouses] = await db.query('SELECT * FROM boarding_houses ORDER BY id');
    
    console.log(`Found ${boardingHouses.length} boarding houses:`);
    boardingHouses.forEach(bh => {
      console.log(`ID: ${bh.id}, Name: ${bh.name}, Location: ${bh.location || 'N/A'}`);
    });
    
    // Also check which boarding house has the credit expenses
    const [expensesWithBH] = await db.query(`
      SELECT 
        e.id,
        e.boarding_house_id,
        bh.name as boarding_house_name,
        e.payment_method,
        e.payment_status
      FROM expenses e
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      WHERE e.payment_method = 'credit'
        AND e.deleted_at IS NULL
      ORDER BY e.id
    `);
    
    console.log('\n💳 Credit expenses by boarding house:');
    expensesWithBH.forEach(exp => {
      console.log(`Expense ID: ${exp.id}, Boarding House ID: ${exp.boarding_house_id}, Name: ${exp.boarding_house_name}, Status: ${exp.payment_status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkBoardingHouses();