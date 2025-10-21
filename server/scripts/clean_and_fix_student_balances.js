const db = require('../src/services/db');

async function cleanAndFix() {
  const conn = await db.getConnection();
  try {
    console.log('Starting fresh - cleaning and fixing student balances...\n');
    
    // Step 1: Check current state
    console.log('Step 1: Checking current state...');
    
    const [arBalance] = await conn.query(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '10005'
    `);
    
    const [revenueBalance] = await conn.query(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '40001'
    `);
    
    console.log(`Current Accounts Receivable: $${arBalance[0]?.current_balance || 0}`);
    console.log(`Current Rentals Income: $${revenueBalance[0]?.current_balance || 0}`);
    
    // Step 2: Remove ALL non-invoice transactions from Accounts Receivable
    console.log('\nStep 2: Removing non-invoice transactions from Accounts Receivable...');
    
    // Get all non-invoice transactions that affect Accounts Receivable
    const [nonInvoiceTransactions] = await conn.query(`
      SELECT DISTINCT t.id, t.transaction_type, t.reference, t.amount
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code = '10005'
        AND t.transaction_type != 'initial_invoice'
        AND t.deleted_at IS NULL
    `);
    
    console.log(`Found ${nonInvoiceTransactions.length} non-invoice transactions affecting Accounts Receivable`);
    
    // Soft delete these transactions
    for (const txn of nonInvoiceTransactions) {
      await conn.query(`
        UPDATE journal_entries 
        SET deleted_at = NOW()
        WHERE transaction_id = ?
      `, [txn.id]);
      
      await conn.query(`
        UPDATE transactions 
        SET deleted_at = NOW()
        WHERE id = ?
      `, [txn.id]);
      
      console.log(`  Removed: ${txn.transaction_type} - ${txn.reference} - $${txn.amount}`);
    }
    
    // Step 3: Verify only invoice transactions remain
    console.log('\nStep 3: Verifying only invoice transactions remain...');
    
    const [remainingTransactions] = await conn.query(`
      SELECT 
        t.transaction_type,
        COUNT(*) as count,
        SUM(t.amount) as total_amount
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE coa.code = '10005'
        AND t.deleted_at IS NULL
      GROUP BY t.transaction_type
    `);
    
    console.log('Remaining transactions affecting Accounts Receivable:');
    remainingTransactions.forEach(txn => {
      console.log(`  ${txn.transaction_type}: ${txn.count} transactions, Total: $${txn.total_amount}`);
    });
    
    // Step 4: Update student balances based on invoices
    console.log('\nStep 4: Updating student balances based on invoices...');
    
    // Get all students with their invoice amounts
    const [studentInvoices] = await conn.query(`
      SELECT 
        s.id as student_id,
        s.full_name,
        se.id as enrollment_id,
        se.agreed_amount,
        se.admin_fee,
        (se.agreed_amount + COALESCE(se.admin_fee, 0)) as total_invoice_amount
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
      ORDER BY s.full_name
    `);
    
    console.log(`Found ${studentInvoices.length} students to update balances for`);
    
    // Update student account balances to match their invoice amounts (negative because they owe money)
    for (const student of studentInvoices) {
      await conn.query(`
        INSERT INTO student_account_balances (
          student_id, 
          enrollment_id, 
          current_balance, 
          currency, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, 'USD', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        current_balance = ?,
        updated_at = NOW()
      `, [
        student.student_id,
        student.enrollment_id,
        -student.total_invoice_amount, // Negative because they owe money
        -student.total_invoice_amount
      ]);
      
      console.log(`  ${student.full_name}: $${student.total_invoice_amount} (Rent: $${student.agreed_amount}, Admin: $${student.admin_fee || 0})`);
    }
    
    // Step 5: Recalculate all account balances
    console.log('\nStep 5: Recalculating all account balances...');
    const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');
    await recalculateAllAccountBalances();
    console.log('✅ Account balances recalculated');
    
    // Step 6: Verify final state
    console.log('\nStep 6: Verifying final state...');
    
    const [finalArBalance] = await conn.query(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '10005'
    `);
    
    const [finalRevenueBalance] = await conn.query(`
      SELECT current_balance 
      FROM current_account_balances 
      WHERE account_code = '40001'
    `);
    
    const [studentBalanceSum] = await conn.query(`
      SELECT SUM(current_balance) as total_student_balances
      FROM student_account_balances
      WHERE deleted_at IS NULL
    `);
    
    console.log(`Final Accounts Receivable: $${finalArBalance[0]?.current_balance || 0}`);
    console.log(`Final Rentals Income: $${finalRevenueBalance[0]?.current_balance || 0}`);
    console.log(`Total Student Balances: $${studentBalanceSum[0]?.total_student_balances || 0}`);
    
    // Check if balances match
    const finalArBalanceValue = parseFloat(finalArBalance[0]?.current_balance || 0);
    const finalRevenueBalanceValue = parseFloat(finalRevenueBalance[0]?.current_balance || 0);
    const studentBalances = parseFloat(studentBalanceSum[0]?.total_student_balances || 0);
    
    console.log('\nBalance Verification:');
    console.log(`Accounts Receivable should equal Rentals Income: ${Math.abs(finalArBalanceValue - finalRevenueBalanceValue) < 0.01 ? '✅' : '❌'}`);
    console.log(`Student balances should equal negative of AR: ${Math.abs(studentBalances + finalArBalanceValue) < 0.01 ? '✅' : '❌'}`);
    console.log(`Expected total: $10,960.00`);
    console.log(`Actual total: $${finalRevenueBalanceValue.toFixed(2)}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

cleanAndFix();
