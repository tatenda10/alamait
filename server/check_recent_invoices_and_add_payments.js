require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAndAddPayments() {
  console.log('🔍 Checking recent invoices and adding missing payments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Check for Charmain and Tanaka invoices
    console.log('📋 RECENT OCTOBER INVOICES (Last 10):');
    const [recentInvoices] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        s.full_name as student_name
      FROM transactions t
      LEFT JOIN students s ON t.student_id = s.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_type = 'monthly_invoice'
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    console.table(recentInvoices);

    // Check journal entries for these invoices
    if (recentInvoices.length > 0) {
      console.log('\n📒 JOURNAL ENTRIES FOR RECENT INVOICES:');
      const transactionIds = recentInvoices.map(t => t.id).join(',');
      const [journalEntries] = await connection.execute(`
        SELECT 
          je.transaction_id,
          coa.code,
          coa.name as account_name,
          je.entry_type,
          je.amount
        FROM journal_entries je
        JOIN chart_of_accounts coa ON je.account_id = coa.id
        WHERE je.transaction_id IN (${transactionIds})
        ORDER BY je.transaction_id, je.entry_type DESC
      `);
      console.table(journalEntries);
    }

    // Now add payments for Charmain and Tanaka
    const paymentDate = '2025-10-29';

    // Payment data: [student_name, amount, payment_method]
    const missingPayments = [
      ['Charmain Tinarwo', 180.00, 'cash'],
      ['Tanaka Matematema', 220.00, 'cash']
    ];

    console.log('\n💰 ADDING MISSING PAYMENTS:\n');

    for (const [studentName, amount, paymentMethod] of missingPayments) {
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
        console.log(`⚠️  ${studentName} not found - skipping`);
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
    }

    await connection.commit();

    // Check final October revenue
    console.log('\n📊 FINAL OCTOBER REVENUE CHECK:');
    const [octoberRevenue] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as net_revenue
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '40001'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
    `);
    console.table(octoberRevenue);

    console.log('\n✅ All payments added successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkAndAddPayments();

