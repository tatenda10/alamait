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
    console.log('🔧 Fixing student payment journal entries...\n');
    
    const boardingHouseId = 4; // St Kilda
    
    // 1. Find all student payment transactions
    const [studentTransactions] = await connection.query(
      `SELECT t.id, t.amount, t.description
       FROM transactions t
       WHERE t.transaction_type = 'student_payment' 
       AND t.boarding_house_id = ?
       ORDER BY t.created_at`,
      [boardingHouseId]
    );
    
    console.log(`📋 Found ${studentTransactions.length} student payment transactions to fix`);
    
    let totalAmount = 0;
    studentTransactions.forEach(transaction => {
      totalAmount += parseFloat(transaction.amount);
      console.log(`   Transaction ${transaction.id}: $${transaction.amount} - ${transaction.description}`);
    });
    
    console.log(`\n💰 Total amount to fix: $${totalAmount.toFixed(2)}`);
    
    // 2. Get petty cash account ID for St Kilda
    const [pettyCashAccount] = await connection.query(
      `SELECT coa.id as account_id, coa.code, coa.name
       FROM chart_of_accounts coa
       JOIN chart_of_accounts_branch coab ON coa.id = coab.account_id
       WHERE coab.branch_id = ? AND coa.code = '10005'
       LIMIT 1`,
      [boardingHouseId]
    );
    
    if (pettyCashAccount.length === 0) {
      console.log('❌ Petty Cash account (10005) not found in chart of accounts');
      console.log('Available accounts:');
      const [allAccounts] = await connection.query(
        `SELECT coa.code, coa.name, coab.branch_id
         FROM chart_of_accounts coa
         JOIN chart_of_accounts_branch coab ON coa.id = coab.account_id
         WHERE coab.branch_id = ? AND coa.code LIKE '100%'
         ORDER BY coa.code`,
        [boardingHouseId]
      );
      allAccounts.forEach(account => {
        console.log(`   ${account.code} - ${account.name}`);
      });
      return;
    }
    
    const pettyCashAccountId = pettyCashAccount[0].account_id;
    console.log(`✅ Found Petty Cash account: ${pettyCashAccount[0].code} - ${pettyCashAccount[0].name} (ID: ${pettyCashAccountId})`);
    
    // 3. Get Cash on Hand account ID
    const [cashAccount] = await connection.query(
      `SELECT coa.id as account_id, coa.code, coa.name
       FROM chart_of_accounts coa
       JOIN chart_of_accounts_branch coab ON coa.id = coab.account_id
       WHERE coab.branch_id = ? AND coa.code = '10002'
       LIMIT 1`,
      [boardingHouseId]
    );
    
    if (cashAccount.length === 0) {
      console.log('❌ Cash on Hand account (10002) not found');
      return;
    }
    
    const cashAccountId = cashAccount[0].account_id;
    console.log(`✅ Found Cash on Hand account: ${cashAccount[0].code} - ${cashAccount[0].name} (ID: ${cashAccountId})`);
    
    // 4. Fix journal entries for each transaction
    await connection.beginTransaction();
    
    try {
      for (const transaction of studentTransactions) {
        console.log(`\n🔧 Fixing transaction ${transaction.id} ($${transaction.amount})`);
        
        // Update the debit entry from Cash to Petty Cash
        await connection.query(
          `UPDATE journal_entries 
           SET account_id = ?, description = ?
           WHERE transaction_id = ? AND entry_type = 'debit' AND account_id = ?`,
          [
            pettyCashAccountId,
            `Petty cash received from student payment - ${transaction.description}`,
            transaction.id,
            cashAccountId
          ]
        );
        
        console.log(`   ✅ Updated debit entry: Cash → Petty Cash`);
        
        // Update account balances
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
        
        console.log(`   ✅ Updated account balances`);
      }
      
      await connection.commit();
      
      // 5. Verify the changes
      console.log('\n📊 Verifying account balances after fix:');
      
      const [cashBalance] = await connection.query(
        `SELECT coa.code, coa.name, COALESCE(cab.current_balance, 0) as balance
         FROM chart_of_accounts coa
         JOIN chart_of_accounts_branch coab ON coa.id = coab.account_id
         LEFT JOIN current_account_balances cab ON coa.id = cab.account_id AND cab.boarding_house_id = ?
         WHERE coab.branch_id = ? AND coa.code = '10002'`,
        [boardingHouseId, boardingHouseId]
      );
      
      const [pettyCashBalance] = await connection.query(
        `SELECT coa.code, coa.name, COALESCE(cab.current_balance, 0) as balance
         FROM chart_of_accounts coa
         JOIN chart_of_accounts_branch coab ON coa.id = coab.account_id
         LEFT JOIN current_account_balances cab ON coa.id = cab.account_id AND cab.boarding_house_id = ?
         WHERE coab.branch_id = ? AND coa.code = '10005'`,
        [boardingHouseId, boardingHouseId]
      );
      
      console.log(`   Cash on Hand (10002): $${cashBalance[0]?.balance || 0}`);
      console.log(`   Petty Cash (10005): $${pettyCashBalance[0]?.balance || 0}`);
      
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
