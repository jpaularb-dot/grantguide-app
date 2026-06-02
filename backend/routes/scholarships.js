// routes/scholarships.js — CRUD for scholarship programs.
//   GET    /api/scholarships          list (filter by status/category/search)
//   GET    /api/scholarships/:id      single program + its requirements
//   POST   /api/scholarships          create  (admin)
//   PUT    /api/scholarships/:id      update  (admin)
//   DELETE /api/scholarships/:id      delete  (admin)
import { Router } from 'express';
import { pool } from '../config/db.js';
import { ApiError, ok, created, asyncHandler } from '../lib/response.js';
import { Validator } from '../lib/validator.js';
import { authUser, requireRole, logAction } from '../lib/auth.js';

const router = Router();
const nullIfEmpty = (v) => (v === '' || v === undefined || v === null ? null : v);

// Insert the requirements rows for a scholarship (used by create + update).
async function insertRequirements(conn, scholarshipId, requirements) {
  const list = Array.isArray(requirements) ? requirements : [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const label = typeof r === 'object' && r !== null ? r.label ?? '' : r;
    if (String(label ?? '').trim() === '') continue;
    const description = typeof r === 'object' && r !== null ? r.description ?? null : null;
    await conn.query(
      `INSERT INTO scholarship_requirements (scholarship_id, label, description, sort_order)
       VALUES (?, ?, ?, ?)`,
      [scholarshipId, label, description, i]
    );
  }
}

// ----------------------------- READ (any signed-in user) --------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await authUser(req); // must be authenticated, any role

    const where = [];
    const args = [];
    if (req.query.status) {
      where.push('s.status = ?');
      args.push(req.query.status);
    }
    if (req.query.category) {
      where.push('s.category = ?');
      args.push(req.query.category);
    }
    if (req.query.search) {
      where.push('(s.title LIKE ? OR s.provider LIKE ?)');
      args.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    let sql = `SELECT s.*, COUNT(r.id) AS requirement_count
               FROM scholarships s
               LEFT JOIN scholarship_requirements r ON r.scholarship_id = s.id`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY s.id ORDER BY s.status ASC, s.deadline ASC, s.id DESC';

    const [rows] = await pool.query(sql, args);
    return ok(res, { scholarships: rows });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await authUser(req);
    const id = Number(req.params.id);

    const [rows] = await pool.query(
      `SELECT s.*, u.full_name AS created_by_name
       FROM scholarships s
       LEFT JOIN users u ON u.id = s.created_by
       WHERE s.id = ? LIMIT 1`,
      [id]
    );
    const scholarship = rows[0];
    if (!scholarship) throw new ApiError('Scholarship not found.', 404);

    const [reqs] = await pool.query(
      `SELECT id, label, description, is_required, sort_order
       FROM scholarship_requirements
       WHERE scholarship_id = ? ORDER BY sort_order, id`,
      [id]
    );
    scholarship.requirements = reqs;
    return ok(res, { scholarship });
  })
);

// ----------------------------- WRITE (admin only) ---------------------------
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, 'admin');
    const body = req.body || {};
    Validator.make(body)
      .required('title')
      .required('provider')
      .required('description')
      .required('eligibility')
      .in('category', ['scholarship', 'grant', 'gig'])
      .in('status', ['open', 'closed'])
      .validateOrFail();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        `INSERT INTO scholarships
           (title, provider, category, description, eligibility, amount, slots, deadline, image_url, status, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          body.title,
          body.provider,
          body.category ?? 'scholarship',
          body.description,
          body.eligibility,
          body.amount ?? null,
          nullIfEmpty(body.slots),
          nullIfEmpty(body.deadline),
          nullIfEmpty(body.image_url),
          body.status ?? 'open',
          admin.id,
        ]
      );
      const newId = result.insertId;
      await insertRequirements(conn, newId, body.requirements);
      await conn.commit();

      await logAction(admin.id, 'create_scholarship', 'scholarship', newId, body.title);
      return created(res, { id: newId }, 'Scholarship created.');
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, 'admin');
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Scholarship id required.', 400);

    const body = req.body || {};
    Validator.make(body)
      .required('title')
      .required('provider')
      .required('description')
      .required('eligibility')
      .validateOrFail();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE scholarships SET title=?, provider=?, category=?, description=?, eligibility=?,
           amount=?, slots=?, deadline=?, image_url=?, status=? WHERE id=?`,
        [
          body.title,
          body.provider,
          body.category ?? 'scholarship',
          body.description,
          body.eligibility,
          body.amount ?? null,
          nullIfEmpty(body.slots),
          nullIfEmpty(body.deadline),
          nullIfEmpty(body.image_url),
          body.status ?? 'open',
          id,
        ]
      );

      // Replace requirements if provided.
      if (Array.isArray(body.requirements)) {
        await conn.query('DELETE FROM scholarship_requirements WHERE scholarship_id = ?', [id]);
        await insertRequirements(conn, id, body.requirements);
      }
      await conn.commit();

      await logAction(admin.id, 'update_scholarship', 'scholarship', id, body.title);
      return ok(res, {}, 'Scholarship updated.');
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const admin = await requireRole(req, 'admin');
    const id = Number(req.params.id);
    if (!id) throw new ApiError('Scholarship id required.', 400);

    await pool.query('DELETE FROM scholarships WHERE id = ?', [id]);
    await logAction(admin.id, 'delete_scholarship', 'scholarship', id);
    return ok(res, {}, 'Scholarship deleted.');
  })
);

export default router;
