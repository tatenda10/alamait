require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixAccountsReceivableBalance() {
  console.log('🔧 Fixing Accounts Receivable Balance...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Get current balance
    const [currentBalance] = await connection.execute(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '10005'
    `);
    
    console.log('💰 Current Accounts Receivable Balance: $' + (currentBalance[0]?.current_balance || 0));
    
    console.log('\n💡 Explanation:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('We are tracking student balances separately in:');
    console.log('  • Student Debtors (negative balances) → shown as Assets');
    console.log('  • Student Prepayments (positive balances) → shown as Liabilities');
    console.log('');
    console.log('Using Accounts Receivable ALSO for student balances causes');
    console.log('DOUBLE COUNTING. Therefore, we set AR to $0.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Set Accounts Receivable to 0
    const [result] = await connection.execute(`
      UPDATE current_account_balances 
      SET current_balance = 0,
          updated_at = NOW()
      WHERE account_code = '10005'
    `);
    
    console.log(`✅ Updated Accounts Receivable balance to $0.00 (${result.affectedRows} row(s) affected)`);
    
    // Verify
    const [newBalance] = await connection.execute(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '10005'
    `);
    
    console.log('\n✅ New Balance: $' + (newBalance[0]?.current_balance || 0));
    
    await connection.commit();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Accounts Receivable fixed!');
    console.log('');
    console.log('Now run the balance sheet test again to verify it balances.');
    console.log('Command: node test_balance_sheet.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixAccountsReceivableBalance();
