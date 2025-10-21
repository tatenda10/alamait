const db = require('../src/services/db');

async function clearCashAndAddPayments() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Clearing all cash transactions and resetting cash balance to zero...\n');
    
    await conn.beginTransaction();
    
    // 1. Find the Cash account ID
    const [cashAccount] = await conn.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL`
    );
    
    if (!cashAccount.length) {
      console.error('Cash account (10002) not found. Aborting.');
      await conn.rollback();
      return;
    }
    const cashAccountId = cashAccount[0].id;
    console.log(`Found Cash account ID: ${cashAccountId}`);
    
    // 2. Soft-delete journal entries related to the Cash account
    console.log('Soft-deleting journal entries related to Cash account...');
    const [deletedJournals] = await conn.query(
      `UPDATE journal_entries 
       SET deleted_at = NOW() 
       WHERE account_id = ? 
         AND deleted_at IS NULL`,
      [cashAccountId]
    );
    console.log(`Soft-deleted ${deletedJournals.affectedRows} journal entries.`);
    
    // 3. Soft-delete transactions that involve the Cash account
    console.log('Soft-deleting transactions related to Cash account...');
    const [deletedTransactions] = await conn.query(
      `UPDATE transactions 
       SET deleted_at = NOW() 
       WHERE id IN (
         SELECT DISTINCT transaction_id FROM journal_entries 
         WHERE account_id = ? AND deleted_at IS NOT NULL
       ) AND deleted_at IS NULL`,
      [cashAccountId]
    );
    console.log(`Soft-deleted ${deletedTransactions.affectedRows} transactions.`);
    
    // 4. Reset the current_account_balances for Cash to 0
    console.log('Resetting Cash account balance to zero...');
    const [resetBalance] = await conn.query(
      `UPDATE current_account_balances 
       SET current_balance = 0, total_debits = 0, total_credits = 0, transaction_count = 0, last_transaction_date = NULL
       WHERE account_code = '10002'`
    );
    console.log(`Reset Cash account balance: ${resetBalance.affectedRows} row(s) updated.`);
    
    await conn.commit();
    console.log('✅ Cash transactions cleared and balance reset successfully.\n');
    
    // 5. Recalculate all account balances to ensure consistency
    console.log('Recalculating all account balances...');
    const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');
    await recalculateAllAccountBalances();
    console.log('✅ All account balances recalculated.\n');
    
    // 6. Verify Cash balance
    const [finalCashBalance] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10002'`
    );
    console.log(`Final Cash (10002) balance: $${finalCashBalance[0]?.current_balance || 0}\n`);
    
    // Step 2: Add student payments from the image
    console.log('Step 2: Adding student payments from the image...\n');
    
    // Payment data extracted from the image
    const PAYMENT_DATA = [
      // 1/9/2025 payments
      { student: 'Trypheane Chinembiri', amount: 180.00, date: '2025-09-01' },
      { student: 'Anita Gwenda', amount: 140.00, date: '2025-09-01' },
      { student: 'Lillian Chatikobo', amount: 20.00, date: '2025-09-01' },
      { student: 'Bellis Mapetere', amount: 180.00, date: '2025-09-01' },
      { student: 'Rumbidzai Manyaora', amount: 100.00, date: '2025-09-01' },
      { student: 'Rumbidzai Manyaora', amount: 20.00, date: '2025-09-01' }, // Second payment
      { student: 'Mitchel Chikosha', amount: 60.00, date: '2025-09-01' },
      { student: 'Mitchel Chikosha', amount: 20.00, date: '2025-09-01' }, // Second payment
      { student: 'Pelagia Gomakalila', amount: 210.00, date: '2025-09-01' },
      { student: 'Pelagia Gomakalila', amount: 190.00, date: '2025-09-01' }, // Second payment
      
      // 2/9/2025 payments
      { student: 'Shantel Mashe', amount: 200.00, date: '2025-09-02' },
      { student: 'Shantel Mashe', amount: 180.00, date: '2025-09-02' }, // Second payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Third payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Fourth payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Fifth payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Sixth payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Seventh payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Eighth payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Ninth payment
      { student: 'Shantel Mashe', amount: 20.00, date: '2025-09-02' }, // Tenth payment
      
      // 8/9/2025 payments
      { student: 'Tadiwa Mhloro', amount: 200.00, date: '2025-09-08' },
      { student: 'Tadiwa Mhloro', amount: 180.00, date: '2025-09-08' }, // Second payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Third payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Fourth payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Fifth payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Sixth payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Seventh payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Eighth payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Ninth payment
      { student: 'Tadiwa Mhloro', amount: 20.00, date: '2025-09-08' }, // Tenth payment
    ];
    
    console.log(`Processing ${PAYMENT_DATA.length} payments from the image...\n`);
    
    // Get account IDs
    const [cashAccountInfo] = await conn.query(
      `SELECT id, code, name FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL`
    );
    const [arAccountInfo] = await conn.query(
      `SELECT id, code, name FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL`
    );
    
    const cashAccountIdFinal = cashAccountInfo[0].id;
    const arAccountId = arAccountInfo[0].id;
    
    console.log(`Cash Account: ${cashAccountInfo[0].code} - ${cashAccountInfo[0].name} (ID: ${cashAccountIdFinal})`);
    console.log(`AR Account: ${arAccountInfo[0].code} - ${arAccountInfo[0].name} (ID: ${arAccountId})\n`);
    
    let createdCount = 0;
    let totalCashInflow = 0;
    
    for (const payment of PAYMENT_DATA) {
      // Find student by name
      const [students] = await conn.query(
        `SELECT s.id as student_id, s.full_name, se.id as enrollment_id, se.boarding_house_id
         FROM students s
         JOIN student_enrollments se ON s.id = se.student_id
         WHERE LOWER(TRIM(s.full_name)) = LOWER(TRIM(?))
           AND s.deleted_at IS NULL
           AND se.deleted_at IS NULL
         LIMIT 1`,
        [payment.student]
      );
      
      if (students.length === 0) {
        console.log(`⚠️  Student not found: ${payment.student}`);
        continue;
      }
      
      const student = students[0];
      
      // Create payment transaction
      const transactionRef = `PAY-${student.full_name.substring(0, 5)}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      
      const [transactionResult] = await conn.query(
        `INSERT INTO transactions (
          transaction_type,
          student_id,
          reference,
          amount,
          currency,
          description,
          transaction_date,
          boarding_house_id,
          created_by,
          created_at,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          'payment',
          student.student_id,
          transactionRef,
          payment.amount,
          'USD',
          `Payment from ${student.full_name}`,
          payment.date,
          student.boarding_house_id,
          1,
          'posted'
        ]
      );
      
      const transactionId = transactionResult.insertId;
      
      // Create journal entries
      // Debit: Cash
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          transactionId,
          cashAccountIdFinal,
          'debit',
          payment.amount,
          `Student payment - Debit Cash`,
          student.boarding_house_id,
          1
        ]
      );
      
      // Credit: Accounts Receivable
      await conn.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          transactionId,
          arAccountId,
          'credit',
          payment.amount,
          `Student payment - Credit Accounts Receivable`,
          student.boarding_house_id,
          1
        ]
      );
      
      // Create student_payments record
      await conn.query(
        `INSERT INTO student_payments (
          student_id,
          enrollment_id,
          transaction_id,
          amount,
          payment_date,
          payment_method,
          payment_type,
          reference_number,
          notes,
          created_by,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.student_id,
          student.enrollment_id,
          transactionId,
          payment.amount,
          payment.date,
          'cash_to_admin',
          'rent_payment',
          transactionRef,
          `Payment received from ${student.full_name}`,
          1,
          'completed'
        ]
      );
      
      createdCount++;
      totalCashInflow += payment.amount;
      
      console.log(`✅ ${student.full_name}: $${payment.amount} (${payment.date})`);
    }
    
    console.log(`\n✅ Created ${createdCount} student payment transactions`);
    console.log(`✅ Total cash inflow: $${totalCashInflow.toFixed(2)}`);
    
    // Final verification
    const [finalCashBalanceCheck] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10002'`
    );
    const [finalArBalanceCheck] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10005'`
    );
    
    console.log(`\nFinal Cash balance: $${finalCashBalanceCheck[0]?.current_balance || 0}`);
    console.log(`Final AR balance: $${finalArBalanceCheck[0]?.current_balance || 0}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

clearCashAndAddPayments();
