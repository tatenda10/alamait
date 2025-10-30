const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugCashflow() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const startDate = '2025-10-01';
    const endDate = '2025-10-31';

    console.log('\n=== DEBUGGING CASH FLOW CALCULATION ===\n');

    // Get cash accounts
    const [cashAccounts] = await connection.query(`
      SELECT id, code, name FROM chart_of_accounts 
      WHERE code IN ('10001', '10002', '10003', '10004')
      AND type = 'Asset'
      AND deleted_at IS NULL
    `);

    const cashAccountIds = cashAccounts.map(acc => acc.id);
    console.log('Cash Account IDs:', cashAccountIds);
    console.log('');

    // Get ALL transactions that touch cash accounts (exactly as the controller does)
    const [transactions] = await connection.query(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_debit.type as debit_account_type,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.type as credit_account_type,
        coa_credit.name as credit_account_name
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
        AND (je_debit.account_id IN (${cashAccountIds.map(() => '?').join(',')}) 
             OR je_credit.account_id IN (${cashAccountIds.map(() => '?').join(',')}))
      ORDER BY t.transaction_date, t.id
    `, [startDate, endDate, ...cashAccountIds, ...cashAccountIds]);

    console.log(`Total transactions touching cash: ${transactions.length}\n`);

    // Group by outflows (where cash is credited = cash goes out)
    const outflows = {};
    const processedTransactions = new Set();

    transactions.forEach(txn => {
      const amount = Number(txn.amount);
      
      // Cash outflow: expense is debited, cash is credited
      if (txn.debit_account_type === 'Expense' && cashAccountIds.includes(txn.credit_account_id)) {
        const category = txn.debit_account_name;
        
        if (!outflows[category]) {
          outflows[category] = { total: 0, transactions: [] };
        }
        
        outflows[category].total += amount;
        outflows[category].transactions.push({
          id: txn.id,
          date: txn.transaction_date,
          amount: amount,
          description: txn.description,
          expense_code: txn.debit_account_code,
          cash_account: txn.credit_account_name
        });
        
        processedTransactions.add(txn.id);
      }
    });

    console.log('--- CASH OUTFLOWS (Expenses) ---\n');
    
    let totalOutflows = 0;
    const sortedCategories = Object.entries(outflows).sort((a, b) => b[1].total - a[1].total);
    
    sortedCategories.forEach(([category, data]) => {
      console.log(`\n${category}: $${data.total.toFixed(2)}`);
      console.log('Transactions:');
      data.transactions.forEach(txn => {
        const date = new Date(txn.date).toLocaleDateString();
        console.log(`  ID ${txn.id} | ${date} | $${txn.amount.toFixed(2)} | ${txn.cash_account} | ${txn.description || ''}`);
      });
      totalOutflows += data.total;
    });

    console.log('\n' + '='.repeat(80));
    console.log(`TOTAL CASH OUTFLOWS: $${totalOutflows.toFixed(2)}`);
    console.log('='.repeat(80));

    // Check for duplicate journal entries
    console.log('\n--- CHECKING FOR DUPLICATE TRANSACTIONS ---\n');
    
    const [duplicateCheck] = await connection.query(`
      SELECT 
        t.id,
        COUNT(je.id) as journal_entry_count,
        GROUP_CONCAT(je.entry_type) as entry_types
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
      GROUP BY t.id
      HAVING COUNT(je.id) > 2
    `, [startDate, endDate]);

    if (duplicateCheck.length > 0) {
      console.log('⚠️  Found transactions with MORE than 2 journal entries:');
      duplicateCheck.forEach(dup => {
        console.log(`  Transaction ${dup.id}: ${dup.journal_entry_count} entries (${dup.entry_types})`);
      });
    } else {
      console.log('✅ No duplicate journal entries found');
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

debugCashflow();

