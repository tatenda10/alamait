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

async function verifyBelvedereRegistrations() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Verifying Belvedere student registrations...\n');
    
    const boardingHouseId = 5; // Belvedere
    
    // 1. Check total students registered
    const [studentCount] = await connection.query(
      'SELECT COUNT(*) as count FROM students WHERE boarding_house_id = ? AND deleted_at IS NULL',
      [boardingHouseId]
    );
    console.log(`👥 Total Students Registered: ${studentCount[0].count}`);
    
    // 2. Check enrollments
    const [enrollmentCount] = await connection.query(
      'SELECT COUNT(*) as count FROM student_enrollments WHERE boarding_house_id = ? AND deleted_at IS NULL',
      [boardingHouseId]
    );
    console.log(`📚 Total Enrollments: ${enrollmentCount[0].count}`);
    
    // 3. Check room assignments
    const [roomAssignments] = await connection.query(
      `SELECT r.name as room_name, COUNT(se.id) as student_count
       FROM rooms r
       LEFT JOIN student_enrollments se ON r.id = se.room_id AND se.deleted_at IS NULL
       WHERE r.boarding_house_id = ? AND r.deleted_at IS NULL
       GROUP BY r.id, r.name
       ORDER BY r.name`,
      [boardingHouseId]
    );
    
    console.log('\n🏠 Room Assignments:');
    roomAssignments.forEach(room => {
      console.log(`   ${room.room_name}: ${room.student_count} student(s)`);
    });
    
    // 4. Check payment schedules
    const [scheduleCount] = await connection.query(
      'SELECT COUNT(*) as count FROM student_payment_schedules WHERE deleted_at IS NULL'
    );
    console.log(`\n📅 Payment Schedules Created: ${scheduleCount[0].count} (3 months per student)`);
    
    // 5. Check payments made
    const [paymentCount] = await connection.query(
      'SELECT COUNT(*) as count FROM student_payments WHERE deleted_at IS NULL'
    );
    console.log(`💰 Payments Recorded: ${paymentCount[0].count}`);
    
    // 6. Check petty cash status
    const [pettyCashStatus] = await connection.query(
      'SELECT * FROM petty_cash_accounts WHERE boarding_house_id = ?',
      [boardingHouseId]
    );
    
    if (pettyCashStatus.length > 0) {
      const account = pettyCashStatus[0];
      console.log(`\n💰 Belvedere Petty Cash Status:`);
      console.log(`   Current Balance: $${account.current_balance}`);
      console.log(`   Total Inflows: $${account.total_inflows}`);
      console.log(`   Total Outflows: $${account.total_outflows}`);
    }
    
    // 7. Detailed student list with financial status
    const [studentDetails] = await connection.query(
      `SELECT 
        s.id, s.full_name, r.name as room_name,
        se.agreed_amount, se.admin_fee,
        COALESCE(SUM(sp.amount), 0) as total_paid,
        (se.agreed_amount + se.admin_fee) as total_due,
        ((se.agreed_amount + se.admin_fee) - COALESCE(SUM(sp.amount), 0)) as balance
       FROM students s
       JOIN student_enrollments se ON s.id = se.student_id
       JOIN rooms r ON se.room_id = r.id
       LEFT JOIN student_payments sp ON s.id = sp.student_id AND sp.deleted_at IS NULL
       WHERE s.boarding_house_id = ? AND se.deleted_at IS NULL
       GROUP BY s.id, s.full_name, r.name, se.agreed_amount, se.admin_fee
       ORDER BY s.full_name`,
      [boardingHouseId]
    );
    
    console.log('\n📋 Detailed Student Financial Status:');
    console.log('┌─────┬─────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐');
    console.log('│ ID  │ Name                │ Room    │ Rent    │ Admin   │ Paid    │ Balance │');
    console.log('├─────┼─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤');
    
    studentDetails.forEach(student => {
      const id = String(student.id).padEnd(3);
      const name = student.full_name.padEnd(19);
      const room = student.room_name.padEnd(7);
      const rent = `$${student.agreed_amount}`.padEnd(7);
      const admin = `$${student.admin_fee}`.padEnd(7);
      const paid = `$${student.total_paid.toFixed(2)}`.padEnd(7);
      const balance = `$${student.balance.toFixed(2)}`.padEnd(7);
      
      console.log(`│ ${id} │ ${name} │ ${room} │ ${rent} │ ${admin} │ ${paid} │ ${balance} │`);
    });
    
    console.log('└─────┴─────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘');
    
    // 8. Check petty cash transactions
    const [pettyCashTransactions] = await connection.query(
      `SELECT * FROM petty_cash_transactions 
       WHERE boarding_house_id = ? AND transaction_type = 'student_payment'
       ORDER BY created_at DESC LIMIT 5`,
      [boardingHouseId]
    );
    
    console.log('\n💰 Recent Petty Cash Transactions:');
    pettyCashTransactions.forEach(transaction => {
      console.log(`   ${transaction.transaction_date}: ${transaction.description} - $${transaction.amount}`);
    });
    
    // 9. Summary statistics
    const totalRevenue = studentDetails.reduce((sum, student) => sum + student.total_paid, 0);
    const totalDue = studentDetails.reduce((sum, student) => sum + student.total_due, 0);
    const totalBalance = studentDetails.reduce((sum, student) => sum + student.balance, 0);
    
    console.log('\n📊 Summary Statistics:');
    console.log(`   Total Revenue Collected: $${totalRevenue.toFixed(2)}`);
    console.log(`   Total Amount Due: $${totalDue.toFixed(2)}`);
    console.log(`   Outstanding Balance: $${totalBalance.toFixed(2)}`);
    console.log(`   Collection Rate: ${((totalRevenue / totalDue) * 100).toFixed(1)}%`);
    
    console.log('\n✅ Belvedere verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  verifyBelvedereRegistrations()
    .then(() => {
      console.log('\n✅ Verification completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = { verifyBelvedereRegistrations };
