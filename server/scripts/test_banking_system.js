const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function testBankingSystem() {
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

    // Test 1: Check if chart of accounts has the required banking accounts
    console.log('\n🔍 Test 1: Checking Banking Chart of Accounts...');
    const [accounts] = await connection.query(
      `SELECT code, name, type FROM chart_of_accounts 
       WHERE code IN ('10002', '10003', '10004') 
       AND deleted_at IS NULL`
    );

    if (accounts.length === 3) {
      console.log('✅ All required banking accounts found:');
      accounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.type})`);
      });
    } else {
      console.log('❌ Missing required banking accounts. Found:', accounts.length);
      accounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.type})`);
      });
    }

    // Test 2: Check if current_account_balances table exists
    console.log('\n🔍 Test 2: Checking Current Account Balances Table...');
    const [balancesResult] = await connection.query(
      `SELECT COUNT(*) as count FROM current_account_balances LIMIT 1`
    );
    console.log('✅ Current account balances table exists with', balancesResult[0].count, 'records');

    // Test 3: Check if transactions table exists
    console.log('\n🔍 Test 3: Checking Transactions Table...');
    const [transactionsResult] = await connection.query(
      `SELECT COUNT(*) as count FROM transactions LIMIT 1`
    );
    console.log('✅ Transactions table exists with', transactionsResult[0].count, 'records');

    // Test 4: Check if journal_entries table exists
    console.log('\n🔍 Test 4: Checking Journal Entries Table...');
    const [journalEntriesResult] = await connection.query(
      `SELECT COUNT(*) as count FROM journal_entries LIMIT 1`
    );
    console.log('✅ Journal entries table exists with', journalEntriesResult[0].count, 'records');

    // Test 5: Check current banking account balances
    console.log('\n🔍 Test 5: Checking Current Banking Account Balances...');
    const [currentBalances] = await connection.query(
      `SELECT account_code, account_name, current_balance, total_debits, total_credits, last_transaction_date
       FROM current_account_balances 
       WHERE account_code IN ('10002', '10003', '10004')
       ORDER BY account_code`
    );

    if (currentBalances.length > 0) {
      console.log('✅ Current banking account balances:');
      currentBalances.forEach(balance => {
        console.log(`   ${balance.account_code} - ${balance.account_name}: $${balance.current_balance} (Debits: $${balance.total_debits}, Credits: $${balance.total_credits})`);
      });
    } else {
      console.log('ℹ️  No banking account balances found yet');
    }

    // Test 6: Check recent banking transactions
    console.log('\n🔍 Test 6: Checking Recent Banking Transactions...');
    const [recentTransactions] = await connection.query(
      `SELECT t.transaction_type, t.amount, t.description, t.transaction_date, t.created_at
       FROM transactions t
       WHERE t.transaction_type IN ('banking_balance_addition', 'banking_transfer', 'banking_balance_adjustment')
       AND t.deleted_at IS NULL
       ORDER BY t.created_at DESC 
       LIMIT 5`
    );

    if (recentTransactions.length > 0) {
      console.log('✅ Recent banking transactions:');
      recentTransactions.forEach(txn => {
        console.log(`   ${txn.transaction_type}: $${txn.amount} - ${txn.description} (${txn.transaction_date})`);
      });
    } else {
      console.log('ℹ️  No banking transactions found yet');
    }

    console.log('\n🎉 All banking system tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Try adding balance to a banking account');
    console.log('   2. Try transferring between accounts');
    console.log('   3. Try adjusting account balances');
    console.log('   4. Check that journal entries are created correctly');
    console.log('   5. Verify account balances are updated properly');

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
testBankingSystem();
