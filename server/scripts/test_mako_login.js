const mysql = require('mysql2/promise');
require('dotenv').config();

async function testMakoLogin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Simulate the exact query from the authentication controller
    const [users] = await connection.execute(`
      SELECT 
        pcu.*,
        pca.id as petty_cash_account_id,
        pca.account_name,
        pca.account_code,
        pca.current_balance,
        pca.status as account_status,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        pca.boarding_house_id
      FROM petty_cash_users pcu
      INNER JOIN petty_cash_accounts pca ON pcu.id = pca.petty_cash_user_id
      INNER JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pcu.username = ? 
      AND pcu.deleted_at IS NULL
      AND pca.deleted_at IS NULL
      AND pca.status = 'active'
      AND bh.deleted_at IS NULL
    `, ['mako']);
    
    console.log('Login query result for mako:');
    console.table(users);
    
    if (users.length > 0) {
      console.log('\n✅ Mako login data:');
      console.log(`Username: ${users[0].username}`);
      console.log(`Account ID: ${users[0].petty_cash_account_id}`);
      console.log(`Account Name: ${users[0].account_name}`);
      console.log(`Current Balance: $${users[0].current_balance}`);
      console.log(`Account Status: ${users[0].account_status}`);
      console.log(`Boarding House: ${users[0].boarding_house_name}`);
    } else {
      console.log('❌ No data found for mako login');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testMakoLogin();
