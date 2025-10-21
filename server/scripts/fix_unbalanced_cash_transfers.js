const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Finding unbalanced cash transfer transactions...');
    
    // Find transactions with only debit entries (missing credit entries)
    const [unbalancedTransactions] = await conn.query(
      `SELECT t.id, t.description, t.amount, t.created_at,
              SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
              SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       WHERE t.deleted_at IS NULL AND je.deleted_at IS NULL 
         AND t.description LIKE '%Funds from Cash to Petty cash%'
       GROUP BY t.id, t.description, t.amount, t.created_at
       HAVING ABS(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
                  SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END)) > 0.01`
    );
    
    console.log(`Found ${unbalancedTransactions.length} unbalanced cash transfer transactions`);
    
    if (unbalancedTransactions.length === 0) {
      console.log('✅ No unbalanced transactions found!');
      conn.release();
      process.exit(0);
    }
    
    // Get required account IDs
    const [[cashAccount]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL");
    const [[pettyCashAccount]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL");
    
    if (!cashAccount || !pettyCashAccount) {
      throw new Error('Cash or Petty Cash account not found');
    }
    
    console.log(`Cash Account ID: ${cashAccount.id}`);
    console.log(`Petty Cash Account ID: ${pettyCashAccount.id}`);
    
    let totalFixed = 0;
    
    console.log('\nStep 2: Adding missing credit entries...');
    
    for (const tx of unbalancedTransactions) {
      const missingCredit = parseFloat(tx.total_debits) - parseFloat(tx.total_credits);
      console.log(`  Transaction ${tx.id}: ${tx.description} - Missing credit: $${missingCredit.toFixed(2)}`);
      
      await conn.beginTransaction();
      
      // Add the missing credit entry to Cash account
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, entry_type, amount, description, 
          boarding_house_id, created_by, created_at
        ) VALUES (?, ?, 'credit', ?, ?, 4, 5, NOW())`,
        [tx.id, cashAccount.id, missingCredit, `${tx.description} - Credit`]
      );
      
      totalFixed += missingCredit;
      await conn.commit();
    }
    
    console.log(`\n✅ Added ${unbalancedTransactions.length} missing credit entries`);
    console.log(`Total amount fixed: $${totalFixed.toFixed(2)}`);
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify the fix
    console.log('\nStep 4: Verifying journal balance...');
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;
    
    console.log(`Journal Entries Balance:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Unbalanced cash transfer transactions fixed!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Fix failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
