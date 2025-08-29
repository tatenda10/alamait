const db = require('./src/services/db');

async function testExpenses() {
  try {
    console.log('Testing expenses table...\n');

    // Check if expenses table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'expenses'");
    console.log(`Expenses table exists: ${tables.length > 0 ? '✅ YES' : '❌ NO'}`);

    if (tables.length > 0) {
      // Count total expenses
      const [countResult] = await db.query('SELECT COUNT(*) as count FROM expenses');
      console.log(`Total expenses: ${countResult[0].count}`);

      // Get a sample expense
      const [sampleExpense] = await db.query('SELECT id, description, amount FROM expenses LIMIT 1');
      if (sampleExpense.length > 0) {
        console.log(`Sample expense: ID ${sampleExpense[0].id}, ${sampleExpense[0].description}, $${sampleExpense[0].amount}`);
      } else {
        console.log('No expenses found in database');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

testExpenses();

