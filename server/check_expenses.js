const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkExpenses() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database successfully');

    // Check if expenses table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'expenses'");
    console.log('Expenses table exists:', tables.length > 0);

    if (tables.length > 0) {
      // Check expenses count
      const [expenseCount] = await connection.query('SELECT COUNT(*) as count FROM expenses WHERE deleted_at IS NULL');
      console.log('Total expenses in database:', expenseCount[0].count);

      // Get sample expenses
      const [expenses] = await connection.query(`
        SELECT 
          e.id,
          e.expense_date,
          e.amount,
          e.description,
          e.boarding_house_id,
          bh.name as boarding_house_name
        FROM expenses e
        LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
        WHERE e.deleted_at IS NULL
        LIMIT 5
      `);
      
      console.log('Sample expenses:');
      expenses.forEach(expense => {
        console.log(`- ID: ${expense.id}, Amount: ${expense.amount}, Description: ${expense.description}, BH: ${expense.boarding_house_name}`);
      });
    }

    // Check petty cash expenses
    const [pettyCashTables] = await connection.query("SHOW TABLES LIKE 'petty_cash_expenses'");
    console.log('Petty cash expenses table exists:', pettyCashTables.length > 0);

    if (pettyCashTables.length > 0) {
      const [pettyCashCount] = await connection.query('SELECT COUNT(*) as count FROM petty_cash_expenses WHERE deleted_at IS NULL');
      console.log('Total petty cash expenses in database:', pettyCashCount[0].count);
    }

    // Check transactions
    const [transactionTables] = await connection.query("SHOW TABLES LIKE 'transactions'");
    console.log('Transactions table exists:', transactionTables.length > 0);

    if (transactionTables.length > 0) {
      const [transactionCount] = await connection.query('SELECT COUNT(*) as count FROM transactions WHERE deleted_at IS NULL');
      console.log('Total transactions in database:', transactionCount[0].count);
    }

    await connection.end();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkExpenses();