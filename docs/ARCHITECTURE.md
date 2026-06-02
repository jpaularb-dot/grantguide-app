# GrantGuide — Architecture

## Overview

GrantGuide is a decoupled full-stack app:

- **Frontend** — React 19 + Vite + Tailwind. A single-page app with a small
  state-based router and role-aware shell. Talks to the backend over JSON.
- **Backend** — PHP 8 REST API. No framework; a thin front controller
  (`index.php`) dispatches clean routes to endpoint files. PDO + MySQL with
  prepared statements everywhere.
- **Storage** — MySQL for relational data; Cloudinary for binary documents
  (only URLs + metadata are persisted in MySQL).

```
Browser (React SPA)
   │  fetch + Bearer JWT
   ▼
PHP front controller (index.php)  ──▶  endpoint  ──▶  lib (Auth, Validator, Cloudinary)
   │                                       │
   │                                       ├─ PDO ──▶ MySQL (8 tables)
   │                                       └─ cURL ─▶ Cloudinary
```

## Request lifecycle

1. `.htaccess` rewrites all traffic to `index.php` (Apache), or PHP's built-in
   server uses `index.php` as the router directly.
2. `index.php` normalises the path, handles `/uploads/*` and `/api/health`,
   then maps `/api/{resource}/{id}/{action}` to the right endpoint file and
   stashes route params.
3. Each endpoint includes `lib/bootstrap.php` (CORS, DB, helpers, JSON error
   handler), authenticates/authorizes via `Auth`, validates input via
   `Validator`, runs prepared statements, and returns a uniform JSON envelope.

## Security model

- **Passwords** — bcrypt via `password_hash` / `password_verify`.
- **Sessions** — stateless HS256 JWT (`lib/JWT.php`), 7-day expiry, signed with
  `JWT_SECRET`. Sent as `Authorization: Bearer`.
- **RBAC** — `Auth::requireRole('admin')` gates every write/admin endpoint;
  the frontend additionally hides admin UI from students. Ownership checks stop
  students from reading other users' applications/documents.
- **SQL injection** — all queries use PDO prepared statements with bound params
  (`ATTR_EMULATE_PREPARES = false`).
- **Uploads** — server re-checks the real MIME type (`finfo`) and 5MB cap; the
  Cloudinary secret never reaches the client.
- **Errors** — uncaught exceptions become generic JSON 500s (no stack traces
  unless `APP_DEBUG=true`).

## Database schema (3NF)

```
users (1) ───< applications (N) >─── (1) scholarships
  │                  │                        │
  │                  │                        └──< scholarship_requirements
  │                  ├──< uploaded_documents >── (0..1) scholarship_requirements
  │                  └──< application_status (history)
  ├──< notifications
  └──< admin_logs
```

| Table                     | Purpose                                  | Key relationships |
|---------------------------|------------------------------------------|-------------------|
| `users`                   | students & admins (RBAC via `role`)      | —                 |
| `scholarships`            | real programs                            | `created_by → users` |
| `scholarship_requirements`| required docs per program (1:N)          | `→ scholarships` (cascade) |
| `applications`            | one student's submission                 | `→ users`, `→ scholarships`; unique `(user, scholarship)` |
| `uploaded_documents`      | files on Cloudinary (URL + metadata)     | `→ applications` (cascade), `→ requirements` |
| `application_status`      | audit trail of every status change       | `→ applications`, `→ users` |
| `notifications`           | per-user messages                        | `→ users` (cascade) |
| `admin_logs`              | moderation/audit of admin actions        | `→ users` |

Representative JOINs: application detail joins `applications × scholarships ×
users`; the admin dashboard aggregates `scholarships LEFT JOIN applications`;
the applicants report aggregates `users LEFT JOIN applications` with conditional
sums.

## Frontend structure

```
src/
├── api/client.js          fetch wrapper (JWT, JSON + multipart)
├── context/AuthContext    session state + restore
├── components/            Icon, Shell (role-aware), shared UI primitives
├── lib/theme.js           design tokens
├── pages/
│   ├── AuthPage           login / register
│   ├── student/           Dashboard · Browse · ApplyWizard · Applications
│   └── admin/             AdminDashboard · ManageScholarships · ReviewApplications · Applicants · Logs
└── App.jsx                session gating + role-based routing
```

The **ApplyWizard** is the integrated workflow: it loads the scholarship with
its requirements, collects the form, stages one file per requirement (with
client-side type/size checks), blocks progress until all required documents are
present, then on submit creates the application and uploads every document in
sequence — without ever leaving the page.

## Notable decisions

- **No PHP framework / no Composer** — keeps the project runnable on a stock
  XAMPP install with zero `composer install` step. JWT is implemented in ~40
  lines rather than pulling a dependency.
- **State router instead of React Router** — the app has few top-level views;
  a role-keyed map keeps the bundle small and the RBAC obvious.
- **Cloudinary with a local fallback** — lets students develop offline while
  still demonstrating real cloud storage when configured.
- **Front controller + `.htaccess`** — the same routing works on XAMPP Apache,
  the PHP built-in server, and the Railway Docker (Apache) image.
