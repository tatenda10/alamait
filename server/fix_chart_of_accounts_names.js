require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixChartOfAccountsNames() {
  console.log('🔧 Fixing Chart of Accounts Names...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    console.log('📋 Current Account Names:');
    const [currentAccounts] = await connection.execute(`
      SELECT code, name FROM chart_of_accounts
      WHERE code IN ('10001', '10002', '10003')
      ORDER BY code
    `);
    console.table(currentAccounts);

    // Fix the account names
    console.log('\n🔧 Updating account names...');
    
    // 10001 should be "Cash"
    await connection.execute(`
      UPDATE chart_of_accounts
      SET name = 'Cash'
      WHERE code = '10001'
    `);
    console.log('✓ Updated 10001 to "Cash"');

    // 10002 should be "CBZ Bank Account"
    await connection.execute(`
      UPDATE chart_of_accounts
      SET name = 'CBZ Bank Account'
      WHERE code = '10002'
    `);
    console.log('✓ Updated 10002 to "CBZ Bank Account"');

    // 10003 should be "CBZ Vault"
    await connection.execute(`
      UPDATE chart_of_accounts
      SET name = 'CBZ Vault'
      WHERE code = '10003'
    `);
    console.log('✓ Updated 10003 to "CBZ Vault"');

    await connection.commit();

    console.log('\n📋 Updated Account Names:');
    const [updatedAccounts] = await connection.execute(`
      SELECT code, name FROM chart_of_accounts
      WHERE code IN ('10001', '10002', '10003')
      ORDER BY code
    `);
    console.table(updatedAccounts);

    console.log('\n✅ Chart of accounts names fixed successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

fixChartOfAccountsNames();

