const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

async function checkPettyCashJournals() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking Petty Cash Transactions and Journal Entries...\n');
    
    // Check St Kilda (ID: 4)
    console.log('🏠 ST KILDA (Boarding House ID: 4)');
    console.log('=' .repeat(50));
    
    const [stKildaPettyCash] = await connection.query(
      'SELECT * FROM petty_cash_transactions WHERE boarding_house_id = 4 ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('📋 Petty Cash Transactions:');
    stKildaPettyCash.forEach(t => {
      console.log(`   ${t.transaction_date}: ${t.description} - $${t.amount} (Type: ${t.transaction_type})`);
    });
    
    // Check if there are main transactions for student payments
    const [stKildaMainTransactions] = await connection.query(
      "SELECT * FROM transactions WHERE transaction_type = 'student_payment' ORDER BY created_at DESC LIMIT 5"
    );
    
    console.log('\n📊 Main Transactions (student_payment):');
    if (stKildaMainTransactions.length === 0) {
      console.log('   ❌ No main transactions found for student payments');
    } else {
      stKildaMainTransactions.forEach(t => {
        console.log(`   ${t.created_at}: ${t.description} - $${t.amount}`);
      });
    }
    
    // Check journal entries
    const [stKildaJournals] = await connection.query(
      `SELECT je.*, coa.name as account_name, coa.account_code
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE je.transaction_id IN (
         SELECT id FROM transactions WHERE transaction_type = 'student_payment'
       )
       ORDER BY je.created_at DESC LIMIT 10`
    );
    
    console.log('\n📝 Journal Entries:');
    if (stKildaJournals.length === 0) {
      console.log('   ❌ No journal entries found for student payments');
    } else {
      stKildaJournals.forEach(je => {
        console.log(`   ${je.account_code} (${je.account_name}): ${je.debit_amount > 0 ? 'Debit' : 'Credit'} $${je.debit_amount || je.credit_amount}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    
    // Check Belvedere (ID: 5)
    console.log('🏠 BELVEDERE (Boarding House ID: 5)');
    console.log('=' .repeat(50));
    
    const [belvederePettyCash] = await connection.query(
      'SELECT * FROM petty_cash_transactions WHERE boarding_house_id = 5 ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('📋 Petty Cash Transactions:');
    belvederePettyCash.forEach(t => {
      console.log(`   ${t.transaction_date}: ${t.description} - $${t.amount} (Type: ${t.transaction_type})`);
    });
    
    // Check petty cash account balances
    const [pettyCashAccounts] = await connection.query(
      'SELECT boarding_house_id, current_balance, total_inflows, total_outflows FROM petty_cash_accounts WHERE boarding_house_id IN (4, 5)'
    );
    
    console.log('\n💰 Petty Cash Account Balances:');
    pettyCashAccounts.forEach(account => {
      const houseName = account.boarding_house_id === 4 ? 'St Kilda' : 'Belvedere';
      console.log(`   ${houseName}: $${account.current_balance} (Inflows: $${account.total_inflows}, Outflows: $${account.total_outflows})`);
    });
    
    // Check if we need to create main transactions and journal entries
    console.log('\n🔧 DIAGNOSIS:');
    
    if (stKildaMainTransactions.length === 0 && stKildaPettyCash.length > 0) {
      console.log('   ❌ St Kilda: Petty cash transactions exist but no main transactions/journals');
      console.log('   💡 Need to create main transactions and journal entries for St Kilda');
    }
    
    if (belvederePettyCash.length > 0) {
      console.log('   ❌ Belvedere: Petty cash transactions exist but likely no main transactions/journals');
      console.log('   💡 Need to create main transactions and journal entries for Belvedere');
    }
    
  } catch (error) {
    console.error('❌ Error checking petty cash journals:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  checkPettyCashJournals()
    .then(() => {
      console.log('\n✅ Check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkPettyCashJournals };
