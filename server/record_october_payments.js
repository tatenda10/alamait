require('dotenv').config();
const mysql = require('mysql2/promise');

async function recordOctoberPayments() {
  console.log('💰 Recording October 2025 Student Payments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    const paymentDate = '2025-10-15'; // Mid-October

    // Payment data: [student_name, payment1_amount, payment2_amount, payment_method]
    const payments = [
      ['Christine Mutsikwa', 160.00, 0, 'cash'],
      ['Tanaka Chikonyera', 160.00, 0, 'cash'],
      ['Vannessa Magorimbo', 125.00, 30.00, 'cash'],
      ['Agape Chiware', 160.00, 0, 'cash'],
      ['Emma Yoradin', 160.00, 0, 'cash'],
      ['Bertha Mwangu', 160.00, 0, 'cash'],
      ['Kimbely Bones', 320.00, 0, 'cash'],
      ['Tadiwa', 160.00, 0, 'cash'],
      ['Fadzai Mhizha', 160.00, 0, 'cash'],
      ['Tinotenda Chidavaenzi', 140.00, 0, 'cash'],
      ['Pelagia Gomakalila', 190.00, 0, 'cash'],
      ['Takudzwa Makunde', 200.00, 0, 'cash'],
      ['Precious Dziva', 190.00, 0, 'cash'],
      ['Tatenda Kamatando', 200.00, 0, 'bank'], // Bank transfer (yellow)
      ['Chantelle Gora', 160.00, 35.00, 'cash'],
      ['Shalom Gora', 160.00, 35.00, 'cash'],
      ['Dion sengamai', 160.00, 0, 'cash'],
      ['Charmain Tinarwo', 180.00, 0, 'cash'],
      ['Anita Gwenda', 100.00, 0, 'cash'],
      ['Thelma Nzvimari', 60.00, 10.00, 'cash'],
      ['Farai Muzembe', 120.00, 0, 'cash'],
      ['Bellis Mapetere', 180.00, 0, 'bank'], // Bank transfer (yellow)
      ['Tadiwa Mhloro', 200.00, 0, 'cash'],
      ['Salina Saidi', 170.00, 0, 'cash'],
      ['Tinotenda Bwangangwanyo', 170.00, 0, 'cash'],
      ['Lorraine Mlambo', 170.00, 0, 'cash'],
      ['Tinotenda Magiga', 165.00, 0, 'cash'],
      ['Munashe', 160.00, 0, 'cash'],
      ['Ruvimbo Singe', 160.00, 0, 'cash'],
      ['Lillian Chatikobo', 180.00, 0, 'cash'],
      ['Sharon Matanha', 82.00, 0, 'cash'],
      ['Kimberly Mutowembwa', 180.00, 0, 'cash'],
      ['Trypheane Chinembiri', 100.00, 0, 'cash'],
      ['Merrylin Makunzva', 180.00, 0, 'cash'],
      ['Shantell Mawarira', 180.00, 0, 'cash'],
      ['Alicia Mutamuko', 180.00, 0, 'cash'],
      ['Bertha Majoni', 190.00, 0, 'cash'],
      ['Tanaka Matematema', 220.00, 0, 'cash'],
      ['Kudzai Matare', 130.00, 50.00, 'cash'],
      ['Shantel Mashe', 180.00, 0, 'cash'],
      ['Fay Mubaiwa', 160.00, 0, 'cash'],
      ['Kimberly Nkomo', 160.00, 0, 'cash'],
      ['Precious Mashava', 160.00, 0, 'cash'],
      ['Mitchel Chikosha', 160.00, 0, 'cash'],
      ['Vimbai', 160.00, 0, 'cash'],
      ['Ropafadzo Masara', 120.00, 20.00, 'cash'],
      ['Rumbidzai Manyaora', 150.00, 0, 'cash'],
      ['Nyashadzashe Chinorwiwa', 150.00, 0, 'cash'],
      ['Kuziwa', 120.00, 0, 'cash']
    ];

    let totalPayments = 0;
    let paymentsRecorded = 0;
    let bankPayments = 0;
    let cashPayments = 0;

    for (const [studentName, payment1, payment2, paymentMethod] of payments) {
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

      // Process Payment 1
      if (payment1 > 0) {
        await recordPayment(
          connection,
          student,
          payment1,
          paymentDate,
          paymentMethod,
          currency,
          payment2 > 0 ? '1/2' : ''
        );
        totalPayments += payment1;
        paymentsRecorded++;
        
        if (paymentMethod === 'bank') {
          bankPayments++;
        } else {
          cashPayments++;
        }
      }

      // Process Payment 2 if exists
      if (payment2 > 0) {
        await recordPayment(
          connection,
          student,
          payment2,
          paymentDate,
          paymentMethod,
          currency,
          '2/2'
        );
        totalPayments += payment2;
        paymentsRecorded++;
        cashPayments++; // Second payments are always cash
      }

      const totalForStudent = payment1 + payment2;
      console.log(`✓ ${student.full_name}: $${totalForStudent.toFixed(2)} (${paymentMethod.toUpperCase()}${payment2 > 0 ? ' - 2 payments' : ''})`);
    }

    await connection.commit();

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 PAYMENT RECORDING SUMMARY:');
    console.log(`✅ Total Payments Recorded: ${paymentsRecorded}`);
    console.log(`💵 Cash Payments: ${cashPayments}`);
    console.log(`🏦 Bank Payments: ${bankPayments}`);
    console.log(`💰 Total Amount: $${totalPayments.toFixed(2)}`);
    console.log(`📅 Payment Date: ${paymentDate}`);

    // Get updated student balances
    const [totals] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN sab.current_balance > 0 THEN sab.current_balance ELSE 0 END) as total_prepayments,
        SUM(CASE WHEN sab.current_balance < 0 THEN ABS(sab.current_balance) ELSE 0 END) as total_debtors,
        SUM(sab.current_balance) as net_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
    `);

    console.log('\n📊 UPDATED STUDENT BALANCES:');
    console.log(`  Prepayments: $${parseFloat(totals[0].total_prepayments || 0).toFixed(2)}`);
    console.log(`  Debtors: $${parseFloat(totals[0].total_debtors || 0).toFixed(2)}`);
    console.log(`  Net Balance: $${parseFloat(totals[0].net_balance || 0).toFixed(2)}`);

    console.log('\n✅ All October payments recorded successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

async function recordPayment(connection, student, amount, paymentDate, paymentMethod, currency, note) {
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
    `Payment ${note} - ${student.full_name} - October 2025`,
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
    note ? `Payment ${note}` : 'October rent payment',
    1,
    'completed'
  ]);

  // Update student account balance (credit - reduces what student owes)
  await connection.execute(`
    UPDATE student_account_balances
    SET current_balance = current_balance + ?,
        updated_at = NOW()
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
}

recordOctoberPayments();

