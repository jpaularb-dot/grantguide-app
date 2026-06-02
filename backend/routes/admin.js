// routes/admin.js — admin-only reports.
//   GET /api/admin/stats        aggregate metrics for the dashboard
//   GET /api/admin/logs         moderation / audit trail
//   GET /api/admin/applicants   applicant records report
import { Router } from 'express';
import { pool } from '../config/db.js';
import { ok, asyncHandler } from '../lib/response.js';
import { requireRole } from '../lib/auth.js';

const router = Router();

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    await requireRole(req, 'admin');

    const one = async (sql) => {
      const [rows] = await pool.query(sql);
      return Number(Object.values(rows[0])[0]);
    };

    const stats = {
      total_scholarships: await one('SELECT COUNT(*) FROM scholarships'),
      open_scholarships: await one("SELECT COUNT(*) FROM scholarships WHERE status='open'"),
      total_applications: await one('SELECT COUNT(*) FROM applications'),
      pending: await one("SELECT COUNT(*) FROM applications WHERE status='pending'"),
      reviewing: await one("SELECT COUNT(*) FROM applications WHERE status='reviewing'"),
      approved: await one("SELECT COUNT(*) FROM applications WHERE status='approved'"),
      rejected: await one("SELECT COUNT(*) FROM applications WHERE status='rejected'"),
      total_students: await one("SELECT COUNT(*) FROM users WHERE role='student'"),
      pending_documents: await one("SELECT COUNT(*) FROM uploaded_documents WHERE verified='pending'"),
    };

    const [perSch] = await pool.query(
      `SELECT s.title, COUNT(a.id) AS applications
       FROM scholarships s
       LEFT JOIN applications a ON a.scholarship_id = s.id
       GROUP BY s.id ORDER BY applications DESC LIMIT 10`
    );

    return ok(res, { stats, applications_per_scholarship: perSch });
  })
);

router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    await requireRole(req, 'admin');
    const [rows] = await pool.query(
      `SELECT l.id, l.action, l.entity, l.entity_id, l.detail, l.created_at,
              u.full_name AS admin_name
       FROM admin_logs l
       LEFT JOIN users u ON u.id = l.admin_id
       ORDER BY l.id DESC LIMIT 100`
    );
    return ok(res, { logs: rows });
  })
);

router.get(
  '/applicants',
  asyncHandler(async (req, res) => {
    await requireRole(req, 'admin');
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.student_id, u.created_at,
              COUNT(a.id)                                          AS total_applications,
              SUM(CASE WHEN a.status='approved' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN a.status='pending'  THEN 1 ELSE 0 END) AS pending
       FROM users u
       LEFT JOIN applications a ON a.user_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY total_applications DESC, u.full_name ASC`
    );
    return ok(res, { applicants: rows });
  })
);

export default router;
