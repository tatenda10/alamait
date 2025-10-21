const db = require('../src/services/db');

async function recreateStudentTransactions() {
  const conn = await db.getConnection();
  try {
    console.log('Removing and recreating student transactions from journal entries...\n');
    
    // Step 1: Remove all existing student payment transactions
    console.log('Step 1: Removing existing student payment transactions...');
    
    // Get all student payment transaction IDs
    const [studentPaymentTransactions] = await conn.query(`
      SELECT id FROM transactions 
      WHERE transaction_type = 'payment' 
        AND deleted_at IS NULL
    `);
    
    console.log(`Found ${studentPaymentTransactions.length} student payment transactions to remove`);
    
    if (studentPaymentTransactions.length > 0) {
      // Soft delete the journal entries first
      const transactionIds = studentPaymentTransactions.map(t => t.id);
      await conn.query(`
        UPDATE journal_entries 
        SET deleted_at = NOW() 
        WHERE transaction_id IN (${transactionIds.map(() => '?').join(',')})
      `, transactionIds);
      
      // Soft delete the transactions
      await conn.query(`
        UPDATE transactions 
        SET deleted_at = NOW() 
        WHERE id IN (${transactionIds.map(() => '?').join(',')})
      `, transactionIds);
      
      // Soft delete the student_payments
      await conn.query(`
        UPDATE student_payments 
        SET deleted_at = NOW() 
        WHERE transaction_id IN (${transactionIds.map(() => '?').join(',')})
      `, transactionIds);
      
      console.log('✅ Removed existing student payment transactions');
    }
    
    // Step 2: Find all journal entries that represent student payments
    console.log('\nStep 2: Finding student payment journal entries...');
    
    const [studentPaymentJournals] = await conn.query(`
      SELECT 
        je.transaction_id,
        je.account_id,
        je.entry_type,
        je.amount,
        je.description,
        t.transaction_type,
        t.reference,
        t.transaction_date,
        t.description as transaction_description,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.code = '10005'  -- Accounts Receivable
        AND je.entry_type = 'credit'  -- Credits to Accounts Receivable
        AND t.transaction_type IN ('initial_invoice', 'admin_fee', 'payment')
      ORDER BY t.transaction_date, t.id
    `);
    
    console.log(`Found ${studentPaymentJournals.length} journal entries for student payments`);
    
    // Group by transaction to understand the structure
    const transactionGroups = {};
    studentPaymentJournals.forEach(journal => {
      if (!transactionGroups[journal.transaction_id]) {
        transactionGroups[journal.transaction_id] = {
          transaction_id: journal.transaction_id,
          transaction_type: journal.transaction_type,
          reference: journal.reference,
          transaction_date: journal.transaction_date,
          transaction_description: journal.transaction_description,
          journals: []
        };
      }
      transactionGroups[journal.transaction_id].journals.push(journal);
    });
    
    console.log(`Found ${Object.keys(transactionGroups).length} unique transactions`);
    
    // Step 3: Create student transactions based on journal entries
    console.log('\nStep 3: Creating student transactions from journal entries...');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const [transactionId, transactionData] of Object.entries(transactionGroups)) {
      const { transaction_type, reference, transaction_date, transaction_description } = transactionData;
      
      // Only process payment transactions (not initial_invoice or admin_fee)
      if (transaction_type !== 'payment') {
        skippedCount++;
        continue;
      }
      
      // Find the corresponding debit entry (cash account)
      const debitJournal = transactionData.journals.find(j => 
        j.entry_type === 'debit' && 
        ['10001', '10002', '10003', '10004'].includes(j.account_code)
      );
      
      if (!debitJournal) {
        console.log(`❌ No debit entry found for transaction ${reference}`);
        skippedCount++;
        continue;
      }
      
      // Extract student name from transaction description
      const studentNameMatch = transaction_description.match(/Payment from (.+?)(?:\s|$)/);
      if (!studentNameMatch) {
        console.log(`❌ Could not extract student name from: ${transaction_description}`);
        skippedCount++;
        continue;
      }
      
      const studentName = studentNameMatch[1].trim();
      
      // Find student by name
      const [students] = await conn.query(`
        SELECT s.id, s.full_name, se.id as enrollment_id
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        WHERE LOWER(TRIM(s.full_name)) = LOWER(TRIM(?))
          AND s.deleted_at IS NULL
          AND se.deleted_at IS NULL
        ORDER BY se.created_at DESC
        LIMIT 1
      `, [studentName]);
      
      if (students.length === 0) {
        console.log(`❌ Student not found: ${studentName}`);
        skippedCount++;
        continue;
      }
      
      const student = students[0];
      const amount = parseFloat(debitJournal.amount);
      
      // Determine payment method based on debit account
      let paymentMethod = 'cash_to_admin';
      if (debitJournal.account_code === '10001') paymentMethod = 'cash_to_ba';
      else if (debitJournal.account_code === '10003') paymentMethod = 'bank';
      else if (debitJournal.account_code === '10004') paymentMethod = 'bank_transfer';
      
      // Create student_payments record
      await conn.query(`
        INSERT INTO student_payments (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        student.id,
        student.enrollment_id,
        parseInt(transactionId),
        amount,
        transaction_date,
        paymentMethod,
        'rent_payment',
        reference,
        `Payment from ${studentName}`,
        1, // System user
        'completed'
      ]);
      
      console.log(`✅ Created payment for ${studentName}: $${amount} (${paymentMethod})`);
      createdCount++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`✅ Created: ${createdCount} student transactions`);
    console.log(`❌ Skipped: ${skippedCount} transactions`);
    console.log(`📊 Total processed: ${createdCount + skippedCount}`);
    
    // Step 4: Recalculate account balances
    console.log('\nStep 4: Recalculating account balances...');
    const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');
    await recalculateAllAccountBalances();
    console.log('✅ Account balances recalculated');
    
    // Step 5: Verify the results
    console.log('\nStep 5: Verifying results...');
    const [finalCount] = await conn.query(`
      SELECT COUNT(*) as count FROM student_payments 
      WHERE deleted_at IS NULL
    `);
    
    console.log(`📊 Total student payments in database: ${finalCount[0].count}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

recreateStudentTransactions();

