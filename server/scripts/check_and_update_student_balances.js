const db = require('../src/services/db');

async function checkAndUpdateStudentBalances() {
  const conn = await db.getConnection();
  try {
    console.log('Checking and updating student balances based on payments and invoices...\n');
    
    // Step 1: Check current student balances
    console.log('Step 1: Checking current student balances...');
    
    const [studentBalances] = await conn.query(`
      SELECT 
        s.id,
        s.full_name,
        sab.current_balance,
        se.agreed_amount,
        se.admin_fee,
        (se.agreed_amount + COALESCE(se.admin_fee, 0)) as total_invoice_amount
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
      ORDER BY s.full_name
      LIMIT 10
    `);
    
    console.log('Sample student balances:');
    studentBalances.forEach(student => {
      console.log(`  ${student.full_name}: Balance $${student.current_balance || 0}, Invoice $${student.total_invoice_amount}`);
    });
    
    // Step 2: Calculate what each student's balance should be
    console.log('\nStep 2: Calculating correct student balances...');
    
    const [studentPayments] = await conn.query(`
      SELECT 
        s.id as student_id,
        s.full_name,
        se.id as enrollment_id,
        se.agreed_amount,
        se.admin_fee,
        (se.agreed_amount + COALESCE(se.admin_fee, 0)) as total_invoice_amount,
        COALESCE(SUM(sp.amount), 0) as total_payments
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN student_payments sp ON s.id = sp.student_id AND sp.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
      GROUP BY s.id, s.full_name, se.id, se.agreed_amount, se.admin_fee
      ORDER BY s.full_name
    `);
    
    console.log(`Found ${studentPayments.length} students with payment data`);
    
    let updatedCount = 0;
    let totalInvoiceAmount = 0;
    let totalPaymentsReceived = 0;
    let totalStudentBalances = 0;
    
    for (const student of studentPayments) {
      const invoiceAmount = parseFloat(student.total_invoice_amount);
      const paymentsReceived = parseFloat(student.total_payments);
      const correctBalance = paymentsReceived - invoiceAmount; // Positive = overpaid, Negative = owes money
      
      totalInvoiceAmount += invoiceAmount;
      totalPaymentsReceived += paymentsReceived;
      totalStudentBalances += correctBalance;
      
      // Update student account balance
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
        student.enrollment_id, // Using correct enrollment_id
        correctBalance,
        correctBalance
      ]);
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`  Updated ${updatedCount}/${studentPayments.length} students...`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} student balances`);
    console.log(`Total invoice amount: $${totalInvoiceAmount.toFixed(2)}`);
    console.log(`Total payments received: $${totalPaymentsReceived.toFixed(2)}`);
    console.log(`Total student balances: $${totalStudentBalances.toFixed(2)}`);
    
    // Step 3: Verify the balances match the accounting equation
    console.log('\nStep 3: Verifying accounting equation...');
    
    const [arBalance] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10005'`
    );
    const [cashBalance] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10002'`
    );
    const [revenueBalance] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '40001'`
    );
    
    const arBalanceValue = parseFloat(arBalance[0]?.current_balance || 0);
    const cashBalanceValue = parseFloat(cashBalance[0]?.current_balance || 0);
    const revenueBalanceValue = parseFloat(revenueBalance[0]?.current_balance || 0);
    
    console.log(`Accounts Receivable: $${arBalanceValue.toFixed(2)}`);
    console.log(`Cash: $${cashBalanceValue.toFixed(2)}`);
    console.log(`Rentals Income: $${revenueBalanceValue.toFixed(2)}`);
    console.log(`Total Student Balances: $${totalStudentBalances.toFixed(2)}`);
    
    // The accounting equation should be:
    // AR = Revenue - Cash (money owed = total invoiced - money received)
    const expectedAR = revenueBalanceValue - cashBalanceValue;
    const actualAR = arBalanceValue;
    
    console.log(`\nAccounting verification:`);
    console.log(`Expected AR (Revenue - Cash): $${expectedAR.toFixed(2)}`);
    console.log(`Actual AR: $${actualAR.toFixed(2)}`);
    console.log(`Difference: $${(actualAR - expectedAR).toFixed(2)}`);
    
    if (Math.abs(actualAR - expectedAR) < 0.01) {
      console.log('✅ Accounting equation is balanced!');
    } else {
      console.log('❌ Accounting equation is not balanced');
    }
    
    // Step 4: Show sample updated balances
    console.log('\nStep 4: Sample updated student balances:');
    
    const [sampleBalances] = await conn.query(`
      SELECT 
        s.full_name,
        sab.current_balance,
        se.agreed_amount,
        se.admin_fee,
        (se.agreed_amount + COALESCE(se.admin_fee, 0)) as total_invoice_amount,
        COALESCE(SUM(sp.amount), 0) as total_payments
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_payments sp ON s.id = sp.student_id AND sp.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
      GROUP BY s.id, s.full_name, sab.current_balance, se.agreed_amount, se.admin_fee
      ORDER BY s.full_name
      LIMIT 10
    `);
    
    sampleBalances.forEach(student => {
      const balance = parseFloat(student.current_balance || 0);
      const status = balance > 0 ? 'OVERPAID' : balance < 0 ? 'OWES' : 'PAID IN FULL';
      console.log(`  ${student.full_name}: $${balance.toFixed(2)} (Invoice: $${student.total_invoice_amount}, Payments: $${student.total_payments}) - ${status}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkAndUpdateStudentBalances();
