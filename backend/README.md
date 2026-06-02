# GrantGuide Backend — Node.js + Express

This is the API for GrantGuide. It connects to a **MySQL** database (the one you
run in **XAMPP** and manage in **phpMyAdmin**) and serves the same REST endpoints
the React frontend already expects, so nothing in the frontend code had to change.

## Requirements

- **Node.js 18 or newer** (for the built-in `fetch`/`FormData` used by uploads)
- **XAMPP** with **MySQL** started (Apache is not required — Node serves the API)

## Setup (first time)

1. **Start MySQL** in the XAMPP Control Panel.

2. **Import the database.** In phpMyAdmin, click *Import*, choose
   `database/grantguide.sql`, and run it. It creates the `grantguide` database
   and all tables itself.

3. **Configure the backend.** In this `backend/` folder:

   ```bash
   cp .env.example .env      # Windows (PowerShell):  copy .env.example .env
   ```

   The defaults already match XAMPP (`root` user, empty password, port 3306).
   Edit `.env` only if your MySQL differs. Set a real `JWT_SECRET`.

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Create the login accounts** (sets real bcrypt passwords on the seed users):

   ```bash
   npm run init-admin
   ```

   This sets up:
   - `admin@grantguide.ph` / `Admin@12345` (admin)
   - `student@grantguide.ph` / `Student@12345` (student)

6. **Run the server:**

   ```bash
   npm run dev     # auto-restarts on file changes
   # or
   npm start
   ```

   The API runs at `http://localhost:4000`. Open it in a browser — you should
   see `{"success":true,"service":"GrantGuide API","status":"ok"}`.

## Run the frontend against it

In the `frontend/` folder, copy `.env.example` to `.env` (it already points to
`http://localhost:4000`), then `npm install` and `npm run dev`.

## Project layout

```
backend/
  server.js            Express app + route mounting + health check
  config/db.js         MySQL connection pool (reads DB_* from .env)
  lib/
    response.js        JSON helpers, ApiError, error handler
    validator.js       chainable input validation
    jwt.js             HS256 token issue/verify
    auth.js            token check, role guard, audit log
    upload.js          multer + file-type check + local/Cloudinary storage
  routes/
    auth.js            /api/auth/register | login | me
    scholarships.js    /api/scholarships  (CRUD)
    applications.js    /api/applications  (+ /:id/status)
    documents.js       /api/documents     (+ /:id/verify)
    notifications.js   /api/notifications (+ /:id/read)
    admin.js           /api/admin/stats | logs | applicants
  tools/initAdmin.js   one-time seed-account password setup
  uploads/             locally stored files (when Cloudinary is not configured)
```

## Notes

- **File uploads** are stored in `backend/uploads/` by default. If you fill in the
  `CLOUDINARY_*` values in `.env`, uploads go to Cloudinary instead.
- The database schema in `database/grantguide.sql` did **not** change — it is the
  same MySQL/phpMyAdmin database as before.
