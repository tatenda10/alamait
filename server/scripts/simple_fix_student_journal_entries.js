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

async function fixStudentPaymentJournalEntries() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Fixing journal entries for student payments only...\n');
    
    const boardingHouseId = 4; // St Kilda
    
    // 1. Find the petty cash transaction we just created
    const [pettyCashTransaction] = await connection.query(
      `SELECT id, amount, description 
       FROM petty_cash_transactions 
       WHERE boarding_house_id = ? 
       AND transaction_type = 'student_payment'
       AND description LIKE '%Student payments - 17 students%'
       ORDER BY created_at DESC LIMIT 1`,
      [boardingHouseId]
    );
    
    if (pettyCashTransaction.length === 0) {
      console.log('❌ No student payment petty cash transaction found');
      return;
    }
    
    const transaction = pettyCashTransaction[0];
    console.log(`📋 Found petty cash transaction: $${transaction.amount} - ${transaction.description}`);
    
    // 2. Find the corresponding accounting transaction
    const [accountingTransaction] = await connection.query(
      `SELECT id, amount, description 
       FROM transactions 
       WHERE boarding_house_id = ? 
       AND transaction_type = 'student_payment'
       AND amount = ?
       ORDER BY created_at DESC LIMIT 1`,
      [boardingHouseId, transaction.amount]
    );
    
    if (accountingTransaction.length === 0) {
      console.log('❌ No corresponding accounting transaction found');
      return;
    }
    
    const accountingTxn = accountingTransaction[0];
    console.log(`📋 Found accounting transaction: $${accountingTxn.amount} - ${accountingTxn.description}`);
    
    // 3. Get account IDs
    const [accounts] = await connection.query(
      `SELECT 
        (SELECT id FROM chart_of_accounts WHERE code = '10002' LIMIT 1) as cash_account_id,
        (SELECT id FROM chart_of_accounts WHERE code = '10005' LIMIT 1) as petty_cash_account_id`
    );
    
    const cashAccountId = accounts[0].cash_account_id;
    const pettyCashAccountId = accounts[0].petty_cash_account_id;
    
    if (!cashAccountId || !pettyCashAccountId) {
      console.log('❌ Required accounts not found');
      console.log(`   Cash Account (10002): ${cashAccountId ? 'Found' : 'Not Found'}`);
      console.log(`   Petty Cash Account (10005): ${pettyCashAccountId ? 'Found' : 'Not Found'}`);
      return;
    }
    
    console.log(`✅ Found accounts:`);
    console.log(`   Cash Account (10002): ID ${cashAccountId}`);
    console.log(`   Petty Cash Account (10005): ID ${pettyCashAccountId}`);
    
    // 4. Update the journal entry
    await connection.beginTransaction();
    
    try {
      // Update the debit entry from Cash to Petty Cash
      const [updateResult] = await connection.query(
        `UPDATE journal_entries 
         SET account_id = ?, description = ?
         WHERE transaction_id = ? AND entry_type = 'debit' AND account_id = ?`,
        [
          pettyCashAccountId,
          `Petty cash received from student payments - ${transaction.description}`,
          accountingTxn.id,
          cashAccountId
        ]
      );
      
      if (updateResult.affectedRows === 0) {
        console.log('❌ No journal entries found to update');
        await connection.rollback();
        return;
      }
      
      console.log(`✅ Updated ${updateResult.affectedRows} journal entry(ies): Cash → Petty Cash`);
      
      // 5. Update account balances
      // Remove from Cash on Hand
      await connection.query(
        `UPDATE current_account_balances 
         SET current_balance = current_balance - ?
         WHERE account_id = ? AND boarding_house_id = ?`,
        [transaction.amount, cashAccountId, boardingHouseId]
      );
      
      // Add to Petty Cash
      await connection.query(
        `INSERT INTO current_account_balances (account_id, boarding_house_id, current_balance, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         current_balance = current_balance + ?,
         updated_at = NOW()`,
        [pettyCashAccountId, boardingHouseId, transaction.amount, transaction.amount]
      );
      
      console.log(`✅ Updated account balances:`);
      console.log(`   Removed $${transaction.amount} from Cash on Hand`);
      console.log(`   Added $${transaction.amount} to Petty Cash`);
      
      await connection.commit();
      
      // 6. Verify the changes
      console.log('\n📊 Verifying final balances:');
      
      const [finalBalances] = await connection.query(
        `SELECT 
          coa.code, coa.name, COALESCE(cab.current_balance, 0) as balance
         FROM chart_of_accounts coa
         LEFT JOIN current_account_balances cab ON coa.id = cab.account_id AND cab.boarding_house_id = ?
         WHERE coa.code IN ('10002', '10005')
         ORDER BY coa.code`,
        [boardingHouseId]
      );
      
      finalBalances.forEach(account => {
        console.log(`   ${account.code} - ${account.name}: $${account.balance}`);
      });
      
      console.log('\n🎉 JOURNAL ENTRIES FIXED SUCCESSFULLY!');
      console.log('✅ Student payments now properly debit Petty Cash instead of Cash on Hand');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error fixing journal entries:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  fixStudentPaymentJournalEntries()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixStudentPaymentJournalEntries };
