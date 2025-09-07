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

async function previewPettyCashCorrections() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Previewing petty cash transaction corrections...');
    console.log('⚠️  This is a PREVIEW only - no changes will be made\n');
    
         // Check current petty cash transactions
     const [currentTransactions] = await connection.query(`
       SELECT 
         id,
         transaction_type,
         amount,
         description,
         created_at,
         boarding_house_id,
         notes
       FROM petty_cash_transactions 
       WHERE transaction_type = 'petty_cash_addition' 
       ORDER BY created_at DESC
     `);
    
    if (currentTransactions.length === 0) {
      console.log('✅ No petty cash addition transactions found to correct.');
      return;
    }
    
    console.log(`📊 Found ${currentTransactions.length} petty cash addition transactions:`);
    console.log('=' .repeat(80));
    
    let totalAmount = 0;
    currentTransactions.forEach((tx, index) => {
      totalAmount += parseFloat(tx.amount);
      console.log(`${index + 1}. ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Date: ${tx.created_at}`);
      console.log(`   Notes: ${tx.notes || 'None'}`);
      console.log('');
    });
    
    console.log(`💰 Total amount to be corrected: $${totalAmount.toFixed(2)}`);
    console.log('=' .repeat(80));
    
    // Check required accounts
    console.log('\n🏦 Required accounts for correction:');
         const [accounts] = await connection.query(`
       SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE code IN ('10001', '10002')
     `);
    
    if (accounts.length < 2) {
      console.log('❌ Missing required accounts:');
      if (!accounts.find(acc => acc.code === '10001')) {
        console.log('   - Petty Cash (10001)');
      }
      if (!accounts.find(acc => acc.code === '10002')) {
        console.log('   - Cash (10002)');
      }
      return;
    }
    
    const pettyCashAccount = accounts.find(acc => acc.code === '10001');
    const cashAccount = accounts.find(acc => acc.code === '10002');
    
    console.log(`✅ Petty Cash: ${pettyCashAccount.name} (ID: ${pettyCashAccount.id})`);
    console.log(`✅ Cash: ${cashAccount.name} (ID: ${cashAccount.id})`);
    
    // Check current balances
    console.log('\n📊 Current account balances:');
    const [currentBalances] = await connection.query(`
      SELECT 
        account_code,
        current_balance,
        total_debits,
        total_credits
      FROM current_account_balances 
      WHERE account_code IN ('10001', '10002')
      ORDER BY account_code
    `);
    
    currentBalances.forEach(balance => {
      console.log(`  ${balance.account_code}: $${balance.current_balance.toFixed(2)} (Debits: $${balance.total_debits.toFixed(2)}, Credits: $${balance.total_credits.toFixed(2)})`);
    });
    
    // Show what the correction would do
    console.log('\n🔧 What the correction would do:');
    console.log('1. Create proper double-entry transactions for each petty cash addition');
    console.log('2. Debit Petty Cash account (money arrives)');
    console.log('3. Credit Cash account (money comes from)');
    console.log('4. Update current account balances accordingly');
    console.log('5. Mark original transactions as corrected');
    
    console.log('\n📝 Sample correction entry:');
    console.log('   Transaction Type: petty_cash_correction');
    console.log('   Reference: PCC-{original_id}-{timestamp}');
    console.log('   Description: Correction: {original_description}');
    console.log('   Journal Entries:');
    console.log('     - Debit Petty Cash: $amount');
    console.log('     - Credit Cash: $amount');
    
    console.log('\n⚠️  To run the actual correction, use:');
    console.log('   node scripts/correct_petty_cash_transactions.js');
    
  } catch (error) {
    console.error('❌ Error in preview:', error);
  } finally {
    await connection.end();
  }
}

// Run the preview
previewPettyCashCorrections()
  .then(() => {
    console.log('\n🎉 Preview completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Preview failed:', error);
    process.exit(1);
  });
