const mysql = require('mysql2/promise');

async function testAccountBalance() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'alamait'
    });

    console.log('🔗 Connected to database');

    // Test 1: Check if current_account_balances view exists
    console.log('\n📊 Test 1: Checking current_account_balances view...');
    const [balances] = await connection.query('SELECT * FROM current_account_balances LIMIT 5');
    console.log(`✅ Found ${balances.length} account balances`);
    
    if (balances.length > 0) {
      console.log('📋 Sample balances:');
      balances.forEach(balance => {
        console.log(`  ${balance.account_code} - ${balance.account_name}: ${balance.current_balance}`);
      });
    }

    // Test 2: Check if account_transaction_ledger view exists
    console.log('\n📊 Test 2: Checking account_transaction_ledger view...');
    const [ledgerEntries] = await connection.query('SELECT * FROM account_transaction_ledger LIMIT 5');
    console.log(`✅ Found ${ledgerEntries.length} ledger entries`);
    
    if (ledgerEntries.length > 0) {
      console.log('📋 Sample ledger entries:');
      ledgerEntries.forEach(entry => {
        console.log(`  ${entry.account_code} - ${entry.transaction_date}: ${entry.debit_amount || entry.credit_amount} (Balance: ${entry.running_balance})`);
      });
    }

    // Test 3: Check specific account (CBZ Bank Account)
    console.log('\n📊 Test 3: Checking CBZ Bank Account balance...');
    const [cbzAccount] = await connection.query(
      'SELECT * FROM current_account_balances WHERE account_code = ?',
      ['10003']
    );
    
    if (cbzAccount.length > 0) {
      console.log('✅ CBZ Bank Account found:');
      console.log(`  Code: ${cbzAccount[0].account_code}`);
      console.log(`  Name: ${cbzAccount[0].account_name}`);
      console.log(`  Current Balance: ${cbzAccount[0].current_balance}`);
      console.log(`  Transaction Count: ${cbzAccount[0].transaction_count}`);
      console.log(`  Last Transaction: ${cbzAccount[0].last_transaction_date}`);
    } else {
      console.log('❌ CBZ Bank Account not found');
    }

    // Test 4: Check if there are any transactions
    console.log('\n📊 Test 4: Checking for transactions...');
    const [transactions] = await connection.query('SELECT COUNT(*) as count FROM transactions WHERE deleted_at IS NULL');
    console.log(`✅ Found ${transactions[0].count} transactions`);

    // Test 5: Check if there are any journal entries
    console.log('\n📊 Test 5: Checking for journal entries...');
    const [journalEntries] = await connection.query('SELECT COUNT(*) as count FROM journal_entries WHERE deleted_at IS NULL');
    console.log(`✅ Found ${journalEntries[0].count} journal entries`);

    console.log('\n🎉 Account balance functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAccountBalance();
