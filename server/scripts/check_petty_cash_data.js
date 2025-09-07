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

async function checkPettyCashData() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking petty_cash_transactions table data...\n');
    
    // Check all transactions
    const [allTransactions] = await connection.query(`
      SELECT 
        id,
        transaction_type,
        amount,
        description,
        created_at,
        boarding_house_id,
        notes
      FROM petty_cash_transactions 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${allTransactions.length} total petty cash transactions:`);
    console.log('=' .repeat(80));
    
    if (allTransactions.length === 0) {
      console.log('  No transactions found in table');
      return;
    }
    
    allTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ID: ${tx.id}`);
      console.log(`   Type: ${tx.transaction_type}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Date: ${tx.created_at}`);
      console.log(`   Notes: ${tx.notes || 'None'}`);
      console.log('');
    });
    
    // Check transaction types
    console.log('\n🏷️  Transaction types breakdown:');
    const [types] = await connection.query(`
      SELECT transaction_type, COUNT(*) as count, SUM(amount) as total_amount
      FROM petty_cash_transactions 
      GROUP BY transaction_type
    `);
    
    types.forEach(type => {
      console.log(`  - ${type.transaction_type}: ${type.count} transactions, Total: $${type.total_amount}`);
    });
    
    // Check if there are any transactions that look like additions
    console.log('\n🔍 Looking for transactions that should be corrected:');
    const [potentialAdditions] = await connection.query(`
      SELECT 
        id,
        transaction_type,
        amount,
        description,
        created_at
      FROM petty_cash_transactions 
      WHERE (transaction_type = 'petty_cash_addition' OR description LIKE '%petty cash%' OR description LIKE '%Petty Cash%')
      ORDER BY created_at DESC
    `);
    
    if (potentialAdditions.length === 0) {
      console.log('  No obvious petty cash addition transactions found');
    } else {
      console.log(`  Found ${potentialAdditions.length} potential additions:`);
      potentialAdditions.forEach((tx, index) => {
        console.log(`    ${index + 1}. ID: ${tx.id}, Type: ${tx.transaction_type}, Amount: $${tx.amount}, Description: ${tx.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await connection.end();
  }
}

// Run the check
checkPettyCashData()
  .then(() => {
    console.log('\n🎉 Data check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Data check failed:', error);
    process.exit(1);
  });
