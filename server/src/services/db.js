const mysql = require('mysql2/promise');
// Ensure we load env from the server directory when scripts run from repo root
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Return dates as strings (YYYY-MM-DD format) to prevent timezone conversion
});

// Wrap getConnection to set timezone for each connection
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async function() {
  const connection = await originalGetConnection();
  // Set timezone to UTC to prevent date shifting
  await connection.query("SET time_zone = '+00:00'");
  return connection;
};

module.exports = pool; 