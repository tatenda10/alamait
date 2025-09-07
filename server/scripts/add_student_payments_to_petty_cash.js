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

async function addStudentPaymentsToPettyCash() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('💰 Adding student payments to St Kilda petty cash...\n');
    
    const boardingHouseId = 4; // St Kilda
    
    // 1. Check current petty cash account status
    const [pettyCashAccounts] = await connection.query(
      'SELECT * FROM petty_cash_accounts WHERE boarding_house_id = ?',
      [boardingHouseId]
    );
    
    if (pettyCashAccounts.length === 0) {
      console.log('🏗️  Creating petty cash account for St Kilda...');
      await connection.query(
        `INSERT INTO petty_cash_accounts (
          boarding_house_id, current_balance, beginning_balance, 
          total_inflows, total_outflows, created_at
        ) VALUES (?, 0.00, 0.00, 0.00, 0.00, NOW())`,
        [boardingHouseId]
      );
      console.log('✅ Petty cash account created for St Kilda');
    } else {
      console.log('📊 Current petty cash status:');
      const account = pettyCashAccounts[0];
      console.log(`   Current Balance: $${account.current_balance}`);
      console.log(`   Total Inflows: $${account.total_inflows}`);
      console.log(`   Total Outflows: $${account.total_outflows}`);
    }
    
    // 2. Get all student payments that need to be added to petty cash
    const [studentPayments] = await connection.query(
      `SELECT 
        sp.id, sp.student_id, sp.amount, sp.payment_date, sp.payment_type,
        sp.reference_number, s.full_name, sp.created_at
       FROM student_payments sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.deleted_at IS NULL
       ORDER BY sp.student_id, sp.payment_type`
    );
    
    console.log(`\n📋 Found ${studentPayments.length} student payments to process:`);
    
    let totalAmountToAdd = 0;
    const paymentsByStudent = {};
    
    // Group payments by student
    studentPayments.forEach(payment => {
      if (!paymentsByStudent[payment.student_id]) {
        paymentsByStudent[payment.student_id] = {
          name: payment.full_name,
          payments: []
        };
      }
      paymentsByStudent[payment.student_id].payments.push(payment);
      totalAmountToAdd += parseFloat(payment.amount);
    });
    
    // Display payment summary
    Object.entries(paymentsByStudent).forEach(([studentId, data]) => {
      console.log(`\n👤 ${data.name} (ID: ${studentId}):`);
      data.payments.forEach(payment => {
        console.log(`   ${payment.payment_type}: $${payment.amount} (${payment.payment_date})`);
      });
    });
    
    console.log(`\n💰 Total amount to add to petty cash: $${totalAmountToAdd.toFixed(2)}`);
    
    // 3. Add student payments to petty cash
    await connection.beginTransaction();
    
    try {
      // Create petty cash transaction for total student payments
      const [transactionResult] = await connection.query(
        `INSERT INTO petty_cash_transactions (
          boarding_house_id, transaction_type, amount, description, 
          reference_number, notes, transaction_date, created_by, created_at
        ) VALUES (?, 'student_payment', ?, ?, ?, ?, ?, 1, NOW())`,
        [
          boardingHouseId,
          totalAmountToAdd,
          `Student payments - ${Object.keys(paymentsByStudent).length} students`,
          `STU-PAYMENTS-${Date.now()}`,
          `Total from ${Object.keys(paymentsByStudent).length} students`,
          '2024-08-20' // Use August 20 as the transaction date
        ]
      );
      
      console.log(`✅ Created petty cash transaction (ID: ${transactionResult.insertId})`);
      
      // Update petty cash account balance
      await connection.query(
        `UPDATE petty_cash_accounts 
         SET current_balance = current_balance + ?,
             total_inflows = total_inflows + ?,
             updated_at = NOW()
         WHERE boarding_house_id = ?`,
        [totalAmountToAdd, totalAmountToAdd, boardingHouseId]
      );
      
      console.log(`✅ Updated petty cash account balance (+$${totalAmountToAdd.toFixed(2)})`);
      
      await connection.commit();
      
      // 4. Verify final petty cash status
      const [finalStatus] = await connection.query(
        'SELECT * FROM petty_cash_accounts WHERE boarding_house_id = ?',
        [boardingHouseId]
      );
      
      console.log('\n🎉 STUDENT PAYMENTS ADDED TO PETTY CASH SUCCESSFULLY!');
      console.log('📊 Final petty cash status:');
      const account = finalStatus[0];
      console.log(`   Current Balance: $${account.current_balance}`);
      console.log(`   Total Inflows: $${account.total_inflows}`);
      console.log(`   Total Outflows: $${account.total_outflows}`);
      
      // 5. Show transaction details
      const [transactions] = await connection.query(
        `SELECT * FROM petty_cash_transactions 
         WHERE boarding_house_id = ? AND transaction_type = 'student_payment'
         ORDER BY created_at DESC LIMIT 5`,
        [boardingHouseId]
      );
      
      console.log('\n📋 Recent petty cash transactions:');
      transactions.forEach(transaction => {
        console.log(`   ${transaction.transaction_date}: ${transaction.description} - $${transaction.amount}`);
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error adding student payments to petty cash:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  addStudentPaymentsToPettyCash()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { addStudentPaymentsToPettyCash };
