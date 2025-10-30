const mysql = require('mysql2/promise');
require('dotenv').config();

async function correctTanakaRent() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();
    console.log('\n=== CORRECTING TANAKA MATEMATEMA RENT ===\n');

    const studentName = 'Tanaka Matematema';
    const oldRentAmount = 220;
    const newRentAmount = 180;
    const adminFee = 20;
    const oldTotalAmount = oldRentAmount + adminFee; // 240
    const newTotalAmount = newRentAmount + adminFee; // 200
    const difference = oldTotalAmount - newTotalAmount; // 40

    console.log('Old Invoice: Rent $220 + Admin $20 = $240');
    console.log('New Invoice: Rent $180 + Admin $20 = $200');
    console.log('Difference: $40\n');

    // 1. Find the student
    const [students] = await connection.query(
      `SELECT id, student_id, full_name FROM students WHERE full_name = ?`,
      [studentName]
    );

    if (students.length === 0) {
      throw new Error('Student not found');
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.full_name} (ID: ${student.id})`);

    // 2. Find the October invoice from transactions (student_invoices doesn't have detailed breakdown)
    // The invoice is in transactions table with type 'monthly_invoice'
    const [invoiceTransactions] = await connection.query(
      `SELECT * FROM transactions 
       WHERE student_id = ? 
       AND transaction_type = 'monthly_invoice'
       AND transaction_date >= '2025-10-29'
       AND transaction_date < '2025-11-01'
       AND amount = ?
       ORDER BY id DESC 
       LIMIT 1`,
      [student.id, oldTotalAmount]
    );

    if (invoiceTransactions.length === 0) {
      throw new Error('October invoice transaction not found');
    }

    const invoiceTxn = invoiceTransactions[0];
    console.log(`✅ Found invoice transaction ID: ${invoiceTxn.id}`);
    console.log(`   Current amount: $${invoiceTxn.amount}`);

    // 3. Update the transaction amount
    await connection.query(
      `UPDATE transactions 
       SET amount = ?,
           description = REPLACE(REPLACE(description, 'Rent: $220', 'Rent: $180'), '$240', '$200')
       WHERE id = ?`,
      [newTotalAmount, invoiceTxn.id]
    );
    console.log(`✅ Updated transaction: $${oldTotalAmount} → $${newTotalAmount}`);


    // 4. Find and update journal entries
    // Find the Accounts Receivable debit entry (the invoice creates a debit to A/R)
    const [arEntries] = await connection.query(
      `SELECT je.* FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE je.entry_type = 'debit'
       AND je.account_id = 11001
       AND je.amount = ?
       AND DATE(t.transaction_date) >= '2025-10-29'
       AND je.description LIKE ?
       ORDER BY je.id DESC
       LIMIT 1`,
      [oldTotalAmount, `%${studentName}%`]
    );

    if (arEntries.length > 0) {
      const arEntry = arEntries[0];
      await connection.query(
        `UPDATE journal_entries 
         SET amount = ?
         WHERE id = ?`,
        [newTotalAmount, arEntry.id]
      );
      console.log(`✅ Updated A/R journal entry ID ${arEntry.id}: $${oldTotalAmount} → $${newTotalAmount}`);
    }

    // Find the Rental Income credit entry
    const [revenueEntries] = await connection.query(
      `SELECT je.* FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE je.entry_type = 'credit'
       AND je.account_id = 40001
       AND je.amount = ?
       AND DATE(t.transaction_date) >= '2025-10-29'
       AND je.description LIKE ?
       ORDER BY je.id DESC
       LIMIT 1`,
      [oldRentAmount, `%${studentName}%`]
    );

    if (revenueEntries.length > 0) {
      const revenueEntry = revenueEntries[0];
      await connection.query(
        `UPDATE journal_entries 
         SET amount = ?
         WHERE id = ?`,
        [newRentAmount, revenueEntry.id]
      );
      console.log(`✅ Updated Rental Income journal entry ID ${revenueEntry.id}: $${oldRentAmount} → $${newRentAmount}`);
    }

    // 5. Update student account balance
    const [balances] = await connection.query(
      `SELECT * FROM student_account_balances 
       WHERE student_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      [student.id]
    );

    if (balances.length > 0) {
      const balance = balances[0];
      const currentBalance = parseFloat(balance.current_balance);
      const newBalance = currentBalance + difference; // -20 + 40 = +20
      
      await connection.query(
        `UPDATE student_account_balances 
         SET current_balance = ?
         WHERE id = ?`,
        [newBalance, balance.id]
      );
      console.log(`✅ Updated student balance: $${currentBalance} → $${newBalance}`);
      console.log(`   (Student now has a credit of $${newBalance})`);
    }

    // 6. Update COA balances
    // Decrease Accounts Receivable by $40 (was overstated)
    const [arBalance] = await connection.query(
      `SELECT * FROM current_account_balances WHERE account_id = 11001`
    );
    
    if (arBalance.length > 0) {
      const currentAR = parseFloat(arBalance[0].balance);
      const newAR = currentAR - difference; // Reduce by 40
      
      await connection.query(
        `UPDATE current_account_balances 
         SET balance = ?
         WHERE account_id = 11001`,
        [newAR]
      );
      console.log(`✅ Updated Accounts Receivable COA: $${currentAR} → $${newAR}`);
    }

    // Decrease Rental Income by $40 (was overstated)
    const [revenueBalance] = await connection.query(
      `SELECT * FROM current_account_balances WHERE account_id = 40001`
    );
    
    if (revenueBalance.length > 0) {
      const currentRevenue = parseFloat(revenueBalance[0].balance);
      const newRevenue = currentRevenue - difference; // Reduce by 40
      
      await connection.query(
        `UPDATE current_account_balances 
         SET balance = ?
         WHERE account_id = 40001`,
        [newRevenue]
      );
      console.log(`✅ Updated Rental Income COA: $${currentRevenue} → $${newRevenue}`);
    }

    // 7. Update the enrollment record for future months
    const [enrollments] = await connection.query(
      `SELECT * FROM student_enrollments 
       WHERE student_id = ? 
       AND deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [student.id]
    );

    if (enrollments.length > 0) {
      const enrollment = enrollments[0];
      await connection.query(
        `UPDATE student_enrollments 
         SET agreed_amount = ?
         WHERE id = ?`,
        [newRentAmount, enrollment.id]
      );
      console.log(`✅ Updated enrollment agreed_amount: $${oldRentAmount} → $${newRentAmount}`);
      console.log(`   (Future invoices will use $${newRentAmount})`);
    }

    await connection.commit();
    
    console.log('\n✅ ALL CORRECTIONS COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log('- Invoice updated: $240 → $200');
    console.log('- Student balance: -$20 → +$20 (has credit)');
    console.log('- Payment remains: $220 (correct)');
    console.log('- Future rent: $180/month');
    console.log('- Student has $20 credit for next month\n');

    await connection.end();
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

correctTanakaRent();

