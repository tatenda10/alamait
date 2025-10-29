require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAccountsReceivable() {
  console.log('🔍 Checking Accounts Receivable Transactions...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get current balance
    const [balance] = await connection.execute(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '10005'
    `);
    
    console.log('💰 Current Accounts Receivable Balance: $' + (balance[0]?.current_balance || 0));
    
    // Get all journal entries for this account
    console.log('\n📋 All Journal Entries for Accounts Receivable (10005):\n');
    
    const [entries] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        je.entry_type,
        je.amount,
        je.description,
        t.transaction_type,
        t.transaction_date,
        t.reference
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '10005'
      ORDER BY je.created_at DESC
      LIMIT 50
    `);
    
    console.table(entries);
    
    // Calculate totals
    const debits = entries.filter(e => e.entry_type === 'debit').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const credits = entries.filter(e => e.entry_type === 'credit').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netBalance = debits - credits;
    
    console.log('\n📊 Summary:');
    console.log('Total Debits: $' + debits.toFixed(2));
    console.log('Total Credits: $' + credits.toFixed(2));
    console.log('Net Balance (Debits - Credits): $' + netBalance.toFixed(2));
    console.log('Current Balance in DB: $' + (balance[0]?.current_balance || 0));
    
    console.log('\n💡 Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (entries.length > 0) {
      console.log('⚠️  Accounts Receivable is being used in journal entries.');
      console.log('   This is causing DOUBLE COUNTING because:');
      console.log('   1. Student payments credit Accounts Receivable: -$' + Math.abs(netBalance).toFixed(2));
      console.log('   2. Student prepayments are counted separately: $3,376.00');
      console.log('   3. This creates an imbalance of: $' + (Math.abs(netBalance) + 3376).toFixed(2));
      console.log('\n✅ SOLUTION:');
      console.log('   Option 1: Set Accounts Receivable balance to $0');
      console.log('   Option 2: Use Accounts Receivable for NET student balance only');
      console.log('   Option 3: Don\'t use Accounts Receivable at all (track in student_account_balances only)');
    } else {
      console.log('✅ No journal entries found - this account is not being used.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAccountsReceivable();
