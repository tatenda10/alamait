const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function removeAndReenterPaymentJournals() {
  const conn = await db.getConnection();
  try {
    console.log('🗑️ Removing all student payment transactions and journal entries...\n');

    // Step 1: Get all student payment transactions
    const [paymentTransactions] = await conn.query(
      `SELECT id, amount, description 
       FROM transactions 
       WHERE transaction_type = 'payment' 
         AND deleted_at IS NULL`
    );

    console.log(`📊 Found ${paymentTransactions.length} payment transactions to remove`);

    // Step 2: Get corresponding journal entries
    const transactionIds = paymentTransactions.map(t => t.id);
    const [journalEntries] = await conn.query(
      `SELECT id, transaction_id, account_id, entry_type, amount, description
       FROM journal_entries 
       WHERE transaction_id IN (${transactionIds.map(() => '?').join(',')})
         AND deleted_at IS NULL`,
      transactionIds
    );

    console.log(`📊 Found ${journalEntries.length} journal entries to soft delete`);

    // Step 3: Soft delete journal entries
    console.log('\n🗑️ Soft deleting journal entries...');
    const [deleteResult] = await conn.query(
      `UPDATE journal_entries 
       SET deleted_at = NOW() 
       WHERE transaction_id IN (${transactionIds.map(() => '?').join(',')})
         AND deleted_at IS NULL`,
      transactionIds
    );

    console.log(`✅ Soft deleted ${deleteResult.affectedRows} journal entries`);

    // Step 4: Hard delete payment transactions
    console.log('\n🗑️ Hard deleting payment transactions...');
    const [deleteTransactions] = await conn.query(
      `DELETE FROM transactions 
       WHERE transaction_type = 'payment' 
         AND deleted_at IS NULL`
    );

    console.log(`✅ Hard deleted ${deleteTransactions.affectedRows} payment transactions`);

    // Step 5: Recalculate balances
    console.log('\n🔄 Recalculating account balances...');
    await recalculateAllAccountBalances();

    // Step 6: Check trial balance
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

    // Step 7: Show remaining payment transactions (should be 0)
    const [remainingPayments] = await conn.query(
      `SELECT COUNT(*) as count
       FROM transactions 
       WHERE transaction_type = 'payment'`
    );

    console.log(`\n📊 Remaining payment transactions: ${remainingPayments[0]?.count || 0}`);

    console.log('\n✅ Student payment transactions and journal entries removed successfully!');
    console.log('📝 Ready to re-enter journal entries (excluding PAYMENT 1 column amounts)');

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

removeAndReenterPaymentJournals();
