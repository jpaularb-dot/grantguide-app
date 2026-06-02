// routes/notifications.js
//   GET   /api/notifications             list current user's notifications
//   PATCH /api/notifications/:id/read    mark one as read
import { Router } from 'express';
import { pool } from '../config/db.js';
import { ApiError, ok, asyncHandler } from '../lib/response.js';
import { authUser } from '../lib/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await authUser(req);
    const [rows] = await pool.query(
      `SELECT id, title, body, is_read, created_at
       FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
      [user.id]
    );
    const unread = rows.reduce((n, r) => n + (Number(r.is_read) ? 0 : 1), 0);
    return ok(res, { notifications: rows, unread });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const user = await authUser(req);
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Notification id required.', 400);
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, user.id]);
    return ok(res, {}, 'Marked as read.');
  })
);

export default router;
