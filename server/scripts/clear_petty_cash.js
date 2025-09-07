const mysql = require('mysql2/promise');
const path = require('path');

// Load .env file from the server directory (parent of scripts)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait',
    multipleStatements: true
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function clearPettyCashData() {
    let connection;
    
    try {
        log('\n🗑️  Starting Petty Cash Data Cleanup...', 'yellow');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        log('✅ Connected to database successfully', 'green');
        
        // Display current database configuration
        log('\n🔧 Database Configuration:', 'blue');
        log(`   Host: ${dbConfig.host}`, 'blue');
        log(`   Database: ${dbConfig.database}`, 'blue');
        log(`   User: ${dbConfig.user}`, 'blue');
        log(`   Password: ${dbConfig.password ? '***' : '(none)'}`, 'blue');
        
        // Start transaction
        await connection.beginTransaction();
        log('\n🔄 Started database transaction', 'blue');
        
        // Check what we're about to delete
        log('\n📊 Current Petty Cash Data Count:', 'cyan');
        
        const [accountsCount] = await connection.query('SELECT COUNT(*) as count FROM petty_cash_accounts');
        log(`   Petty Cash Accounts: ${accountsCount[0].count}`, 'cyan');
        
        const [transactionsCount] = await connection.query('SELECT COUNT(*) as count FROM petty_cash_transactions');
        log(`   Petty Cash Transactions: ${transactionsCount[0].count}`, 'cyan');
        
        const [pendingCount] = await connection.query('SELECT COUNT(*) as count FROM pending_petty_cash_expenses');
        log(`   Pending Petty Cash Expenses: ${pendingCount[0].count}`, 'cyan');
        
        // Confirm before proceeding
        log('\n⚠️  WARNING: This will permanently delete all petty cash data!', 'red');
        log('   Are you sure you want to continue? (y/N)', 'yellow');
        
        // For safety, require explicit confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise((resolve) => {
            rl.question('   Enter "YES" to confirm: ', resolve);
        });
        rl.close();
        
        if (answer !== 'YES') {
            log('❌ Operation cancelled by user', 'red');
            await connection.rollback();
            return;
        }
        
        log('\n🧹 Starting cleanup process...', 'yellow');
        
        // Clear pending petty cash expenses first (child table)
        const [pendingResult] = await connection.query('DELETE FROM pending_petty_cash_expenses');
        log(`   ✅ Deleted ${pendingResult.affectedRows} pending petty cash expenses`, 'green');
        
        // Clear petty cash transactions
        const [transactionsResult] = await connection.query('DELETE FROM petty_cash_transactions');
        log(`   ✅ Deleted ${transactionsResult.affectedRows} petty cash transactions`, 'green');
        
        // Reset petty cash account balances to zero
        const [resetResult] = await connection.query(`
            UPDATE petty_cash_accounts 
            SET 
                current_balance = 0.00,
                beginning_balance = 0.00,
                total_inflows = 0.00,
                total_outflows = 0.00,
                updated_at = CURRENT_TIMESTAMP
        `);
        log(`   ✅ Reset ${resetResult.affectedRows} petty cash account balances`, 'green');
        
        // Commit transaction
        await connection.commit();
        log('\n✅ Transaction committed successfully', 'green');
        
        // Verify the cleanup
        log('\n📊 Cleanup Verification:', 'cyan');
        
        const [finalAccountsCount] = await connection.query('SELECT COUNT(*) as count FROM petty_cash_accounts');
        log(`   Petty Cash Accounts: ${finalAccountsCount[0].count}`, 'cyan');
        
        const [finalTransactionsCount] = await connection.query('SELECT COUNT(*) as count FROM petty_cash_transactions');
        log(`   Petty Cash Transactions: ${finalTransactionsCount[0].count}`, 'cyan');
        
        const [finalPendingCount] = await connection.query('SELECT COUNT(*) as count FROM pending_petty_cash_expenses');
        log(`   Pending Petty Cash Expenses: ${finalPendingCount[0].count}`, 'cyan');
        
        // Show current petty cash account status
        log('\n📋 Current Petty Cash Account Status:', 'blue');
        const [accounts] = await connection.query(`
            SELECT 
                boarding_house_id,
                current_balance,
                beginning_balance,
                total_inflows,
                total_outflows,
                updated_at
            FROM petty_cash_accounts
        `);
        
        if (accounts.length > 0) {
            accounts.forEach(account => {
                log(`   Boarding House ID: ${account.boarding_house_id}`, 'blue');
                log(`     Current Balance: $${account.current_balance}`, 'blue');
                log(`     Beginning Balance: $${account.beginning_balance}`, 'blue');
                log(`     Total Inflows: $${account.total_inflows}`, 'blue');
                log(`     Total Outflows: $${account.total_outflows}`, 'blue');
                log(`     Updated: ${account.updated_at}`, 'blue');
                log('', 'blue');
            });
        } else {
            log('   No petty cash accounts found', 'yellow');
        }
        
        log('\n🎉 Petty Cash data cleared successfully!', 'green');
        log('   You can now add new July balances.', 'green');
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
            log('\n❌ Transaction rolled back due to error', 'red');
        }
        
        log('\n❌ Error during cleanup:', 'red');
        log(`   ${error.message}`, 'red');
        console.error('Full error:', error);
        
    } finally {
        if (connection) {
            connection.release();
            log('\n🔌 Database connection closed', 'blue');
        }
    }
}

// Run the script
if (require.main === module) {
    clearPettyCashData()
        .then(() => {
            log('\n🏁 Script completed', 'green');
            process.exit(0);
        })
        .catch((error) => {
            log('\n💥 Script failed', 'red');
            console.error(error);
            process.exit(1);
        });
}

module.exports = { clearPettyCashData };
