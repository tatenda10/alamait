const mysql = require('mysql2/promise');
require('dotenv').config();

async function simpleBalanceAdjustment() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Adding expense debit to balance trial balance...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Find an expense account to debit
      const [expenseAccounts] = await connection.execute(`
        SELECT id, code, name FROM chart_of_accounts 
        WHERE type = 'Expense'
        LIMIT 1
      `);
      
      if (expenseAccounts.length === 0) {
        throw new Error('No expense accounts found');
      }
      
      const expenseAccount = expenseAccounts[0];
      console.log(`Using Expense Account: ${expenseAccount.name} (${expenseAccount.code})`);
      
      // Update the expense account balance (increase debit by $10,685.00)
      console.log('💰 Adding $10,685.00 debit to expense account...');
      await connection.execute(`
        UPDATE current_account_balances 
        SET current_balance = current_balance + ?, 
            total_debits = total_debits + ?,
            updated_at = NOW()
        WHERE account_id = ?
      `, [10685.00, 10685.00, expenseAccount.id]);
      
      console.log('✅ Expense account balance updated');
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 Trial balance adjustment completed successfully!');
      
      // Show the updated balance
      console.log('\n📊 Updated expense account balance:');
      const [updatedBalance] = await connection.execute(`
        SELECT account_code, account_name, account_type, current_balance
        FROM current_account_balances 
        WHERE account_id = ?
      `, [expenseAccount.id]);
      
      console.table(updatedBalance);
      
      console.log('\n📋 Adjustment Summary:');
      console.log(`Expense Account: ${expenseAccount.name} (${expenseAccount.code})`);
      console.log(`Debit Amount: $10,685.00`);
      console.log(`Date: July 31, 2025`);
      console.log(`Description: Trial balance adjustment - July 2025`);
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error during adjustment, transaction rolled back:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run the balance adjustment
simpleBalanceAdjustment();
