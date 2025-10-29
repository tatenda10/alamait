require('dotenv').config();
const mysql = require('mysql2/promise');

async function addMissingPayments() {
  console.log('💰 Adding payments for Charmain and Tanaka...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    const paymentDate = '2025-10-15'; // October 15th
    
    // Payment data: [student_name, amount, payment_method]
    const payments = [
      ['Charmain Tinarwo', 180.00, 'cash'],
      ['Tanaka Matematema', 220.00, 'cash']
    ];

    let totalPayments = 0;
    let paymentsRecorded = 0;

    for (const [studentName, amount, paymentMethod] of payments) {
      // Find student
      const [students] = await connection.execute(`
        SELECT 
          s.id as student_id,
          s.full_name,
          se.id as enrollment_id,
          se.boarding_house_id,
          se.currency
        FROM students s
        LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
        WHERE s.full_name LIKE ?
          AND s.deleted_at IS NULL
        LIMIT 1
      `, [`%${studentName}%`]);

      if (students.length === 0) {
        console.log(`⚠️  Student not found: ${studentName}`);
        continue;
      }

      const student = students[0];
      const currency = student.currency || 'USD';

      // Create transaction record
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (
          transaction_type,
          student_id,
          reference,
          amount,
          currency,
          description,
          transaction_date,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'payment',
        student.student_id,
        `PAY-OCT-${student.enrollment_id}-${Date.now()}`,
        amount,
        currency,
        `Payment - ${student.full_name} - October 2025`,
        paymentDate,
        student.boarding_house_id,
        1
      ]);

      const transactionId = transactionResult.insertId;

      // Create student payment record
      await connection.execute(`
        INSERT INTO student_payments (
          student_id,
          enrollment_id,
          transaction_id,
          amount,
          payment_date,
          payment_method,
          payment_type,
          notes,
          created_by,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        student.student_id,
        student.enrollment_id,
        transactionId,
        amount,
        paymentDate,
        paymentMethod,
        'rent',
        'October rent payment',
        1,
        'completed'
      ]);

      // Update student account balance (credit - reduces what student owes)
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = current_balance + ?
        WHERE student_id = ?
      `, [amount, student.student_id]);

      // Get account IDs for journal entries
      const bankAccountCode = paymentMethod === 'bank' ? '10002' : '10001'; // Bank or Cash
      
      const [cashAccount] = await connection.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        [bankAccountCode]
      );

      const [receivableAccount] = await connection.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['10005'] // Accounts Receivable
      );

      // Create journal entries for double-entry accounting
      // Debit: Cash/Bank (Asset increases)
      await connection.execute(`
        INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        transactionId,
        cashAccount[0].id,
        'debit',
        amount,
        `Student payment - Debit ${paymentMethod === 'bank' ? 'Bank' : 'Cash'}`,
        student.boarding_house_id,
        1
      ]);

      // Credit: Accounts Receivable (Asset decreases)
      await connection.execute(`
        INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        transactionId,
        receivableAccount[0].id,
        'credit',
        amount,
        `Student payment - Credit Accounts Receivable`,
        student.boarding_house_id,
        1
      ]);

      console.log(`✓ ${student.full_name}: $${amount.toFixed(2)} (${paymentMethod.toUpperCase()})`);
      totalPayments += amount;
      paymentsRecorded++;
    }

    await connection.commit();

    console.log('\n' + '='.repeat(80));
    console.log('📊 PAYMENT SUMMARY:');
    console.log(`✅ Payments Recorded: ${paymentsRecorded}`);
    console.log(`💰 Total Amount: $${totalPayments.toFixed(2)}`);
    console.log(`📅 Payment Date: ${paymentDate}`);

    // Get updated totals
    console.log('\n📊 UPDATED OCTOBER PAYMENT TOTALS:');
    const [totals] = await connection.execute(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount
      FROM transactions
      WHERE transaction_date >= '2025-10-01'
        AND transaction_date <= '2025-10-31'
        AND transaction_type = 'payment'
    `);
    console.log(`Total October Payments: ${totals[0].total_payments}`);
    console.log(`Total Amount Collected: $${parseFloat(totals[0].total_amount).toFixed(2)}`);

    console.log('\n✅ All payments added successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

addMissingPayments();

