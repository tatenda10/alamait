const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { updateAccountBalance } = require('../src/services/accountBalanceService');

async function removePreviousBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    console.log('🔍 Finding Christine Mutsikwa...\n');
    
    // Find student
    const [students] = await connection.query(
      `SELECT id, full_name, student_number 
       FROM students 
       WHERE full_name LIKE '%Christine%Mutsikwa%' OR full_name LIKE '%Mutsikwa%Christine%'
       AND deleted_at IS NULL`
    );

    if (students.length === 0) {
      console.log('❌ Student not found. Searching for student_id 143...');
      const [studentById] = await connection.query(
        `SELECT id, full_name, student_number 
         FROM students 
         WHERE id = 143 AND deleted_at IS NULL`
      );
      if (studentById.length === 0) {
        throw new Error('Student not found');
      }
      students.push(studentById[0]);
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.full_name} (ID: ${student.id})\n`);

    // Find the previous balance transaction
    console.log('🔍 Finding previous balance transaction...\n');
    const [transactions] = await connection.query(
      `SELECT id, student_id, amount, reference, description, 
              transaction_date, boarding_house_id, created_at
       FROM transactions 
       WHERE student_id = ? 
         AND transaction_type = 'previous_balance'
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 10`,
      [student.id]
    );

    if (transactions.length === 0) {
      throw new Error('No previous balance transactions found for this student');
    }

    console.log(`Found ${transactions.length} previous balance transaction(s):\n`);
    transactions.forEach((t, idx) => {
      console.log(`${idx + 1}. Transaction ID: ${t.id}`);
      console.log(`   Amount: ${t.amount}`);
      console.log(`   Reference: ${t.reference}`);
      console.log(`   Date: ${t.transaction_date}`);
      console.log(`   Description: ${t.description}\n`);
    });

    // Use the most recent one (or you can modify to select a specific one)
    const transaction = transactions[0];
    console.log(`📝 Processing transaction ID: ${transaction.id}\n`);

    // Get enrollment_id from student_invoices or student_account_balances
    let enrollment_id = null;
    
    // Try to get from student_invoices first
    const [invoicesForTransaction] = await connection.query(
      `SELECT enrollment_id FROM student_invoices 
       WHERE student_id = ? 
         AND description LIKE '%Previous balance%'
         AND deleted_at IS NULL
         AND created_at BETWEEN DATE_SUB(?, INTERVAL 5 MINUTE) AND DATE_ADD(?, INTERVAL 5 MINUTE)
       ORDER BY created_at DESC
       LIMIT 1`,
      [student.id, transaction.created_at, transaction.created_at]
    );
    
    if (invoicesForTransaction.length > 0) {
      enrollment_id = invoicesForTransaction[0].enrollment_id;
    } else {
      // Try to get from student_account_balances (most recent)
      const [balances] = await connection.query(
        `SELECT enrollment_id FROM student_account_balances 
         WHERE student_id = ? 
         ORDER BY updated_at DESC
         LIMIT 1`,
        [student.id]
      );
      if (balances.length > 0) {
        enrollment_id = balances[0].enrollment_id;
      }
    }

    if (!enrollment_id) {
      throw new Error('Could not determine enrollment_id. Please check the transaction manually.');
    }

    console.log(`📋 Found enrollment_id: ${enrollment_id}\n`);

    // Get all journal entries for this transaction
    const [journalEntries] = await connection.query(
      `SELECT je.id, je.transaction_id, je.account_id, je.entry_type, je.amount, 
              je.description, je.boarding_house_id,
              coa.code as account_code, coa.name as account_name, coa.type as account_type
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE je.transaction_id = ? AND je.deleted_at IS NULL`,
      [transaction.id]
    );

    if (journalEntries.length === 0) {
      throw new Error('No journal entries found for this transaction');
    }

    console.log(`📋 Found ${journalEntries.length} journal entries:\n`);
    journalEntries.forEach((je, idx) => {
      console.log(`${idx + 1}. Account: ${je.account_code} - ${je.account_name}`);
      console.log(`   Entry Type: ${je.entry_type}`);
      console.log(`   Amount: ${je.amount}\n`);
    });

    // Reverse account balances
    console.log('🔄 Reversing account balances...\n');
    for (const je of journalEntries) {
      const reverseEntryType = je.entry_type === 'debit' ? 'credit' : 'debit';
      console.log(`Reversing ${je.account_code} (${je.account_name}): ${je.entry_type} ${je.amount} -> ${reverseEntryType} ${je.amount}`);
      
      await updateAccountBalance(
        je.account_id,
        je.amount,
        reverseEntryType,
        je.boarding_house_id,
        connection
      );
    }

    // Reverse student account balance
    console.log('\n🔄 Reversing student account balance...\n');
    if (enrollment_id) {
      // Get journal entries to determine the balance change direction
      const receivableEntry = journalEntries.find(je => je.account_code === '10005');
      if (receivableEntry) {
        // Determine original balance_type from journal entries
        // If Accounts Receivable was debited, it was a debit balance (student owes)
        // If Accounts Receivable was credited, it was a credit balance (student prepaid)
        const originalBalanceType = receivableEntry.entry_type === 'debit' ? 'debit' : 'credit';
        
        // Original logic:
        // - Debit: current_balance = current_balance - amount (made it more negative)
        // - Credit: current_balance = current_balance + amount (made it more positive)
        // To reverse:
        // - If original was debit: add the amount back (make it less negative)
        // - If original was credit: subtract the amount back (make it less positive)
        const balanceChange = originalBalanceType === 'debit' 
          ? transaction.amount  // Reverse: add back (was subtracted)
          : -transaction.amount; // Reverse: subtract back (was added)

        // Check if student_account_balances record exists
        const [existingBalance] = await connection.query(
          `SELECT current_balance FROM student_account_balances 
           WHERE student_id = ? AND enrollment_id = ?`,
          [transaction.student_id, enrollment_id]
        );

        if (existingBalance.length > 0) {
          const oldBalance = existingBalance[0].current_balance;
          await connection.query(
            `UPDATE student_account_balances 
             SET current_balance = current_balance + ?,
                 updated_at = NOW()
             WHERE student_id = ? AND enrollment_id = ?`,
            [balanceChange, transaction.student_id, enrollment_id]
          );
          
          const [newBalance] = await connection.query(
            `SELECT current_balance FROM student_account_balances 
             WHERE student_id = ? AND enrollment_id = ?`,
            [transaction.student_id, enrollment_id]
          );
          
          console.log(`✅ Updated student account balance: ${oldBalance} -> ${newBalance[0].current_balance}`);
        } else {
          console.log(`⚠️  No student account balance record found to update`);
        }
      }
    }

    // Delete student invoice if it exists
    console.log('\n🗑️  Removing student invoice...\n');
    const [invoices] = await connection.query(
      `SELECT id FROM student_invoices 
       WHERE student_id = ? 
         AND enrollment_id = ?
         AND description LIKE '%Previous balance%'
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [transaction.student_id, enrollment_id]
    );

    if (invoices.length > 0) {
      await connection.query(
        `UPDATE student_invoices 
         SET deleted_at = NOW() 
         WHERE id = ?`,
        [invoices[0].id]
      );
      console.log(`✅ Soft-deleted student invoice ID: ${invoices[0].id}`);
    } else {
      console.log(`ℹ️  No student invoice found to delete`);
    }

    // Soft-delete journal entries
    console.log('\n🗑️  Soft-deleting journal entries...\n');
    const [deleteJournals] = await connection.query(
      `UPDATE journal_entries 
       SET deleted_at = NOW() 
       WHERE transaction_id = ? AND deleted_at IS NULL`,
      [transaction.id]
    );
    console.log(`✅ Soft-deleted ${deleteJournals.affectedRows} journal entries`);

    // Soft-delete transaction
    console.log('\n🗑️  Soft-deleting transaction...\n');
    const [deleteTransaction] = await connection.query(
      `UPDATE transactions 
       SET deleted_at = NOW() 
       WHERE id = ? AND deleted_at IS NULL`,
      [transaction.id]
    );
    console.log(`✅ Soft-deleted transaction ID: ${transaction.id}`);

    await connection.commit();
    
    console.log('\n✅ Successfully removed previous balance entry and reversed all changes!\n');
    console.log('Summary:');
    console.log(`- Transaction ID: ${transaction.id}`);
    console.log(`- Amount: ${transaction.amount}`);
    console.log(`- Journal entries reversed: ${journalEntries.length}`);
    console.log(`- Student: ${student.full_name}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

// Run the script
removePreviousBalance();

