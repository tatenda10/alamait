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

async function fixStudentPaymentJournals() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Fixing Student Payment Journal Entries...\n');
    
    await connection.beginTransaction();
    
    // Get all student payment petty cash transactions
    const [studentPaymentTransactions] = await connection.query(
      `SELECT * FROM petty_cash_transactions 
       WHERE transaction_type = 'student_payment' 
       ORDER BY boarding_house_id, created_at`
    );
    
    console.log(`📋 Found ${studentPaymentTransactions.length} student payment transactions to process`);
    
    // Get account IDs
    const [pettyCashAccount] = await connection.query(
      "SELECT id FROM chart_of_accounts WHERE code = '10005' AND name = 'Petty Cash'"
    );
    
    const [studentRevenueAccount] = await connection.query(
      "SELECT id FROM chart_of_accounts WHERE code = '40001' AND name = 'Student Revenue'"
    );
    
    if (pettyCashAccount.length === 0) {
      throw new Error('Petty Cash account (10005) not found in chart of accounts');
    }
    
    if (studentRevenueAccount.length === 0) {
      throw new Error('Student Revenue account (40001) not found in chart of accounts');
    }
    
    const pettyCashAccountId = pettyCashAccount[0].id;
    const studentRevenueAccountId = studentRevenueAccount[0].id;
    
    console.log(`💰 Petty Cash Account ID: ${pettyCashAccountId}`);
    console.log(`📈 Student Revenue Account ID: ${studentRevenueAccountId}`);
    
    let totalProcessed = 0;
    let totalAmount = 0;
    
    // Process each boarding house separately
    const boardingHouses = [...new Set(studentPaymentTransactions.map(t => t.boarding_house_id))];
    
    for (const boardingHouseId of boardingHouses) {
      const houseTransactions = studentPaymentTransactions.filter(t => t.boarding_house_id === boardingHouseId);
      const houseTotal = houseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      console.log(`\n🏠 Processing Boarding House ${boardingHouseId} (${houseTransactions.length} transactions, $${houseTotal.toFixed(2)} total)`);
      
      // Create main transaction for this boarding house
      const [mainTransaction] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, amount, description, reference_number, 
          transaction_date, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          'student_payment',
          houseTotal,
          `Student payments - Boarding House ${boardingHouseId}`,
          `STU-PAY-${boardingHouseId}-${Date.now()}`,
          houseTransactions[0].transaction_date,
          1
        ]
      );
      
      const transactionId = mainTransaction.insertId;
      console.log(`   ✅ Created main transaction (ID: ${transactionId})`);
      
      // Create journal entries
      // Debit Petty Cash
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, debit_amount, credit_amount, 
          description, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          transactionId,
          pettyCashAccountId,
          houseTotal,
          0,
          `Student payments received - Boarding House ${boardingHouseId}`
        ]
      );
      
      // Credit Student Revenue
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id, account_id, debit_amount, credit_amount, 
          description, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          transactionId,
          studentRevenueAccountId,
          0,
          houseTotal,
          `Student revenue - Boarding House ${boardingHouseId}`
        ]
      );
      
      console.log(`   ✅ Created journal entries (Debit Petty Cash $${houseTotal}, Credit Student Revenue $${houseTotal})`);
      
      // Update account balances
      // Update Petty Cash balance
      await connection.query(
        `UPDATE current_account_balances 
         SET current_balance = current_balance + ?, updated_at = NOW()
         WHERE account_id = ?`,
        [houseTotal, pettyCashAccountId]
      );
      
      // Update Student Revenue balance
      await connection.query(
        `UPDATE current_account_balances 
         SET current_balance = current_balance + ?, updated_at = NOW()
         WHERE account_id = ?`,
        [houseTotal, studentRevenueAccountId]
      );
      
      console.log(`   ✅ Updated account balances`);
      
      totalProcessed += houseTransactions.length;
      totalAmount += houseTotal;
    }
    
    await connection.commit();
    
    console.log('\n🎉 STUDENT PAYMENT JOURNALS FIXED SUCCESSFULLY!');
    console.log(`📊 Summary:`);
    console.log(`   🏠 Boarding Houses Processed: ${boardingHouses.length}`);
    console.log(`   📋 Transactions Processed: ${totalProcessed}`);
    console.log(`   💰 Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`   📝 Journal Entries Created: ${boardingHouses.length * 2} (2 per boarding house)`);
    console.log(`   💳 Account Balances Updated: Petty Cash + Student Revenue`);
    
    // Verify the fix
    console.log('\n🔍 Verification:');
    
    const [mainTransactionCount] = await connection.query(
      "SELECT COUNT(*) as count FROM transactions WHERE transaction_type = 'student_payment'"
    );
    
    const [journalEntryCount] = await connection.query(
      `SELECT COUNT(*) as count FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE t.transaction_type = 'student_payment'`
    );
    
    const [pettyCashBalance] = await connection.query(
      "SELECT current_balance FROM current_account_balances WHERE account_id = ?",
      [pettyCashAccountId]
    );
    
    const [studentRevenueBalance] = await connection.query(
      "SELECT current_balance FROM current_account_balances WHERE account_id = ?",
      [studentRevenueAccountId]
    );
    
    console.log(`   📊 Main Transactions: ${mainTransactionCount[0].count}`);
    console.log(`   📝 Journal Entries: ${journalEntryCount[0].count}`);
    console.log(`   💰 Petty Cash Balance: $${pettyCashBalance[0].current_balance}`);
    console.log(`   📈 Student Revenue Balance: $${studentRevenueBalance[0].current_balance}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error fixing student payment journals:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  fixStudentPaymentJournals()
    .then(() => {
      console.log('\n✅ Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixStudentPaymentJournals };
