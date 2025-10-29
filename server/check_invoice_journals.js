require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkInvoiceJournals() {
  console.log('🔍 Checking invoice journal entries...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check the most recent transactions (including the ones we just created)
    console.log('📋 MOST RECENT TRANSACTIONS (Last 10):');
    const [recentTransactions] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.created_at
      FROM transactions t
      ORDER BY t.id DESC
      LIMIT 10
    `);
    console.table(recentTransactions);

    // Get the transaction IDs for invoices 1428, 1429, 1430
    const invoiceIds = [1428, 1429, 1430];
    
    console.log('\n📒 JOURNAL ENTRIES FOR INVOICES 1428-1430:');
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
      WHERE je.transaction_id IN (?, ?, ?)
      ORDER BY je.transaction_id, je.entry_type DESC
    `, invoiceIds);
    console.table(journalEntries);

    // Check Accounts Receivable account
    console.log('\n💰 ACCOUNTS RECEIVABLE ACCOUNT (10005):');
    const [arAccount] = await connection.execute(`
      SELECT id, code, name, type
      FROM chart_of_accounts
      WHERE code = '10005'
    `);
    console.table(arAccount);

    // Check total in Accounts Receivable from journal entries in October
    console.log('\n📊 ACCOUNTS RECEIVABLE - OCTOBER ACTIVITY:');
    const [arOctober] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as net_balance
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '10005'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
    `);
    console.table(arOctober);

    // Check Revenue account from journal entries in October
    console.log('\n💵 REVENUE ACCOUNT (40001) - OCTOBER ACTIVITY:');
    const [revenueOctober] = await connection.execute(`
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
    console.table(revenueOctober);

    // List all October revenue journal entries
    console.log('\n📝 ALL OCTOBER REVENUE JOURNAL ENTRIES:');
    const [allRevenueEntries] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        t.reference,
        t.description as transaction_desc,
        je.entry_type,
        je.amount,
        t.transaction_date,
        je.created_at
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '40001'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
      ORDER BY t.transaction_date, je.id
    `);
    console.table(allRevenueEntries);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkInvoiceJournals();

