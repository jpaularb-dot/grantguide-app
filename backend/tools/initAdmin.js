// tools/initAdmin.js — set/reset the seed accounts' passwords with real bcrypt
// hashes. Run ONCE after importing database/grantguide.sql:
//
//   npm run init-admin       (from the backend folder)
//
// Safe to re-run; it upserts the two default accounts.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const accounts = [
  ['Scholarship Office', 'admin@grantguide.ph', 'Admin@12345', 'admin', null],
  ['Juan dela Cruz', 'student@grantguide.ph', 'Student@12345', 'student', '2024-00001'],
];

async function run() {
  for (const [name, email, plain, role, sid] of accounts) {
    const hash = await bcrypt.hash(plain, 10);
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_id)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash),
                               full_name     = VALUES(full_name),
                               role          = VALUES(role)`,
      [name, email, hash, role, sid]
    );
  }
  console.log(
    'Seed accounts ready:\n' +
      '  admin@grantguide.ph   / Admin@12345\n' +
      '  student@grantguide.ph / Student@12345'
  );
  await pool.end();
}

run().catch((e) => {
  console.error('init-admin failed:', e.message);
  process.exit(1);
});
