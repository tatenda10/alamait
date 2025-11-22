const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function diagnoseRevenueIssue() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait'
  });

  try {
    console.log('🔍 Diagnosing Revenue Issue for October 2025...\n');
    
    const startDate = '2025-10-01';
    const endDate = '2025-10-31';

    // 1. Check if there are any transactions in the date range
    console.log('1️⃣ Checking transactions in date range...');
    const [transactions] = await connection.query(
      `SELECT COUNT(*) as count, 
              COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted_count,
              COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
              COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided_count
       FROM transactions 
       WHERE transaction_date >= ? AND transaction_date <= ?
         AND deleted_at IS NULL`,
      [startDate, endDate]
    );
    console.log('   Total transactions:', transactions[0].count);
    console.log('   Posted:', transactions[0].posted_count);
    console.log('   Draft:', transactions[0].draft_count);
    console.log('   Voided:', transactions[0].voided_count);
    console.log('');

    // 2. Check journal entries with credit entries
    console.log('2️⃣ Checking credit journal entries...');
    const [creditEntries] = await connection.query(
      `SELECT COUNT(*) as count
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         AND je.entry_type = 'credit'
         AND je.deleted_at IS NULL
         AND t.deleted_at IS NULL`,
      [startDate, endDate]
    );
    console.log('   Total credit entries:', creditEntries[0].count);
    console.log('');

    // 3. Check revenue accounts
    console.log('3️⃣ Checking Revenue accounts in chart_of_accounts...');
    const [revenueAccounts] = await connection.query(
      `SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE type = 'Revenue' AND deleted_at IS NULL`
    );
    console.log('   Revenue accounts found:', revenueAccounts.length);
    revenueAccounts.forEach(acc => {
      console.log(`   - ${acc.code}: ${acc.name} (ID: ${acc.id})`);
    });
    console.log('');

    // 4. Check journal entries for revenue accounts
    console.log('4️⃣ Checking journal entries for Revenue accounts...');
    const [revenueEntries] = await connection.query(
      `SELECT COUNT(*) as count
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         AND coa.type = 'Revenue'
         AND je.entry_type = 'credit'
         AND je.deleted_at IS NULL
         AND t.deleted_at IS NULL
         AND coa.deleted_at IS NULL`,
      [startDate, endDate]
    );
    console.log('   Revenue credit entries:', revenueEntries[0].count);
    console.log('');

    // 5. Check with status filter
    console.log('5️⃣ Checking revenue entries with status = "posted"...');
    const [revenuePosted] = await connection.query(
      `SELECT COUNT(*) as count,
              SUM(je.amount) as total_amount
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         AND t.status = 'posted'
         AND coa.type = 'Revenue'
         AND je.entry_type = 'credit'
         AND je.deleted_at IS NULL
         AND t.deleted_at IS NULL
         AND coa.deleted_at IS NULL`,
      [startDate, endDate]
    );
    console.log('   Posted revenue entries:', revenuePosted[0].count);
    console.log('   Total amount:', revenuePosted[0].total_amount || 0);
    console.log('');

    // 6. Check without status filter
    console.log('6️⃣ Checking revenue entries WITHOUT status filter...');
    const [revenueNoStatus] = await connection.query(
      `SELECT COUNT(*) as count,
              SUM(je.amount) as total_amount
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         AND coa.type = 'Revenue'
         AND je.entry_type = 'credit'
         AND je.deleted_at IS NULL
         AND t.deleted_at IS NULL
         AND coa.deleted_at IS NULL`,
      [startDate, endDate]
    );
    console.log('   Revenue entries (any status):', revenueNoStatus[0].count);
    console.log('   Total amount (any status):', revenueNoStatus[0].total_amount || 0);
    console.log('');

    // 7. Show sample revenue transactions
    console.log('7️⃣ Sample revenue transactions (first 5)...');
    const [samples] = await connection.query(
      `SELECT t.id as transaction_id,
              t.transaction_type,
              t.transaction_date,
              t.status,
              t.description,
              coa.code as account_code,
              coa.name as account_name,
              je.amount,
              je.entry_type
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         AND coa.type = 'Revenue'
         AND je.entry_type = 'credit'
         AND je.deleted_at IS NULL
         AND t.deleted_at IS NULL
         AND coa.deleted_at IS NULL
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [startDate, endDate]
    );
    
    if (samples.length === 0) {
      console.log('   ❌ No revenue transactions found!');
    } else {
      samples.forEach((sample, idx) => {
        console.log(`   ${idx + 1}. Transaction ${sample.transaction_id} (${sample.transaction_type})`);
        console.log(`      Date: ${sample.transaction_date}, Status: ${sample.status}`);
        console.log(`      Account: ${sample.account_code} - ${sample.account_name}`);
        console.log(`      Amount: $${sample.amount}`);
        console.log('');
      });
    }

    // 8. Check transactions by type
    console.log('8️⃣ Transactions by type in date range...');
    const [byType] = await connection.query(
      `SELECT transaction_type, 
              COUNT(*) as count,
              COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted_count
       FROM transactions 
       WHERE transaction_date >= ? AND transaction_date <= ?
         AND deleted_at IS NULL
       GROUP BY transaction_type`,
      [startDate, endDate]
    );
    byType.forEach(type => {
      console.log(`   ${type.transaction_type}: ${type.count} total, ${type.posted_count} posted`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

diagnoseRevenueIssue();


