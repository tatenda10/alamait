const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

async function fixAllDates2025() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('📅 Fixing All Dates to 2025...\n');
    
    await connection.beginTransaction();
    
    // 1. Check current student payment transactions
    const [transactions] = await connection.query(
      `SELECT id, transaction_date, description, amount, boarding_house_id
       FROM transactions 
       WHERE transaction_type = 'student_payment' 
       ORDER BY created_at`
    );
    
    console.log('📋 Current Student Payment Transactions:');
    transactions.forEach(t => {
      console.log(`   ID ${t.id}: ${t.transaction_date} - ${t.description} - $${t.amount} (BH: ${t.boarding_house_id})`);
    });
    
    // 2. Check current enrollments
    const [enrollments] = await connection.query(
      `SELECT id, start_date, expected_end_date, boarding_house_id
       FROM student_enrollments 
       WHERE boarding_house_id IN (4, 5) 
       ORDER BY created_at LIMIT 10`
    );
    
    console.log('\n📚 Current Enrollments:');
    enrollments.forEach(e => {
      console.log(`   ID ${e.id}: ${e.start_date} to ${e.expected_end_date} (BH: ${e.boarding_house_id})`);
    });
    
    // 3. Fix student payment transactions to August 2025
    console.log('\n🔧 Fixing Student Payment Transactions to August 2025...');
    for (const transaction of transactions) {
      await connection.query(
        'UPDATE transactions SET transaction_date = ? WHERE id = ?',
        ['2025-08-20', transaction.id]
      );
      console.log(`   ✅ Updated transaction ${transaction.id} to 2025-08-20`);
    }
    
    // 4. Fix enrollments to September-December 2025
    console.log('\n🔧 Fixing Enrollments to September-December 2025...');
    await connection.query(
      'UPDATE student_enrollments SET start_date = ?, expected_end_date = ? WHERE boarding_house_id IN (4, 5)',
      ['2025-09-01', '2025-12-01']
    );
    console.log(`   ✅ Updated ${enrollments.length} enrollments to 2025-09-01 to 2025-12-01`);
    
    // 5. Fix payment schedules to 2025
    console.log('\n🔧 Fixing Payment Schedules to 2025...');
    await connection.query(
      `UPDATE student_payment_schedules 
       SET period_start_date = '2025-09-01', period_end_date = '2025-09-30' 
       WHERE period_start_date LIKE '2024-09%'`
    );
    
    await connection.query(
      `UPDATE student_payment_schedules 
       SET period_start_date = '2025-10-01', period_end_date = '2025-10-31' 
       WHERE period_start_date LIKE '2024-10%'`
    );
    
    await connection.query(
      `UPDATE student_payment_schedules 
       SET period_start_date = '2025-11-01', period_end_date = '2025-11-30' 
       WHERE period_start_date LIKE '2024-11%'`
    );
    
    console.log(`   ✅ Updated payment schedules to 2025`);
    
    // 6. Fix student payments to August 2025
    console.log('\n🔧 Fixing Student Payments to August 2025...');
    await connection.query(
      `UPDATE student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       SET sp.payment_date = '2025-08-15' 
       WHERE sp.payment_type = 'admin_fee' AND se.boarding_house_id IN (4, 5)`
    );
    
    await connection.query(
      `UPDATE student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       SET sp.payment_date = '2025-08-20' 
       WHERE sp.payment_type = 'monthly_rent' AND se.boarding_house_id IN (4, 5)`
    );
    
    await connection.query(
      `UPDATE student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       SET sp.payment_date = '2025-08-25' 
       WHERE sp.payment_type = 'advance' AND se.boarding_house_id IN (4, 5)`
    );
    
    console.log(`   ✅ Updated student payments to August 2025`);
    
    // 7. Fix petty cash transactions to August 2025
    console.log('\n🔧 Fixing Petty Cash Transactions to August 2025...');
    await connection.query(
      `UPDATE petty_cash_transactions 
       SET transaction_date = '2025-08-20' 
       WHERE transaction_type = 'student_payment' AND boarding_house_id IN (4, 5)`
    );
    
    console.log(`   ✅ Updated petty cash transactions to August 2025`);
    
    await connection.commit();
    
    // 8. Verify the fixes
    console.log('\n🔍 Verification:');
    
    const [updatedTransactions] = await connection.query(
      `SELECT id, transaction_date, description, amount, boarding_house_id
       FROM transactions 
       WHERE transaction_type = 'student_payment' 
       ORDER BY created_at`
    );
    
    console.log('\n📋 Updated Student Payment Transactions:');
    updatedTransactions.forEach(t => {
      console.log(`   ID ${t.id}: ${t.transaction_date} - ${t.description} - $${t.amount} (BH: ${t.boarding_house_id})`);
    });
    
    const [updatedEnrollments] = await connection.query(
      `SELECT id, start_date, expected_end_date, boarding_house_id
       FROM student_enrollments 
       WHERE boarding_house_id IN (4, 5) 
       ORDER BY created_at LIMIT 5`
    );
    
    console.log('\n📚 Updated Enrollments:');
    updatedEnrollments.forEach(e => {
      console.log(`   ID ${e.id}: ${e.start_date} to ${e.expected_end_date} (BH: ${e.boarding_house_id})`);
    });
    
    console.log('\n🎉 ALL DATES FIXED TO 2025!');
    console.log('📅 Summary:');
    console.log('   💰 Student Payments: August 2025');
    console.log('   📚 Enrollments: September-December 2025');
    console.log('   📅 Payment Schedules: Sep, Oct, Nov 2025');
    console.log('   💳 Petty Cash: August 2025');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error fixing dates:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  fixAllDates2025()
    .then(() => {
      console.log('\n✅ Date fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Date fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixAllDates2025 };
