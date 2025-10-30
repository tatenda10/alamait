const mysql = require('mysql2/promise');
require('dotenv').config();

async function findMako() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== SEARCHING FOR MAKO ===\n');

    // Search for Mako in users
    const [users] = await connection.query(`
      SELECT id, username, role 
      FROM users 
      WHERE username LIKE '%mako%'
    `);

    console.log(`Found ${users.length} user(s) matching "mako":\n`);
    
    if (users.length === 0) {
      console.log('No users found with name containing "mako"');
      
      // List all users
      console.log('\n=== ALL USERS ===\n');
      const [allUsers] = await connection.query('SELECT id, username FROM users ORDER BY username');
      allUsers.forEach(u => {
        console.log(`ID: ${u.id} | Username: ${u.username}`);
      });
    } else {
      users.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`Username: ${u.username}`);
        console.log(`Role: ${u.role}`);
        console.log('---');
      });

      // Check petty cash accounts for each user
      for (const user of users) {
        console.log(`\nPetty Cash Accounts for ${user.username}:\n`);
        
        const [accounts] = await connection.query(`
          SELECT 
            pca.*,
            bh.name as boarding_house_name
          FROM petty_cash_accounts pca
          LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
          WHERE pca.petty_cash_user_id = ?
        `, [user.id]);

        if (accounts.length === 0) {
          console.log('  No petty cash accounts found');
        } else {
          accounts.forEach(acc => {
            console.log(`  Account ID: ${acc.id}`);
            console.log(`  Balance: $${acc.current_balance}`);
            console.log(`  Boarding House: ${acc.boarding_house_name || 'N/A'}`);
            console.log(`  Deleted: ${acc.deleted_at ? 'YES' : 'NO'}`);
            console.log(`  Created: ${acc.created_at}`);
            console.log('  ---');
          });
        }
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

findMako();

