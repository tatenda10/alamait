const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait_db',
  port: process.env.DB_PORT || 3306
};

// Payment reconciliation data from your ledger
const paymentData = [
  { name: 'Anita Gwenda', room: 'Ext 2', rent: 160.00, adminFee: 20.00, paid: 200.00, balance: 20.00, advance: null },
  { name: 'Lillian Chatikobo', room: 'M4', rent: 180.00, adminFee: 20.00, paid: 180.00, balance: 20.00, advance: null },
  { name: 'Sharon Matanha', room: 'M7', rent: 98.00, adminFee: 20.00, paid: 298.00, balance: null, advance: null },
  { name: 'Bellis Mapetere', room: 'M1', rent: 180.00, adminFee: 20.00, paid: 180.00, balance: 20.00, advance: null },
  { name: 'Tatenda Kamatando', room: 'EXT 1', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: 180.00 },
  { name: 'Fay Mubaiwa', room: 'M8', rent: 160.00, adminFee: 20.00, paid: 170.00, balance: 10.00, advance: null },
  { name: 'Tanyaradzwa Manife', room: 'Bus 2', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: null },
  { name: 'Christine Mutsikwa', room: 'Bus 1', rent: 160.00, adminFee: 20.00, paid: 180.00, balance: null, advance: null },
  { name: 'Bertha Mwangu', room: 'Bus 2', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: null },
  { name: 'Merrylin Makunzva', room: 'M5', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: null },
  { name: 'Shantell Mawarira', room: 'M5', rent: 180.00, adminFee: 20.00, paid: 50.00, balance: 150.00, advance: null },
  { name: 'Salina Saidi', room: 'M8', rent: 170.00, adminFee: 20.00, paid: 40.00, balance: 150.00, advance: null },
  { name: 'Tinotenda Bwangangwanyo', room: 'M2', rent: 170.00, adminFee: 20.00, paid: 80.00, balance: 110.00, advance: null },
  { name: 'Kimberly Nkomo', room: 'M2', rent: 170.00, adminFee: 20.00, paid: 100.00, balance: 90.00, advance: null },
  { name: 'Kimberly Mutowembwa', room: 'M4', rent: 180.00, adminFee: 20.00, paid: 200.00, balance: null, advance: null },
  { name: 'Alicia Matamuko', room: 'M6', rent: 180.00, adminFee: 20.00, paid: 50.00, balance: 150.00, advance: null },
  { name: 'L Moyo', room: 'M7', rent: 180.00, adminFee: 20.00, paid: 52.00, balance: 148.00, advance: null }
];

// Payment dates in August 2024
const paymentDates = {
  adminFee: '2024-08-15',      // Admin fees paid in mid-August
  firstRent: '2024-08-20',     // First month rent paid in late August
  advance: '2024-08-25'        // Advance payments made in late August
};

async function reconcileStudentPayments() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔄 Starting payment reconciliation...');
    console.log(`👥 Processing ${paymentData.length} students`);
    
    // Set boarding house ID
    const boardingHouseId = 4;
    
    await connection.beginTransaction();
    
    for (let i = 0; i < paymentData.length; i++) {
      const student = paymentData[i];
      console.log(`\n📝 Processing ${i + 1}/17: ${student.name}`);
      
      // Find the student
      const [students] = await connection.query(
        'SELECT id, full_name FROM students WHERE full_name = ? AND deleted_at IS NULL',
        [student.name]
      );
      
      if (students.length === 0) {
        console.log(`   ⚠️  Student not found: ${student.name}`);
        continue;
      }
      
      const studentId = students[0].id;
      console.log(`   ✅ Found student (ID: ${studentId})`);
      
      // Get enrollment
      const [enrollments] = await connection.query(
        `SELECT se.*, r.name as room_name 
         FROM student_enrollments se 
         JOIN rooms r ON se.room_id = r.id 
         WHERE se.student_id = ? AND se.deleted_at IS NULL`,
        [studentId]
      );
      
      if (enrollments.length === 0) {
        console.log(`   ⚠️  No enrollment found for ${student.name}`);
        continue;
      }
      
      const enrollment = enrollments[0];
      console.log(`   ✅ Found enrollment (ID: ${enrollment.id}) in room ${enrollment.room_name}`);
      
      // Calculate expected payments
      const totalDue = student.rent + student.adminFee; // Rent + Admin Fee
      const paidAmount = student.paid;
      const balance = student.balance || 0;
      const advance = student.advance || 0;
      
      console.log(`   💰 Financial Summary:`);
      console.log(`      Rent: $${student.rent}`);
      console.log(`      Admin Fee: $${student.adminFee}`);
      console.log(`      Total Due: $${totalDue}`);
      console.log(`      Paid: $${paidAmount}`);
      console.log(`      Balance: $${balance}`);
      console.log(`      Advance: $${advance}`);
      
      // Verify payment calculation
      const expectedBalance = totalDue - paidAmount;
      if (Math.abs(expectedBalance - balance) > 0.01) {
        console.log(`   ⚠️  Balance mismatch! Expected: $${expectedBalance}, Ledger: $${balance}`);
      }
      
      // Update payment schedules based on actual payments
      const [schedules] = await connection.query(
        'SELECT * FROM student_payment_schedules WHERE enrollment_id = ? ORDER BY period_start_date',
        [enrollment.id]
      );
      
      if (schedules.length > 0) {
        // Update first schedule with actual payment
        const firstSchedule = schedules[0];
        const rentPayment = Math.min(paidAmount - student.adminFee, student.rent);
        
        await connection.query(
          `UPDATE student_payment_schedules 
           SET amount_paid = ?, status = ? 
           WHERE id = ?`,
          [
            rentPayment,
            rentPayment >= firstSchedule.amount_due ? 'paid' : 'partial',
            firstSchedule.id
          ]
        );
        
        console.log(`   ✅ Updated payment schedule: $${rentPayment} paid for first period`);
        
        // If there's an advance, apply it to the first period (September) and handle overpayment
        if (advance > 0) {
          const firstSchedule = schedules[0];
          const advanceToApply = Math.min(advance, firstSchedule.amount_due);
          
          await connection.query(
            `UPDATE student_payment_schedules 
             SET amount_paid = amount_paid + ?, status = ? 
             WHERE id = ?`,
            [
              advanceToApply,
              (firstSchedule.amount_paid + advanceToApply) >= firstSchedule.amount_due ? 'paid' : 'partial',
              firstSchedule.id
            ]
          );
          
          console.log(`   ✅ Applied $${advanceToApply} advance to September schedule`);
          
          // Handle overpayment - move remainder to next schedule
          const totalPaymentToFirstMonth = rentPayment + advanceToApply;
          const firstMonthRent = firstSchedule.amount_due;
          
          if (totalPaymentToFirstMonth > firstMonthRent) {
            const overpayment = totalPaymentToFirstMonth - firstMonthRent;
            console.log(`   💰 Overpayment detected: $${overpayment} - Moving to October schedule`);
            
            // Get the October schedule (second schedule)
            const octoberSchedule = schedules[1];
            if (octoberSchedule) {
              await connection.query(
                `UPDATE student_payment_schedules 
                 SET amount_paid = amount_paid + ?, 
                     status = CASE 
                       WHEN amount_paid + ? >= amount_due THEN 'paid'
                       ELSE 'partial'
                     END
                 WHERE id = ?`,
                [overpayment, overpayment, octoberSchedule.id]
              );
              
              console.log(`   ✅ Applied $${overpayment} overpayment to October schedule`);
            }
          }
        }
      }
      
      // Create accounting transactions for cash payments
      if (paidAmount > 0) {
        // Create main transaction with August date
        const [transactionResult] = await connection.query(
          `INSERT INTO transactions (
            transaction_type, amount, description, reference_number, 
            boarding_house_id, created_by, created_at, transaction_date
          ) VALUES (?, ?, ?, ?, ?, 1, NOW(), ?)`,
          [
            'student_payment',
            paidAmount,
            `Student payment - ${student.name}`,
            `STU-PAY-${studentId}-AUG`,
            boardingHouseId,
            paymentDates.firstRent // Use August 20 as the transaction date
          ]
        );
        
        const transactionId = transactionResult.insertId;
        
        // Get boarding house ID
        const [boardingHouse] = await connection.query(
          'SELECT boarding_house_id FROM student_enrollments WHERE id = ?',
          [enrollment.id]
        );
        
        const boardingHouseId = boardingHouse[0].boarding_house_id;
        
        // Debit: Cash on Hand (10002)
        await connection.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, (SELECT id FROM chart_of_accounts_branch WHERE code = '10002' AND branch_id = ? LIMIT 1), 'debit', ?, ?, ?, 1, NOW())`,
          [transactionId, boardingHouseId, paidAmount, `Cash received from ${student.name}`]
        );
        
        // Credit: Student Revenue (40001)
        await connection.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, (SELECT id FROM chart_of_accounts_branch WHERE code = '40001' AND branch_id = ? LIMIT 1), 'credit', ?, ?, ?, 1, NOW())`,
          [transactionId, boardingHouseId, paidAmount, `Revenue from ${student.name}`]
        );
        
        // Update account balances
        await connection.query(
          `INSERT INTO current_account_balances (account_id, boarding_house_id, current_balance, created_at)
           VALUES ((SELECT id FROM chart_of_accounts_branch WHERE code = '10002' AND branch_id = ? LIMIT 1), ?, ?, NOW())
           ON DUPLICATE KEY UPDATE current_balance = current_balance + ?`,
          [boardingHouseId, boardingHouseId, paidAmount, paidAmount]
        );
        
        await connection.query(
          `INSERT INTO current_account_balances (account_id, boarding_house_id, current_balance, created_at)
           VALUES ((SELECT id FROM chart_of_accounts_branch WHERE code = '40001' AND branch_id = ? LIMIT 1), ?, ?, NOW())
           ON DUPLICATE KEY UPDATE current_balance = current_balance + ?`,
          [boardingHouseId, boardingHouseId, paidAmount, paidAmount]
        );
        
        console.log(`   ✅ Created accounting transaction for $${paidAmount}`);
      }
      
      console.log(`   ✅ ${student.name} payment reconciliation completed`);
    }
    
    await connection.commit();
    
    console.log('\n🎉 PAYMENT RECONCILIATION COMPLETED!');
    console.log('📊 All student payments have been properly recorded with double-entry accounting');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error during payment reconciliation:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  reconcileStudentPayments()
    .then(() => {
      console.log('\n✅ Payment reconciliation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Payment reconciliation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { reconcileStudentPayments };
