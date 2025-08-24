const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'alamait',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function updateAccountBalances() {
  let connection;
  
  try {
    console.log('🔄 Starting Account Balances Update...');
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // First, clear the existing data
    console.log('🗑️ Clearing existing balance data...');
    await connection.execute('TRUNCATE TABLE current_account_balances');

    // Insert updated balance data for all accounts
    console.log('📊 Calculating and inserting new balance data...');
    const [result] = await connection.execute(`
      INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
      SELECT 
          coa.id AS account_id,
          coa.code AS account_code,
          coa.name AS account_name,
          coa.type AS account_type,
          COALESCE(
              SUM(
                  CASE 
                      WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
                      WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
                      WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
                      WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
                      ELSE 0
                  END
              ), 0
          ) AS current_balance,
          COALESCE(
              SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0
          ) AS total_debits,
          COALESCE(
              SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0
          ) AS total_credits,
          COUNT(DISTINCT je.transaction_id) AS transaction_count,
          MAX(t.transaction_date) AS last_transaction_date
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name, coa.type
    `);

    console.log(`✅ Inserted ${result.affectedRows} account balance records`);

    // Get summary of updated balances
    console.log('\n📋 Account Balance Summary:');
    const [balances] = await connection.execute(`
      SELECT 
          account_code,
          account_name,
          account_type,
          current_balance,
          total_debits,
          total_credits,
          transaction_count,
          last_transaction_date
      FROM current_account_balances 
      WHERE current_balance != 0 OR transaction_count > 0
      ORDER BY account_type, account_code
    `);

    // Display summary
    console.log('\n💰 Active Accounts with Balances:');
    balances.forEach(balance => {
      console.log(`  ${balance.account_code} - ${balance.account_name} (${balance.account_type})`);
      console.log(`    Balance: $${parseFloat(balance.current_balance).toFixed(2)}`);
      console.log(`    Debits: $${parseFloat(balance.total_debits).toFixed(2)} | Credits: $${parseFloat(balance.total_credits).toFixed(2)}`);
      console.log(`    Transactions: ${balance.transaction_count}`);
      console.log(`    Last Transaction: ${balance.last_transaction_date || 'N/A'}`);
      console.log('');
    });

    await connection.commit();
    console.log('\n🎉 Account balances updated successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  updateAccountBalances()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { updateAccountBalances };
