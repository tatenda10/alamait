const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function removeAllStudentPayments() {
  const conn = await db.getConnection();
  try {
    console.log('🗑️ Removing ALL student payment transactions and journal entries...\n');

    // First, let's see what we have
    const [paymentTransactions] = await conn.query(
      `SELECT COUNT(*) as count FROM transactions WHERE transaction_type = 'payment' AND deleted_at IS NULL`
    );
    const [paymentJournals] = await conn.query(
      `SELECT COUNT(*) as count FROM journal_entries je 
       JOIN transactions t ON je.transaction_id = t.id 
       WHERE t.transaction_type = 'payment' AND je.deleted_at IS NULL`
    );

    console.log(`📊 Found ${paymentTransactions[0].count} payment transactions`);
    console.log(`📊 Found ${paymentJournals[0].count} payment journal entries`);

    // Step 1: Hard delete all payment journal entries
    console.log('\n🗑️ Step 1: Hard deleting payment journal entries...');
    const [deletedJournals] = await conn.query(
      `DELETE FROM journal_entries 
       WHERE transaction_id IN (
         SELECT id FROM transactions WHERE transaction_type = 'payment' AND deleted_at IS NULL
       )`
    );
    console.log(`✅ Deleted ${deletedJournals.affectedRows} journal entries`);

    // Step 2: Hard delete all payment transactions
    console.log('\n🗑️ Step 2: Hard deleting payment transactions...');
    const [deletedTransactions] = await conn.query(
      `DELETE FROM transactions WHERE transaction_type = 'payment' AND deleted_at IS NULL`
    );
    console.log(`✅ Deleted ${deletedTransactions.affectedRows} payment transactions`);

    // Step 3: Check if there are any student_payments records to clean up
    console.log('\n🔍 Step 3: Checking student_payments table...');
    const [studentPayments] = await conn.query(
      `SELECT COUNT(*) as count FROM student_payments WHERE deleted_at IS NULL`
    );
    console.log(`📊 Found ${studentPayments[0].count} student payment records`);

    if (studentPayments[0].count > 0) {
      console.log('🗑️ Soft deleting student_payments records...');
      const [deletedStudentPayments] = await conn.query(
        `UPDATE student_payments SET deleted_at = NOW() WHERE deleted_at IS NULL`
      );
      console.log(`✅ Soft deleted ${deletedStudentPayments.affectedRows} student payment records`);
    }

    // Step 4: Recalculate all account balances
    console.log('\n🔄 Step 4: Recalculating account balances...');
    await recalculateAllAccountBalances();

    // Step 5: Check trial balance
    console.log('\n📊 Step 5: Checking trial balance...');
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

    // Step 6: Check remaining payment transactions
    const [remainingPayments] = await conn.query(
      `SELECT COUNT(*) as count FROM transactions WHERE transaction_type = 'payment'`
    );
    const [remainingJournals] = await conn.query(
      `SELECT COUNT(*) as count FROM journal_entries je 
       JOIN transactions t ON je.transaction_id = t.id 
       WHERE t.transaction_type = 'payment'`
    );

    console.log(`\n📊 Final Summary:`);
    console.log(`  Remaining payment transactions: ${remainingPayments[0].count}`);
    console.log(`  Remaining payment journal entries: ${remainingJournals[0].count}`);
    console.log(`  Student payment records: ${studentPayments[0].count} (soft deleted)`);

    console.log('\n✅ All student payment transactions and journal entries removed successfully!');
    console.log('🔄 Account balances have been recalculated');
    console.log('📊 Trial balance has been checked');

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

removeAllStudentPayments();
