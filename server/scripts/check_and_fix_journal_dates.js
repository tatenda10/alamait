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

async function checkAndFixJournalDates() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking and Fixing Journal Entry Dates...\n');
    
    // Check current journal entries for student payments
    const [journalEntries] = await connection.query(
      `SELECT je.id, je.amount, je.description, je.entry_type, 
              t.transaction_date, t.transaction_type, t.id as transaction_id
       FROM journal_entries je 
       JOIN transactions t ON je.transaction_id = t.id 
       WHERE t.transaction_type = 'student_payment' 
       ORDER BY je.created_at`
    );
    
    console.log('📋 Current Journal Entries for Student Payments:');
    journalEntries.forEach(je => {
      console.log(`   ID ${je.id}: ${je.entry_type} $${je.amount} - ${je.description} - Transaction Date: ${je.transaction_date}`);
    });
    
    // Check if any journal entries have wrong dates
    const wrongDateEntries = journalEntries.filter(je => 
      je.transaction_date && je.transaction_date.toString().includes('2024')
    );
    
    if (wrongDateEntries.length > 0) {
      console.log(`\n⚠️  Found ${wrongDateEntries.length} journal entries with 2024 dates that should be 2025`);
      
      await connection.beginTransaction();
      
      // The journal entries inherit their dates from the transactions
      // So we need to make sure the transactions have the correct dates
      console.log('\n🔧 Journal entries inherit dates from transactions, checking transaction dates...');
      
      const [transactions] = await connection.query(
        `SELECT id, transaction_date FROM transactions WHERE transaction_type = 'student_payment'`
      );
      
      console.log('📋 Current Transaction Dates:');
      transactions.forEach(t => {
        console.log(`   Transaction ${t.id}: ${t.transaction_date}`);
      });
      
      // Check if transactions need updating
      const wrongDateTransactions = transactions.filter(t => 
        t.transaction_date && t.transaction_date.toString().includes('2024')
      );
      
      if (wrongDateTransactions.length > 0) {
        console.log(`\n🔧 Updating ${wrongDateTransactions.length} transactions to 2025...`);
        
        for (const transaction of wrongDateTransactions) {
          await connection.query(
            'UPDATE transactions SET transaction_date = ? WHERE id = ?',
            ['2025-08-20', transaction.id]
          );
          console.log(`   ✅ Updated transaction ${transaction.id} to 2025-08-20`);
        }
      }
      
      await connection.commit();
      
      // Verify the fix
      const [updatedJournalEntries] = await connection.query(
        `SELECT je.id, je.amount, je.description, je.entry_type, 
                t.transaction_date, t.transaction_type, t.id as transaction_id
         FROM journal_entries je 
         JOIN transactions t ON je.transaction_id = t.id 
         WHERE t.transaction_type = 'student_payment' 
         ORDER BY je.created_at`
      );
      
      console.log('\n📋 Updated Journal Entries:');
      updatedJournalEntries.forEach(je => {
        console.log(`   ID ${je.id}: ${je.entry_type} $${je.amount} - ${je.description} - Transaction Date: ${je.transaction_date}`);
      });
      
      console.log('\n🎉 Journal entry dates fixed to 2025!');
      
    } else {
      console.log('\n✅ All journal entries already have correct 2025 dates!');
    }
    
    // Also check if we need to update the journal entry created_at dates
    console.log('\n🔧 Checking journal entry created_at dates...');
    
    const [journalCreatedDates] = await connection.query(
      `SELECT je.id, je.created_at, t.transaction_date
       FROM journal_entries je 
       JOIN transactions t ON je.transaction_id = t.id 
       WHERE t.transaction_type = 'student_payment' 
       ORDER BY je.created_at`
    );
    
    console.log('📋 Journal Entry Created Dates:');
    journalCreatedDates.forEach(je => {
      console.log(`   ID ${je.id}: Created ${je.created_at} - Transaction Date: ${je.transaction_date}`);
    });
    
    // Update journal entry created_at to match transaction date
    await connection.beginTransaction();
    
    for (const je of journalCreatedDates) {
      if (je.transaction_date) {
        await connection.query(
          'UPDATE journal_entries SET created_at = ? WHERE id = ?',
          [je.transaction_date, je.id]
        );
        console.log(`   ✅ Updated journal entry ${je.id} created_at to ${je.transaction_date}`);
      }
    }
    
    await connection.commit();
    
    console.log('\n🎉 All journal entry dates synchronized with transaction dates!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error fixing journal dates:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  checkAndFixJournalDates()
    .then(() => {
      console.log('\n✅ Journal date check and fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Journal date fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkAndFixJournalDates };
