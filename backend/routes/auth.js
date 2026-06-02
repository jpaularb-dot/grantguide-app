// routes/auth.js — register / login / me.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError, ok, created, asyncHandler } from '../lib/response.js';
import { Validator } from '../lib/validator.js';
import { issueToken } from '../lib/jwt.js';
import { authUser } from '../lib/auth.js';

const router = Router();

// POST /api/auth/register — create a student account.
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    Validator.make(body)
      .required('full_name', 'Full name')
      .required('email')
      .email('email')
      .required('password')
      .min('password', 8)
      .validateOrFail();

    const [exist] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [body.email]);
    if (exist[0]) throw new ApiError('An account with this email already exists.', 409);

    const fullName = String(body.full_name).trim();
    const email = String(body.email).trim().toLowerCase();
    const hash = await bcrypt.hash(body.password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, student_id, role)
       VALUES (?, ?, ?, ?, 'student')`,
      [fullName, email, hash, body.student_id ?? null]
    );
    const id = result.insertId;

    const token = issueToken({ sub: id, role: 'student' });
    return created(
      res,
      {
        token,
        user: { id, full_name: fullName, email, student_id: body.student_id ?? null, role: 'student' },
      },
      'Account created successfully.'
    );
  })
);

// POST /api/auth/login — authenticate and return a JWT.
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    Validator.make(body).required('email').email('email').required('password').validateOrFail();

    const [rows] = await pool.query(
      `SELECT id, full_name, email, password_hash, student_id, role, is_active
       FROM users WHERE email = ? LIMIT 1`,
      [String(body.email).trim().toLowerCase()]
    );
    const user = rows[0];

    // Generic message to avoid leaking which accounts exist.
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      throw new ApiError('Invalid email or password.', 401);
    }
    if (Number(user.is_active) !== 1) {
      throw new ApiError('This account has been deactivated.', 403);
    }

    const token = issueToken({ sub: user.id, role: user.role });
    delete user.password_hash;
    delete user.is_active;

    return ok(res, { token, user }, 'Signed in successfully.');
  })
);

// GET /api/auth/me — return the authenticated user (session restore).
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await authUser(req);
    return ok(res, { user });
  })
);

export default router;
