// routes/documents.js — document uploads tied to an application.
//   POST  /api/documents               student: multipart upload
//         fields: application_id, requirement_id?, label, file
//   PATCH /api/documents/:id/verify     admin: mark verified/rejected
import { Router } from 'express';
import { pool } from '../config/db.js';
import { ApiError, ok, created, asyncHandler } from '../lib/response.js';
import { Validator } from '../lib/validator.js';
import { requireRole, logAction } from '../lib/auth.js';
import { uploadMiddleware, storeUpload } from '../lib/upload.js';

const router = Router();

// ----------------------------- UPLOAD (student) -----------------------------
router.post(
  '/',
  uploadMiddleware,
  asyncHandler(async (req, res) => {
    const user = await requireRole(req, 'student');

    const appId = Number(req.body.application_id || 0);
    const label = String(req.body.label ?? 'Document').trim() || 'Document';
    const reqId =
      req.body.requirement_id !== undefined && req.body.requirement_id !== ''
        ? Number(req.body.requirement_id)
        : null;

    if (!appId) throw new ApiError('application_id is required.', 422);
    if (!req.file) throw new ApiError('No file provided.', 422);

    // Ownership check.
    const [appRows] = await pool.query('SELECT id, user_id FROM applications WHERE id = ? LIMIT 1', [appId]);
    const app = appRows[0];
    if (!app) throw new ApiError('Application not found.', 404);
    if (Number(app.user_id) !== Number(user.id)) throw new ApiError('Access denied.', 403);

    const result = await storeUpload(req.file, `grantguide/applications/${appId}`);

    const [ins] = await pool.query(
      `INSERT INTO uploaded_documents
         (application_id, requirement_id, label, file_url, public_id, file_type, file_size)
       VALUES (?,?,?,?,?,?,?)`,
      [appId, reqId, label, result.url, result.public_id, result.type, result.size]
    );

    return created(res, { id: ins.insertId, file_url: result.url, label }, 'Document uploaded.');
  })
);

// ----------------------------- VERIFY (admin) -------------------------------
router.patch(
  '/:id/verify',
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, 'admin');
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Document id required.', 400);

    const body = req.body || {};
    Validator.make(body).in('verified', ['pending', 'verified', 'rejected']).validateOrFail();

    await pool.query('UPDATE uploaded_documents SET verified = ?, verify_note = ? WHERE id = ?', [
      body.verified ?? 'verified',
      body.note ?? null,
      id,
    ]);

    await logAction(admin.id, 'verify_document', 'document', id, body.verified ?? 'verified');
    return ok(res, {}, 'Document verification updated.');
  })
);

export default router;
