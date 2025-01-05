const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

// Use Railway environment variables directly
const {
  MYSQLHOST,
  MYSQLPORT = '3306',
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE,
} = process.env;

// Validation (same logic, just updated names)
if (!MYSQLUSER || !MYSQLDATABASE) {
  console.error(
    'Missing required env: MYSQLUSER and MYSQLDATABASE must be set.'
  );
  process.exit(1);
}

const pool = mysql.createPool({
  host: MYSQLHOST,
  port: Number(MYSQLPORT) || 3306,
  user: MYSQLUSER,
  password: MYSQLPASSWORD ?? '',
  database: MYSQLDATABASE,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // 🔥 IMPORTANT for Railway
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('MySQL pool error:', err.message);

  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    return;
  }

  if (err.fatal) {
    process.exit(1);
  }
});

module.exports = pool;