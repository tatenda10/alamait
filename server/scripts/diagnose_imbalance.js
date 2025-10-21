const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Diagnosing trial balance imbalance...');
    
    // Check journal entries totals
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    console.log(`\nJournal Entries Totals:`);
    console.log(`Total Debits: $${parseFloat(journalTotals[0]?.total_debits || 0).toFixed(2)}`);
    console.log(`Total Credits: $${parseFloat(journalTotals[0]?.total_credits || 0).toFixed(2)}`);
    console.log(`Journal Difference: $${(parseFloat(journalTotals[0]?.total_debits || 0) - parseFloat(journalTotals[0]?.total_credits || 0)).toFixed(2)}`);
    
    // Check current account balances totals
    const [balanceTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN account_type IN ('Asset', 'Expense') THEN current_balance ELSE 0 END) as asset_expense_balance,
        SUM(CASE WHEN account_type IN ('Liability', 'Equity', 'Revenue') THEN current_balance ELSE 0 END) as liability_equity_revenue_balance
      FROM current_account_balances`
    );
    
    console.log(`\nAccount Balance Totals:`);
    console.log(`Assets + Expenses: $${parseFloat(balanceTotals[0]?.asset_expense_balance || 0).toFixed(2)}`);
    console.log(`Liabilities + Equity + Revenue: $${parseFloat(balanceTotals[0]?.liability_equity_revenue_balance || 0).toFixed(2)}`);
    console.log(`Balance Difference: $${(parseFloat(balanceTotals[0]?.asset_expense_balance || 0) - parseFloat(balanceTotals[0]?.liability_equity_revenue_balance || 0)).toFixed(2)}`);
    
    // Check for accounts with significant balances
    console.log(`\nAccounts with significant balances:`);
    const [significantBalances] = await conn.query(
      `SELECT 
        coa.code,
        coa.name,
        coa.type,
        cab.current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL AND ABS(COALESCE(cab.current_balance, 0)) > 100
      ORDER BY ABS(COALESCE(cab.current_balance, 0)) DESC`
    );
    
    significantBalances.forEach(acc => {
      console.log(`${acc.code}: ${acc.name} (${acc.type}) - $${parseFloat(acc.current_balance || 0).toFixed(2)}`);
    });
    
    // Check for any orphaned journal entries
    const [orphanedEntries] = await conn.query(
      `SELECT COUNT(*) as count
       FROM journal_entries je
       LEFT JOIN transactions t ON je.transaction_id = t.id
       WHERE je.deleted_at IS NULL AND (t.id IS NULL OR t.deleted_at IS NOT NULL)`
    );
    
    console.log(`\nOrphaned journal entries: ${orphanedEntries[0]?.count || 0}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();