const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMakoBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Checking mako\'s account relationship...');
    
    // Check the exact relationship between mako user and account
    const [makoData] = await connection.execute(`
      SELECT 
        pcu.id as user_id,
        pcu.username,
        pca.id as account_id,
        pca.petty_cash_user_id,
        pca.account_name,
        pca.current_balance,
        pca.status as account_status
      FROM petty_cash_users pcu
      LEFT JOIN petty_cash_accounts pca ON pcu.id = pca.petty_cash_user_id
      WHERE pcu.username = 'mako'
    `);
    
    console.log('Mako\'s data:');
    console.table(makoData);
    
    if (makoData.length > 0 && makoData[0].account_id) {
      console.log('\n✅ Mako has an account with balance:', makoData[0].current_balance);
      
      // Check if the petty_cash_user_id matches
      if (makoData[0].user_id === makoData[0].petty_cash_user_id) {
        console.log('✅ User ID matches petty_cash_user_id');
      } else {
        console.log('❌ User ID does not match petty_cash_user_id');
        console.log(`User ID: ${makoData[0].user_id}, Petty Cash User ID: ${makoData[0].petty_cash_user_id}`);
        
        // Fix the relationship
        console.log('\n🔧 Fixing the relationship...');
        await connection.execute(`
          UPDATE petty_cash_accounts 
          SET petty_cash_user_id = ? 
          WHERE id = ?
        `, [makoData[0].user_id, makoData[0].account_id]);
        
        console.log('✅ Fixed the relationship');
      }
    } else {
      console.log('❌ Mako does not have a petty cash account');
      
      // Create a petty cash account for mako
      console.log('\n🔧 Creating petty cash account for mako...');
      const [accountResult] = await connection.execute(`
        INSERT INTO petty_cash_accounts 
        (petty_cash_user_id, boarding_house_id, account_name, account_code, current_balance, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW())
      `, [makoData[0].user_id, 4, 'mako', 'PC-001', 21.08]);
      
      console.log('✅ Created petty cash account for mako');
    }
    
    // Final check
    console.log('\n📊 Final mako data:');
    const [finalData] = await connection.execute(`
      SELECT 
        pcu.id as user_id,
        pcu.username,
        pca.id as account_id,
        pca.petty_cash_user_id,
        pca.account_name,
        pca.current_balance,
        pca.status as account_status
      FROM petty_cash_users pcu
      LEFT JOIN petty_cash_accounts pca ON pcu.id = pca.petty_cash_user_id
      WHERE pcu.username = 'mako'
    `);
    
    console.table(finalData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixMakoBalance();
