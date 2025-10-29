require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkOctoberPayments() {
  console.log('🔍 Checking October Payment Journal Entries...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // 1. Check transactions for October payments
    console.log('1️⃣ TRANSACTIONS TABLE - October Payments:');
    const [transactions] = await connection.execute(`
      SELECT 
        id,
        transaction_type,
        student_id,
        amount,
        transaction_date,
        reference,
        description
      FROM transactions
      WHERE transaction_date >= '2025-10-01'
        AND transaction_date <= '2025-10-31'
        AND transaction_type = 'payment'
      ORDER BY id DESC
      LIMIT 10
    `);
    console.log(`Total payment transactions in October: ${transactions.length}`);
    console.table(transactions);

    // 2. Check if these transactions have journal entries
    console.log('\n2️⃣ JOURNAL ENTRIES - For October Payments:');
    const [journalEntries] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        je.account_id,
        coa.code as account_code,
        coa.name as account_name,
        je.entry_type,
        je.amount,
        je.description,
        je.created_at
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND t.transaction_type = 'payment'
      ORDER BY je.transaction_id DESC, je.entry_type
      LIMIT 20
    `);
    console.log(`Total journal entries for October payments: ${journalEntries.length}`);
    console.table(journalEntries);

    // 3. Check Cash account (10001) balance and recent entries
    console.log('\n3️⃣ CASH ACCOUNT (10001) - Recent Entries:');
    const [cashEntries] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        t.transaction_type,
        t.transaction_date,
        je.entry_type,
        je.amount,
        je.description
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '10001'
        AND t.transaction_date >= '2025-10-01'
      ORDER BY je.created_at DESC
      LIMIT 20
    `);
    console.log(`Total Cash entries in October: ${cashEntries.length}`);
    console.table(cashEntries);

    // 4. Check current account balances
    console.log('\n4️⃣ CURRENT ACCOUNT BALANCES:');
    const [accountBalances] = await connection.execute(`
      SELECT 
        coa.code,
        coa.name,
        cab.current_balance,
        cab.updated_at
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code IN ('10001', '10002', '10005')
      ORDER BY coa.code
    `);
    console.table(accountBalances);

    // 5. Check student balance for a sample student
    console.log('\n5️⃣ SAMPLE STUDENT BALANCE (Christine Mutsikwa):');
    const [studentBalance] = await connection.execute(`
      SELECT 
        s.full_name,
        sab.current_balance as student_balance,
        sab.updated_at
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Christine%Mutsikwa%'
    `);
    console.table(studentBalance);

    // 6. Count ALL journal entries vs transactions
    console.log('\n6️⃣ OVERALL STATISTICS:');
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM transactions WHERE transaction_type = 'payment' AND transaction_date >= '2025-10-01' AND transaction_date <= '2025-10-31') as payment_transactions,
        (SELECT COUNT(*) FROM journal_entries je JOIN transactions t ON je.transaction_id = t.id WHERE t.transaction_type = 'payment' AND t.transaction_date >= '2025-10-01' AND t.transaction_date <= '2025-10-31') as payment_journal_entries,
        (SELECT COUNT(*) FROM student_payments WHERE payment_date >= '2025-10-01' AND payment_date <= '2025-10-31') as student_payment_records
    `);
    console.log('October Payment Statistics:');
    console.log(`  Payment Transactions: ${stats[0].payment_transactions}`);
    console.log(`  Journal Entries (should be 2x transactions): ${stats[0].payment_journal_entries}`);
    console.log(`  Student Payment Records: ${stats[0].student_payment_records}`);
    console.log(`  Expected Journal Entries: ${stats[0].payment_transactions * 2}`);
    
    if (stats[0].payment_journal_entries < stats[0].payment_transactions * 2) {
      console.log('\n⚠️  WARNING: Missing journal entries! Some payments were not properly journalized.');
    } else {
      console.log('\n✅ Journal entries look correct!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkOctoberPayments();

