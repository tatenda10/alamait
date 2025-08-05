const pool = require('../src/services/db');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config({ path: '../.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

(async () => {
  try {
    const username = process.env.SYSADMIN_USERNAME || await ask('Username: ');
    const email = process.env.SYSADMIN_EMAIL || await ask('Email: ');
    const password = process.env.SYSADMIN_PASSWORD || await ask('Password: ');
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO users (username, role, email, password, created_at) VALUES (?, 'super_admin', ?, ?, NOW())`,
      [username, email, hashedPassword]
    );
    console.log('Super admin user created successfully.');
  } catch (err) {
    console.error('Error creating super admin:', err);
  } finally {
    rl.close();
    process.exit();
  }
})(); 