const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// Remove all payment-related transactions and journals, then recalculate balances

async function main() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    console.log('Step 1: Soft-deleting payment-related journal entries...');
    
    // Soft delete journal entries for payment transactions
    await conn.query(`
      UPDATE journal_entries je
      JOIN transactions t ON t.id = je.transaction_id
      SET je.deleted_at = NOW()
      WHERE je.deleted_at IS NULL
        AND t.transaction_type IN ('payment', 'monthly_rent', 'admin_fee_payment', 'security_deposit_payment', 'accounts_payable_payment')
        AND t.deleted_at IS NULL;
    `);
    
    console.log('Step 2: Soft-deleting payment transactions...');
    
    // Soft delete payment transactions
    await conn.query(`
      UPDATE transactions SET deleted_at = NOW()
      WHERE deleted_at IS NULL 
        AND transaction_type IN ('payment', 'monthly_rent', 'admin_fee_payment', 'security_deposit_payment', 'accounts_payable_payment');
    `);
    
    console.log('Step 3: Resetting student account balances to invoice amounts...');
    
    // Reset student_account_balances to match their invoices (negative balance = owed)
    await conn.query(`
      UPDATE student_account_balances sab
      JOIN (
        SELECT si.student_id, si.enrollment_id, SUM(si.amount) AS total_invoiced
        FROM student_invoices si
        WHERE si.deleted_at IS NULL
        GROUP BY si.student_id, si.enrollment_id
      ) inv ON sab.student_id = inv.student_id AND sab.enrollment_id = inv.enrollment_id
      SET sab.current_balance = -inv.total_invoiced,
          sab.updated_at = NOW();
    `);
    
    await conn.commit();
    
    console.log('Step 4: Recomputing current_account_balances...');
    await recalculateAllAccountBalances();
    
    console.log('\n✅ Payment removal and recalculation completed successfully.');
    console.log('All payment transactions and journals have been soft-deleted.');
    console.log('Student balances reset to invoice amounts.');
    console.log('Account balances recomputed.');
    
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Operation failed:', e);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
}

main();

