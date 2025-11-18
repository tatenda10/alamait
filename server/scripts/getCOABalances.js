const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

async function getAllCOABalances() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    console.log('📊 Fetching all Chart of Accounts balances...\n');
    
    // Get all accounts with their balances
    const [accounts] = await connection.query(`
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        COALESCE(cab.total_debits, 0) as total_debits,
        COALESCE(cab.total_credits, 0) as total_credits,
        cab.last_transaction_date,
        CASE 
          WHEN cab.account_id IS NULL THEN 'No balance record'
          ELSE 'Has balance record'
        END as balance_status
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.deleted_at IS NULL
      ORDER BY coa.type, coa.code
    `);
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found in Chart of Accounts');
      return;
    }
    
    // Group by account type
    const grouped = {};
    accounts.forEach(account => {
      if (!grouped[account.account_type]) {
        grouped[account.account_type] = [];
      }
      grouped[account.account_type].push(account);
    });
    
    // Display results
    console.log('='.repeat(100));
    console.log('CHART OF ACCOUNTS - ALL BALANCES');
    console.log('='.repeat(100));
    console.log(`Total Accounts: ${accounts.length}\n`);
    
    // Display by type
    const types = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    
    types.forEach(type => {
      if (grouped[type] && grouped[type].length > 0) {
        console.log(`\n${'─'.repeat(100)}`);
        console.log(`${type.toUpperCase()} ACCOUNTS (${grouped[type].length})`);
        console.log('─'.repeat(100));
        console.log(
          'Code'.padEnd(10) +
          'Account Name'.padEnd(40) +
          'Balance'.padEnd(20) +
          'Debits'.padEnd(15) +
          'Credits'.padEnd(15) +
          'Status'
        );
        console.log('─'.repeat(100));
        
        grouped[type].forEach(account => {
          const balance = parseFloat(account.current_balance || 0).toFixed(2);
          const debits = parseFloat(account.total_debits || 0).toFixed(2);
          const credits = parseFloat(account.total_credits || 0).toFixed(2);
          
          console.log(
            account.account_code.padEnd(10) +
            account.account_name.substring(0, 38).padEnd(40) +
            balance.padStart(18) +
            debits.padStart(15) +
            credits.padStart(15) +
            '  ' + account.balance_status
          );
        });
      }
    });
    
    // Summary by type
    console.log(`\n${'='.repeat(100)}`);
    console.log('SUMMARY BY ACCOUNT TYPE');
    console.log('='.repeat(100));
    
    types.forEach(type => {
      if (grouped[type] && grouped[type].length > 0) {
        const total = grouped[type].reduce((sum, acc) => {
          return sum + parseFloat(acc.current_balance || 0);
        }, 0);
        
        const withBalances = grouped[type].filter(acc => acc.balance_status === 'Has balance record').length;
        
        console.log(
          `${type.padEnd(15)}: ${grouped[type].length} accounts, ` +
          `${withBalances} with balance records, ` +
          `Total: ${total.toFixed(2)}`
        );
      }
    });
    
    // Cash and Bank accounts specifically
    console.log(`\n${'='.repeat(100)}`);
    console.log('CASH AND BANK ACCOUNTS (10001-10004)');
    console.log('='.repeat(100));
    
    const cashAccounts = accounts.filter(acc => 
      ['10001', '10002', '10003', '10004'].includes(acc.account_code)
    );
    
    if (cashAccounts.length > 0) {
      cashAccounts.forEach(account => {
        const balance = parseFloat(account.current_balance || 0);
        console.log(
          `${account.account_code} - ${account.account_name.padEnd(30)}: ` +
          `$${balance.toFixed(2).padStart(15)} ` +
          `(${account.balance_status})`
        );
      });
      
      const totalCash = cashAccounts.reduce((sum, acc) => {
        return sum + parseFloat(acc.current_balance || 0);
      }, 0);
      
      console.log(`\nTotal Cash & Bank: $${totalCash.toFixed(2)}`);
    } else {
      console.log('❌ No cash/bank accounts found');
    }
    
    console.log(`\n${'='.repeat(100)}\n`);
    
  } catch (error) {
    console.error('❌ Error fetching COA balances:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

// Run the script
getAllCOABalances();

