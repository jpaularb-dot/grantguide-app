// config/db.js — single MySQL connection pool (prepared statements everywhere).
// Reads DB_* from .env, defaulting to XAMPP's settings (root / no password).
import mysql from 'mysql2/promise';

// Railway's MySQL plugin injects MYSQL* variables and takes precedence.
// Locally (XAMPP), the DB_* variables / defaults are used instead.
export const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'grantguide',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Friendly message if the DB is unreachable on first query.
export async function assertDbReady() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
  } catch (e) {
    console.error(
      '\n[DB] Could not connect to MySQL. Is XAMPP MySQL running, and did you\n' +
        '     import database/grantguide.sql and set DB_* in your .env?\n' +
        `     (${e.code || e.message})\n`
    );
  }
}
