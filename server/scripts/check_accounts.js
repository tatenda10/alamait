const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'alamait'
};

async function checkAccounts() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking Chart of Accounts...\n');
    
    const [accounts] = await connection.query(
      `SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE name LIKE '%Petty%' OR name LIKE '%Student%' OR code LIKE '%100%' OR code LIKE '%400%' 
       ORDER BY code`
    );
    
    console.log('📋 Relevant Accounts:');
    accounts.forEach(acc => {
      console.log(`   ${acc.code} - ${acc.name} (${acc.type}) [ID: ${acc.id}]`);
    });
    
    // Check for Cash accounts
    const [cashAccounts] = await connection.query(
      `SELECT id, code, name, type 
       FROM chart_of_accounts 
       WHERE name LIKE '%Cash%' 
       ORDER BY code`
    );
    
    console.log('\n💰 Cash Accounts:');
    cashAccounts.forEach(acc => {
      console.log(`   ${acc.code} - ${acc.name} (${acc.type}) [ID: ${acc.id}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkAccounts();
