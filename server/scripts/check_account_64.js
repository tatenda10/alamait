const db = require('../src/services/db');

async function checkAccount() {
  try {
    const [result] = await db.query('SELECT id, code, name, type FROM chart_of_accounts WHERE id = 64');
    console.log('Account 64:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAccount();
