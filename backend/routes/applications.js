// routes/applications.js — applications lifecycle.
//   GET   /api/applications              student: own apps | admin: all apps
//   GET   /api/applications/:id          single app + scholarship + documents
//   POST  /api/applications              student: submit application form
//   PATCH /api/applications/:id/status   admin: approve/reject/review (audit + notify)
import { Router } from 'express';
import { pool } from '../config/db.js';
import { ApiError, ok, created, asyncHandler } from '../lib/response.js';
import { Validator } from '../lib/validator.js';
import { authUser, requireRole, logAction } from '../lib/auth.js';

const router = Router();

// ----------------------------- LIST -----------------------------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await authUser(req);

    if (user.role === 'admin') {
      const where = [];
      const args = [];
      if (req.query.status) {
        where.push('a.status = ?');
        args.push(req.query.status);
      }
      let sql = `SELECT a.id, a.status, a.full_name, a.submitted_at, a.scholarship_id,
                        s.title AS scholarship_title, s.provider,
                        u.email AS applicant_email,
                        (SELECT COUNT(*) FROM uploaded_documents d WHERE d.application_id = a.id) AS doc_count
                 FROM applications a
                 JOIN scholarships s ON s.id = a.scholarship_id
                 JOIN users u        ON u.id = a.user_id`;
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY a.submitted_at DESC';
      const [rows] = await pool.query(sql, args);
      return ok(res, { applications: rows });
    }

    const [rows] = await pool.query(
      `SELECT a.id, a.status, a.submitted_at, a.scholarship_id,
              s.title AS scholarship_title, s.provider, s.amount, s.category
       FROM applications a
       JOIN scholarships s ON s.id = a.scholarship_id
       WHERE a.user_id = ? ORDER BY a.submitted_at DESC`,
      [user.id]
    );
    return ok(res, { applications: rows });
  })
);

// ----------------------------- SHOW ------------------------------------------
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await authUser(req);
    const id = Number(req.params.id);

    const [rows] = await pool.query(
      `SELECT a.*, s.title AS scholarship_title, s.provider, s.amount, s.category,
              u.full_name AS applicant_name, u.email AS applicant_email
       FROM applications a
       JOIN scholarships s ON s.id = a.scholarship_id
       JOIN users u        ON u.id = a.user_id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    const app = rows[0];
    if (!app) throw new ApiError('Application not found.', 404);

    // RBAC: students can only see their own.
    if (user.role !== 'admin' && Number(app.user_id) !== Number(user.id)) {
      throw new ApiError('Access denied.', 403);
    }

    const [docs] = await pool.query(
      `SELECT id, requirement_id, label, file_url, file_type, file_size, verified, verify_note, uploaded_at
       FROM uploaded_documents WHERE application_id = ? ORDER BY id`,
      [id]
    );
    app.documents = docs;

    const [history] = await pool.query(
      `SELECT status, note, changed_at FROM application_status
       WHERE application_id = ? ORDER BY id`,
      [id]
    );
    app.history = history;

    return ok(res, { application: app });
  })
);

// ----------------------------- CREATE (student) ------------------------------
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, 'student');
    const body = req.body || {};
    Validator.make(body).required('scholarship_id').required('full_name', 'Full name').validateOrFail();

    const schId = Number(body.scholarship_id);

    const [schRows] = await pool.query('SELECT id, title, status FROM scholarships WHERE id = ? LIMIT 1', [schId]);
    const sch = schRows[0];
    if (!sch) throw new ApiError('Scholarship not found.', 404);
    if (sch.status !== 'open') throw new ApiError('This scholarship is no longer accepting applications.', 422);

    const [dup] = await pool.query(
      'SELECT id FROM applications WHERE user_id = ? AND scholarship_id = ? LIMIT 1',
      [user.id, schId]
    );
    if (dup[0]) throw new ApiError('You have already applied to this scholarship.', 409);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        `INSERT INTO applications
           (user_id, scholarship_id, status, full_name, student_id, course, year_level, gpa, household_income, motivation)
         VALUES (?,?, 'pending', ?,?,?,?,?,?,?)`,
        [
          user.id,
          schId,
          body.full_name,
          body.student_id ?? user.student_id ?? null,
          body.course ?? null,
          body.year_level ?? null,
          body.gpa ?? null,
          body.household_income ?? null,
          body.motivation ?? null,
        ]
      );
      const appId = result.insertId;

      await conn.query(
        'INSERT INTO application_status (application_id, status, note, changed_by) VALUES (?,?,?,?)',
        [appId, 'pending', 'Application submitted by student.', user.id]
      );
      await conn.commit();

      return created(res, { id: appId }, 'Application started. Please upload your documents.');
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

// ----------------------------- UPDATE STATUS (admin) -------------------------
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, 'admin');
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Application id required.', 400);

    const body = req.body || {};
    Validator.make(body)
      .required('status')
      .in('status', ['pending', 'reviewing', 'approved', 'rejected'])
      .validateOrFail();

    const [appRows] = await pool.query('SELECT id, user_id FROM applications WHERE id = ? LIMIT 1', [id]);
    const app = appRows[0];
    if (!app) throw new ApiError('Application not found.', 404);

    const note = body.note ?? null;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE applications SET status = ?, review_note = ?, reviewed_by = ? WHERE id = ?', [
        body.status,
        note,
        admin.id,
        id,
      ]);
      await conn.query(
        'INSERT INTO application_status (application_id, status, note, changed_by) VALUES (?,?,?,?)',
        [id, body.status, note, admin.id]
      );
      await conn.query('INSERT INTO notifications (user_id, title, body) VALUES (?,?,?)', [
        app.user_id,
        'Application ' + body.status,
        `Your application status was updated to "${body.status}".` + (note ? ' Note: ' + note : ''),
      ]);
      await conn.commit();

      await logAction(admin.id, 'update_application_status', 'application', id, body.status);
      return ok(res, {}, 'Application status updated.');
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

export default router;
