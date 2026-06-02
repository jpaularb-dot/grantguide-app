# GrantGuide

A full-stack scholarship and grant management platform for students and a
Scholarship Office / Admin. Students browse **real** programs (CHED, DOST,
OWWA), apply through a single integrated form-and-document workflow, and track
their status live. Admins manage listings, verify documents, and approve or
reject applications with full audit logging.

```
React 19 + Vite + Tailwind  ──HTTP/JSON──▶  Node.js + Express REST API  ──mysql2──▶  MySQL
                                                  │
                                                  └─▶ Cloudinary (optional document storage)
```

> **Backend is Node.js (Express).** It connects to the same MySQL database you
> run in XAMPP / phpMyAdmin. See **[`backend/README.md`](backend/README.md)** for
> setup and run steps. (The older PHP version of the backend is in your original
> project download if you ever need to compare.)

## What's inside

```
grantguide-app/
├── frontend/      React + Vite single-page app (student + admin UIs)
├── backend/       Node.js + Express REST API (mysql2, JWT auth, RBAC, uploads)
├── database/      grantguide.sql — schema + real CHED/DOST/OWWA seed data
└── docs/          SETUP_GUIDE.md · API_REFERENCE.md · ARCHITECTURE.md
```

## Key features

- **Integrated apply workflow** — review → form → document upload → submit, all
  on one page as a guided multi-step wizard. Required documents are validated
  before submission.
- **Two roles with RBAC** — `student` and `admin` (Scholarship Office),
  enforced on both the frontend and the backend.
- **Real programs** — CHED Tulong-Dunong, DOST-SEI, OWWA EDSP & OFWDSP, and
  CHED–Coca-Cola STEM, each with structured eligibility and requirements.
- **Secure backend** — bcrypt password hashing, JWT sessions, prepared
  statements everywhere, server-side validation, structured JSON errors.
- **Normalized database** — 8 related tables with foreign keys and JOINs.
- **Cloudinary** — signed server-side uploads; only URLs + metadata are stored.
- **Deploy-ready** — Dockerfile + `railway.json` for Railway; XAMPP for local.

## Quick start (local / XAMPP)

1. **Database** — start MySQL in XAMPP, then import `database/grantguide.sql`
   via phpMyAdmin (it creates the `grantguide` database for you).
2. **Backend** — copy `backend/.env.example` → `backend/.env`, put the `backend/`
   folder under `htdocs/grantguide-app/`, then run the one-time
   `php backend/tools/init_admin.php` to set the demo passwords.
3. **Frontend** — `cd frontend`, copy `.env.example` → `.env`, then
   `npm install && npm run dev`. Open the printed URL (default
   `http://localhost:5173`).

Full, detailed steps — including Cloudinary and Railway — are in
[`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md).

## Demo accounts

After running `init_admin.php`:

| Role    | Email                   | Password       |
|---------|-------------------------|----------------|
| Admin   | `admin@grantguide.ph`   | `Admin@12345`  |
| Student | `student@grantguide.ph` | `Student@12345`|

> Delete `backend/tools/init_admin.php` before deploying to production.
