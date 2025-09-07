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

async function checkAndFixPaymentDates() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('📅 Checking and Fixing Student Payment Dates...\n');
    
    // Check current transaction dates
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
    
    // Check if any dates are in September instead of August
    const septemberTransactions = transactions.filter(t => 
      t.transaction_date && t.transaction_date.toString().includes('2024-09')
    );
    
    if (septemberTransactions.length > 0) {
      console.log(`\n⚠️  Found ${septemberTransactions.length} transactions with September dates that should be August`);
      
      await connection.beginTransaction();
      
      // Fix the dates to August 2024
      for (const transaction of septemberTransactions) {
        const augustDate = '2024-08-25'; // Use August 25th as the payment date
        
        await connection.query(
          'UPDATE transactions SET transaction_date = ? WHERE id = ?',
          [augustDate, transaction.id]
        );
        
        console.log(`   ✅ Updated transaction ${transaction.id} to ${augustDate}`);
      }
      
      await connection.commit();
      console.log('\n🎉 All transaction dates fixed to August 2024!');
      
    } else {
      console.log('\n✅ All transaction dates are already in August 2024!');
    }
    
    // Verify the fix
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
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error fixing payment dates:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  checkAndFixPaymentDates()
    .then(() => {
      console.log('\n✅ Date check and fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Date fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkAndFixPaymentDates };
