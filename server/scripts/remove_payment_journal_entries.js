const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function removePaymentJournalEntries() {
  const conn = await db.getConnection();
  try {
    console.log('🗑️ Hard deleting student payment journal entries...\n');

    // Step 1: Find journal entries for student payments
    const [paymentJournalEntries] = await conn.query(
      `SELECT je.id, je.transaction_id, je.account_id, je.entry_type, je.amount, je.description, t.amount as transaction_amount
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE t.transaction_type = 'payment' 
         AND je.deleted_at IS NULL
       ORDER BY je.id`
    );

    console.log(`📊 Found ${paymentJournalEntries.length} payment journal entries to remove`);

    if (paymentJournalEntries.length === 0) {
      console.log('✅ No payment journal entries found to remove');
      conn.release();
      process.exit(0);
    }

    // Show some examples
    console.log('\n📋 Sample journal entries to be removed:');
    paymentJournalEntries.slice(0, 5).forEach((entry, index) => {
      console.log(`${index + 1}. ID: ${entry.id} | Transaction: ${entry.transaction_id} | ${entry.entry_type}: $${entry.amount} | ${entry.description || 'N/A'}`);
    });

    // Step 2: Hard delete journal entries for student payments
    console.log('\n🗑️ Hard deleting payment journal entries...');
    const [deleteResult] = await conn.query(
      `DELETE je FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE t.transaction_type = 'payment'`
    );

    console.log(`✅ Hard deleted ${deleteResult.affectedRows} journal entries`);

    // Step 3: Recalculate balances
    console.log('\n🔄 Recalculating account balances...');
    await recalculateAllAccountBalances();

    // Step 4: Check trial balance
    console.log('\n📊 Checking trial balance...');
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

    console.log(`Trial Balance:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);

    // Step 5: Show remaining payment journal entries (should be 0)
    const [remainingJournalEntries] = await conn.query(
      `SELECT COUNT(*) as count
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE t.transaction_type = 'payment'`
    );

    console.log(`\n📊 Remaining payment journal entries: ${remainingJournalEntries[0]?.count || 0}`);

    // Step 6: Show payment transactions (should still exist)
    const [paymentTransactions] = await conn.query(
      `SELECT COUNT(*) as count
       FROM transactions 
       WHERE transaction_type = 'payment'`
    );

    console.log(`📊 Payment transactions (unchanged): ${paymentTransactions[0]?.count || 0}`);

    console.log('\n✅ Student payment journal entries removed successfully!');
    console.log('📝 Payment transactions remain untouched');
    console.log('📝 Ready to re-enter journal entries (excluding PAYMENT 1 column amounts)');

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

removePaymentJournalEntries();
