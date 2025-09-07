const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function correctPettyCashTransactions() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Starting petty cash transaction correction...');
    
    // First, let's see what we're working with
    console.log('\n📊 Current petty cash transactions:');
         const [currentTransactions] = await connection.query(`
       SELECT 
         id,
         transaction_type,
         amount,
         description,
         created_at,
         boarding_house_id
       FROM petty_cash_transactions 
       WHERE transaction_type = 'petty_cash_addition' 
       ORDER BY created_at DESC
     `);
    
    if (currentTransactions.length === 0) {
      console.log('✅ No petty cash addition transactions found to correct.');
      return;
    }
    
    console.log(`Found ${currentTransactions.length} petty cash addition transactions:`);
    currentTransactions.forEach(tx => {
      console.log(`  - ID: ${tx.id}, Amount: $${tx.amount}, Description: ${tx.description}`);
    });
    
    // Check if we have the necessary accounts
    console.log('\n🏦 Checking required accounts...');
         const [accounts] = await connection.query(`
       SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE code IN ('10001', '10002')
     `);
    
    if (accounts.length < 2) {
      console.log('❌ Missing required accounts. Need both Petty Cash (10001) and Cash (10002)');
      return;
    }
    
    const pettyCashAccount = accounts.find(acc => acc.code === '10001');
    const cashAccount = accounts.find(acc => acc.code === '10002');
    
    console.log(`✅ Found Petty Cash account: ${pettyCashAccount.name} (ID: ${pettyCashAccount.id})`);
    console.log(`✅ Found Cash account: ${cashAccount.name} (ID: ${cashAccount.id})`);
    
    // Start correction process
    console.log('\n🔧 Starting correction process...');
    
    for (const transaction of currentTransactions) {
      try {
        await connection.beginTransaction();
        
        console.log(`\n📝 Processing transaction ID ${transaction.id}...`);
        
                 // Create a main transaction record for proper double-entry bookkeeping
         const [mainTransactionResult] = await connection.query(`
           INSERT INTO transactions (
             transaction_type,
             reference,
             amount,
             currency,
             description,
             transaction_date,
             boarding_house_id,
             created_by,
             created_at,
             status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `, [
           'petty_cash_correction',
           `PCC-${transaction.id}-${Date.now()}`,
           transaction.amount,
           'USD',
           `Correction: ${transaction.description}`,
           transaction.created_at,
           transaction.boarding_house_id,
           1, // Default to user 1
           new Date(),
           'posted'
         ]);
        
        const mainTransactionId = mainTransactionResult.insertId;
        console.log(`  ✅ Created main transaction: ${mainTransactionId}`);
        
                 // Create journal entry to debit Petty Cash (money arrives)
         await connection.query(`
           INSERT INTO journal_entries (
             transaction_id,
             account_id,
             entry_type,
             amount,
             description,
             boarding_house_id,
             created_by,
             created_at
           ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())
         `, [
           mainTransactionId,
           pettyCashAccount.id,
           transaction.amount,
           `Correction: ${transaction.description}`,
           transaction.boarding_house_id,
           1
         ]);
        
        console.log(`  ✅ Created debit entry for Petty Cash: $${transaction.amount}`);
        
                 // Create journal entry to credit Cash (money comes from)
         await connection.query(`
           INSERT INTO journal_entries (
             transaction_id,
             account_id,
             entry_type,
             amount,
             description,
             boarding_house_id,
             created_by,
             created_at
           ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())
         `, [
           mainTransactionId,
           cashAccount.id,
           transaction.amount,
           `Correction: Petty Cash addition from ${cashAccount.name}`,
           transaction.boarding_house_id,
           1
         ]);
        
        console.log(`  ✅ Created credit entry for Cash: $${transaction.amount}`);
        
        // Update current account balances
                 // Update Petty Cash balance (increase)
         await connection.query(`
           INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
           VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
           ON DUPLICATE KEY UPDATE 
           current_balance = current_balance + ?,
           total_debits = total_debits + ?,
           transaction_count = transaction_count + 1,
           last_transaction_date = ?
         `, [
           pettyCashAccount.id,
           pettyCashAccount.code,
           pettyCashAccount.name,
           pettyCashAccount.type,
           transaction.amount,
           transaction.amount,
           transaction.created_at,
           transaction.amount,
           transaction.amount,
           transaction.created_at
         ]);
        
                 // Update Cash balance (decrease)
         await connection.query(`
           INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
           VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?)
           ON DUPLICATE KEY UPDATE 
           current_balance = current_balance - ?,
           total_credits = total_credits + ?,
           transaction_count = transaction_count + 1,
           last_transaction_date = ?
         `, [
           cashAccount.id,
           cashAccount.code,
           cashAccount.name,
           cashAccount.type,
           0, // Will be updated by the ON DUPLICATE KEY UPDATE
           transaction.amount,
           transaction.created_at,
           transaction.amount,
           transaction.amount,
           transaction.created_at
         ]);
        
        console.log(`  ✅ Updated account balances`);
        
                 // Mark the original petty cash transaction as corrected
         await connection.query(`
           UPDATE petty_cash_transactions 
           SET 
             notes = CONCAT(COALESCE(notes, ''), ' [CORRECTED - Proper double-entry created]')
           WHERE id = ?
         `, [transaction.id]);
        
        console.log(`  ✅ Marked original transaction as corrected`);
        
        await connection.commit();
        console.log(`  ✅ Transaction ${transaction.id} corrected successfully!`);
        
      } catch (error) {
        await connection.rollback();
        console.error(`  ❌ Error correcting transaction ${transaction.id}:`, error.message);
      }
    }
    
    // Show final balances
    console.log('\n📊 Final account balances:');
    const [finalBalances] = await connection.query(`
      SELECT 
        account_code,
        current_balance,
        total_debits,
        total_credits
      FROM current_account_balances 
      WHERE account_code IN ('10001', '10002')
      ORDER BY account_code
    `);
    
    finalBalances.forEach(balance => {
      console.log(`  ${balance.account_code}: $${balance.current_balance.toFixed(2)} (Debits: $${balance.total_debits.toFixed(2)}, Credits: $${balance.total_credits.toFixed(2)})`);
    });
    
    console.log('\n✅ Petty cash transaction correction completed!');
    
  } catch (error) {
    console.error('❌ Error in correction process:', error);
  } finally {
    await connection.end();
  }
}

// Run the correction
correctPettyCashTransactions()
  .then(() => {
    console.log('\n🎉 Script execution completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script execution failed:', error);
    process.exit(1);
  });
