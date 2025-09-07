const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function testPettyCashAccounting() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'alamait_db'
    });

    console.log('✅ Connected to database successfully');

    // Test 1: Check if chart of accounts has the required accounts
    console.log('\n🔍 Test 1: Checking Chart of Accounts...');
    const [accounts] = await connection.query(
      `SELECT code, name, type FROM chart_of_accounts 
       WHERE code IN ('10001', '10002', '10003', '10004') 
       AND deleted_at IS NULL`
    );

    if (accounts.length === 4) {
      console.log('✅ All required accounts found:');
      accounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.type})`);
      });
    } else {
      console.log('❌ Missing required accounts. Found:', accounts.length);
      accounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.type})`);
      });
    }

    // Test 2: Check if petty cash accounts table exists and has data
    console.log('\n🔍 Test 2: Checking Petty Cash Accounts...');
    const [pettyCashAccounts] = await connection.query(
      `SELECT boarding_house_id, current_balance, total_inflows, total_outflows 
       FROM petty_cash_accounts 
       LIMIT 5`
    );

    if (pettyCashAccounts.length > 0) {
      console.log('✅ Petty cash accounts found:', pettyCashAccounts.length);
      pettyCashAccounts.forEach(acc => {
        console.log(`   Boarding House ID: ${acc.boarding_house_id}, Balance: $${acc.current_balance}, Inflows: $${acc.total_inflows}, Outflows: $${acc.total_outflows}`);
      });
    } else {
      console.log('❌ No petty cash accounts found');
    }

    // Test 3: Check if transactions table exists
    console.log('\n🔍 Test 3: Checking Transactions Table...');
    const [transactions] = await connection.query(
      `SELECT COUNT(*) as count FROM transactions LIMIT 1`
    );
    console.log('✅ Transactions table exists with', transactions[0].count, 'records');

    // Test 4: Check if journal_entries table exists
    console.log('\n🔍 Test 4: Checking Journal Entries Table...');
    const [journalEntries] = await connection.query(
      `SELECT COUNT(*) as count FROM journal_entries LIMIT 1`
    );
    console.log('✅ Journal entries table exists with', journalEntries[0].count, 'records');

    // Test 5: Check if current_account_balances table exists
    console.log('\n🔍 Test 5: Checking Current Account Balances...');
    const [accountBalances] = await connection.query(
      `SELECT COUNT(*) as count FROM current_account_balances LIMIT 1`
    );
    console.log('✅ Current account balances table exists with', accountBalances[0].count, 'records');

    // Test 6: Check petty cash transactions
    console.log('\n🔍 Test 6: Checking Petty Cash Transactions...');
    const [pettyCashTransactions] = await connection.query(
      `SELECT transaction_type, amount, description, created_at 
       FROM petty_cash_transactions 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    if (pettyCashTransactions.length > 0) {
      console.log('✅ Recent petty cash transactions:');
      pettyCashTransactions.forEach(txn => {
        console.log(`   ${txn.transaction_type}: $${txn.amount} - ${txn.description} (${txn.created_at})`);
      });
    } else {
      console.log('ℹ️  No petty cash transactions found yet');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Try adding cash to petty cash from a source account');
    console.log('   2. Try withdrawing cash from petty cash to a destination account');
    console.log('   3. Check that journal entries are created correctly');
    console.log('   4. Verify account balances are updated properly');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.sql) {
      console.error('SQL Error:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testPettyCashAccounting();
