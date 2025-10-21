const db = require('../src/services/db');

async function addStudentTransactions() {
  const conn = await db.getConnection();
  try {
    console.log('Adding student payment transactions to student_transactions table...\n');
    
    // Get all payment transactions that affect Accounts Receivable
    const [payments] = await conn.query(`
      SELECT 
        t.id as transaction_id,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.boarding_house_id,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_credit.code as credit_account_code
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      WHERE t.transaction_type = 'payment'
        AND t.deleted_at IS NULL
        AND coa_credit.code = '10005'  -- Credit to Accounts Receivable
        AND coa_debit.code IN ('10001', '10002', '10003', '10004')  -- Debit to cash accounts
      ORDER BY t.transaction_date
    `);
    
    console.log(`Found ${payments.length} payment transactions to process:\n`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const payment of payments) {
      console.log(`Processing: ${payment.reference} - $${payment.amount}`);
      
      // Extract student name from description
      const studentName = payment.description.replace('Payment from ', '');
      console.log(`  Student: ${studentName}`);
      
      // Find the student
      const [students] = await conn.query(
        'SELECT id, full_name, student_number FROM students WHERE full_name = ? AND deleted_at IS NULL',
        [studentName]
      );
      
      if (students.length === 0) {
        console.log(`  ❌ Student not found: ${studentName}`);
        skippedCount++;
        continue;
      }
      
      const student = students[0];
      console.log(`  ✅ Found student: ${student.full_name} (${student.student_number})`);
      
      // Check if this transaction already exists in student_transactions
      const [existing] = await conn.query(
        'SELECT id FROM student_transactions WHERE transaction_id = ? AND student_id = ?',
        [payment.transaction_id, student.id]
      );
      
      if (existing.length > 0) {
        console.log(`  ⏭️  Transaction already exists for this student`);
        skippedCount++;
        continue;
      }
      
      // Add to student_transactions
      await conn.query(
        `INSERT INTO student_transactions (
          student_id, 
          transaction_id, 
          amount, 
          transaction_type, 
          description, 
          transaction_date, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, 'payment', ?, ?, NOW(), NOW())`,
        [
          student.id,
          payment.transaction_id,
          payment.amount,
          payment.description,
          payment.transaction_date
        ]
      );
      
      console.log(`  ✅ Added to student_transactions`);
      addedCount++;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`SUMMARY:`);
    console.log(`✅ Added: ${addedCount} transactions`);
    console.log(`⏭️  Skipped: ${skippedCount} transactions`);
    console.log(`📊 Total processed: ${payments.length} transactions`);
    
    // Verify the additions
    console.log('\nVerifying student_transactions table...');
    const [totalStudentTransactions] = await conn.query(
      'SELECT COUNT(*) as count FROM student_transactions WHERE transaction_type = "payment"'
    );
    console.log(`Total student payment transactions: ${totalStudentTransactions[0].count}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

addStudentTransactions();


