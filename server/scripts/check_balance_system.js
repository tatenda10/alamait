const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBalanceSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait'
  });

  try {
    console.log('🔍 Checking Balance BD/CD System...\n');

    // Check if tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'alamait' 
      AND TABLE_NAME IN ('balance_periods', 'account_period_balances', 'balance_verifications')
    `);

    console.log('📋 Existing tables:', tables.map(t => t.TABLE_NAME));

    // Check balance_periods
    const [periods] = await connection.execute('SELECT COUNT(*) as count FROM balance_periods');
    console.log(`📅 Balance periods: ${periods[0].count}`);

    if (periods[0].count === 0) {
      console.log('⚠️  No periods found. Creating default periods...');
      
      await connection.execute(`
        INSERT INTO balance_periods (period_name, period_start_date, period_end_date) VALUES
        ('January 2025', '2025-01-01', '2025-01-31'),
        ('February 2025', '2025-02-01', '2025-02-28'),
        ('March 2025', '2025-03-01', '2025-03-31'),
        ('April 2025', '2025-04-01', '2025-04-30'),
        ('May 2025', '2025-05-01', '2025-05-31'),
        ('June 2025', '2025-06-01', '2025-06-30'),
        ('July 2025', '2025-07-01', '2025-07-31'),
        ('August 2025', '2025-08-01', '2025-08-31'),
        ('September 2025', '2025-09-01', '2025-09-30'),
        ('October 2025', '2025-10-01', '2025-10-31'),
        ('November 2025', '2025-11-01', '2025-11-30'),
        ('December 2025', '2025-12-01', '2025-12-31')
      `);
      console.log('✅ Default periods created');
    }

    // Check account_period_balances
    const [balances] = await connection.execute('SELECT COUNT(*) as count FROM account_period_balances');
    console.log(`💰 Account period balances: ${balances[0].count}`);

    if (balances[0].count === 0) {
      console.log('⚠️  No account balances found. Creating initial balances...');
      
      // Get all accounts and periods
      const [accounts] = await connection.execute('SELECT id FROM chart_of_accounts WHERE deleted_at IS NULL');
      const [allPeriods] = await connection.execute('SELECT id FROM balance_periods');
      
      console.log(`📊 Found ${accounts.length} accounts and ${allPeriods.length} periods`);
      
      // Create initial balances for all accounts and periods
      for (const account of accounts) {
        for (const period of allPeriods) {
          await connection.execute(`
            INSERT INTO account_period_balances 
            (account_id, period_id, balance_brought_down, balance_carried_down, total_debits, total_credits, transaction_count)
            VALUES (?, ?, 0.00, 0.00, 0.00, 0.00, 0)
          `, [account.id, period.id]);
        }
      }
      console.log('✅ Initial account balances created');
    }

    // Check if there are any transactions to calculate totals
    const [transactions] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM journal_entries je 
      JOIN transactions t ON je.transaction_id = t.id 
      WHERE je.deleted_at IS NULL AND t.deleted_at IS NULL AND t.status = 'posted'
    `);
    console.log(`💳 Total transactions: ${transactions[0].count}`);

    if (transactions[0].count > 0) {
      console.log('🔄 Updating transaction totals...');
      
      // Update totals for all account period balances
      await connection.execute(`
        UPDATE account_period_balances apb
        JOIN chart_of_accounts coa ON apb.account_id = coa.id
        JOIN balance_periods bp ON apb.period_id = bp.id
        SET 
          apb.total_debits = COALESCE(
            (SELECT SUM(je.amount) 
             FROM journal_entries je 
             JOIN transactions t ON je.transaction_id = t.id 
             WHERE je.account_id = coa.id 
               AND je.entry_type = 'debit' 
               AND je.deleted_at IS NULL 
               AND t.deleted_at IS NULL 
               AND t.status = 'posted'
               AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date), 0
          ),
          apb.total_credits = COALESCE(
            (SELECT SUM(je.amount) 
             FROM journal_entries je 
             JOIN transactions t ON je.transaction_id = t.id 
             WHERE je.account_id = coa.id 
               AND je.entry_type = 'credit' 
               AND je.deleted_at IS NULL 
               AND t.deleted_at IS NULL 
               AND t.status = 'posted'
               AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date), 0
          ),
          apb.transaction_count = COALESCE(
            (SELECT COUNT(DISTINCT t.id) 
             FROM journal_entries je 
             JOIN transactions t ON je.transaction_id = t.id 
             WHERE je.account_id = coa.id 
               AND je.deleted_at IS NULL 
               AND t.deleted_at IS NULL 
               AND t.status = 'posted'
               AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date), 0
          ),
          apb.updated_at = NOW()
      `);
      
      console.log('✅ Transaction totals updated');
    }

    console.log('\n🎉 Balance BD/CD System check completed!');
    console.log('💡 You can now use the Balance BD/CD feature in the application.');

  } catch (error) {
    console.error('❌ Error checking balance system:', error);
  } finally {
    await connection.end();
  }
}

checkBalanceSystem();
