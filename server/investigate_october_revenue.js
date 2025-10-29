require('dotenv').config();
const mysql = require('mysql2/promise');

async function investigateOctoberRevenue() {
  console.log('🔍 Investigating October Revenue...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check October transactions
    console.log('📊 OCTOBER TRANSACTIONS:');
    const [transactions] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.created_at
      FROM transactions t
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
      ORDER BY t.created_at DESC
      LIMIT 20
    `);
    console.table(transactions);
    console.log(`Total October transactions: ${transactions.length}\n`);

    // Check October journal entries
    console.log('📒 OCTOBER JOURNAL ENTRIES:');
    const [journalEntries] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        coa.code,
        coa.name as account_name,
        je.entry_type,
        je.amount,
        je.description,
        je.created_at
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
      ORDER BY je.created_at DESC
      LIMIT 40
    `);
    console.table(journalEntries);
    console.log(`Total October journal entries: ${journalEntries.length}\n`);

    // Check revenue account balance
    console.log('💰 REVENUE ACCOUNT (40001 - Rentals Income):');
    const [revenueAccount] = await connection.execute(`
      SELECT 
        id,
        code,
        name,
        type,
        debit_balance,
        credit_balance
      FROM chart_of_accounts
      WHERE code = '40001'
    `);
    console.table(revenueAccount);

    // Get revenue from journal entries for October
    console.log('\n💵 OCTOBER REVENUE FROM JOURNAL ENTRIES:');
    const [octoberRevenue] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as net_revenue
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '40001'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
    `);
    console.table(octoberRevenue);

    // Check how income statement might be querying
    console.log('\n📈 CHECKING INCOME STATEMENT LOGIC:');
    console.log('Revenue accounts should be 40xxx series');
    const [allRevenue] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as net_amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id
      LEFT JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code LIKE '40%'
        AND (t.transaction_date >= '2025-10-01' AND t.transaction_date <= '2025-10-31'
             OR t.transaction_date IS NULL)
      GROUP BY coa.id, coa.code, coa.name
      ORDER BY coa.code
    `);
    console.table(allRevenue);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

investigateOctoberRevenue();

