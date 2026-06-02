// lib/auth.js — authentication + role-based access control.
import { pool } from '../config/db.js';
import { verifyToken } from './jwt.js';
import { ApiError } from './response.js';

// Extract the Bearer token from the Authorization header.
function bearer(req) {
  const auth = req.headers['authorization'] || '';
  const m = /Bearer\s+(.*)$/i.exec(auth);
  return m ? m[1].trim() : null;
}

// Require a valid token. Returns the fresh user row from the DB.
export async function authUser(req) {
  const token = bearer(req);
  if (!token) throw new ApiError('Authentication required.', 401);

  const payload = verifyToken(token);
  if (!payload || !payload.sub) throw new ApiError('Invalid or expired session.', 401);

  const [rows] = await pool.query(
    `SELECT id, full_name, email, student_id, role, phone, is_active
     FROM users WHERE id = ? LIMIT 1`,
    [payload.sub]
  );
  const user = rows[0];
  if (!user || Number(user.is_active) !== 1) {
    throw new ApiError('Account not found or deactivated.', 401);
  }
  return user;
}

// Require the caller to hold one of the given roles.
export async function requireRole(req, ...roles) {
  const user = await authUser(req);
  if (!roles.includes(user.role)) {
    throw new ApiError('You do not have permission to perform this action.', 403);
  }
  return user;
}

// Record an admin/moderation action for the audit trail.
export async function logAction(adminId, action, entity = null, entityId = null, detail = null) {
  await pool.query(
    `INSERT INTO admin_logs (admin_id, action, entity, entity_id, detail)
     VALUES (?, ?, ?, ?, ?)`,
    [adminId, action, entity, entityId, detail]
  );
}
