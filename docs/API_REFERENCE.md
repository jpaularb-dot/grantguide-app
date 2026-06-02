# GrantGuide — API Reference

Base URL: `{API}/api` (e.g. `http://localhost/grantguide-app/backend/api`).
All requests/responses are JSON unless noted. Authenticated endpoints require:

```
Authorization: Bearer <JWT>
```

Standard envelope:
```json
{ "success": true,  "message": "OK", "data": { ... } }
{ "success": false, "message": "…", "errors": { "field": "…" } }
```

Roles: **public-auth** = any signed-in user · **student** · **admin**.

---

## Auth

| Method | Path             | Role  | Body / Notes |
|--------|------------------|-------|--------------|
| POST   | `/auth/register` | —     | `full_name, email, password (≥8), student_id?` → `{token, user}` |
| POST   | `/auth/login`    | —     | `email, password` → `{token, user}` |
| GET    | `/auth/me`       | auth  | → `{user}` (session restore) |

## Scholarships

| Method | Path                 | Role  | Notes |
|--------|----------------------|-------|-------|
| GET    | `/scholarships`      | auth  | filters: `?status=open&category=grant&search=dost` → `{scholarships[]}` |
| GET    | `/scholarships/{id}` | auth  | → `{scholarship}` incl. `requirements[]` |
| POST   | `/scholarships`      | admin | `title, provider, category, description, eligibility, amount?, slots?, deadline?, status, requirements[]` |
| PUT    | `/scholarships/{id}` | admin | same body; replaces requirements if provided |
| DELETE | `/scholarships/{id}` | admin | cascade-deletes applications & requirements |

## Applications

| Method | Path                          | Role    | Notes |
|--------|-------------------------------|---------|-------|
| GET    | `/applications`               | student | own applications |
| GET    | `/applications`               | admin   | all; filter `?status=pending` |
| GET    | `/applications/{id}`          | owner/admin | → `{application}` incl. `documents[]`, `history[]` |
| POST   | `/applications`               | student | `scholarship_id, full_name, student_id?, course?, year_level?, gpa?, household_income?, motivation?` → `{id}` |
| PATCH  | `/applications/{id}/status`   | admin   | `status (pending\|reviewing\|approved\|rejected), note?` — writes audit + notifies applicant |

## Documents

| Method | Path                      | Role    | Notes |
|--------|---------------------------|---------|-------|
| POST   | `/documents`              | student | **multipart/form-data**: `application_id, requirement_id?, label, file`. Validates type (PDF/JPG/PNG/WEBP) & ≤5MB; uploads to Cloudinary → `{id, file_url, label}` |
| PATCH  | `/documents/{id}/verify`  | admin   | `verified (pending\|verified\|rejected), note?` |

## Notifications

| Method | Path                       | Role | Notes |
|--------|----------------------------|------|-------|
| GET    | `/notifications`           | auth | → `{notifications[], unread}` |
| PATCH  | `/notifications/{id}/read` | auth | marks one read |

## Admin reports

| Method | Path                | Role  | Notes |
|--------|---------------------|-------|-------|
| GET    | `/admin/stats`      | admin | aggregate counts + applications-per-scholarship |
| GET    | `/admin/applicants` | admin | student records with application counts (JOIN) |
| GET    | `/admin/logs`       | admin | audit trail (last 100) |

## Health

| Method | Path          | Role | Notes |
|--------|---------------|------|-------|
| GET    | `/health`     | —    | liveness check |

---

### Status codes used
`200` OK · `201` Created · `400` Bad request · `401` Unauthenticated ·
`403` Forbidden (RBAC) · `404` Not found · `405` Method not allowed ·
`409` Conflict (duplicate) · `422` Validation failed · `500/502` Server/upstream error.
