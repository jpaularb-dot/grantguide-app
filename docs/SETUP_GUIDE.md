# GrantGuide — Setup & Deployment Guide

This guide walks through everything end to end: XAMPP, database import,
environment configuration, running both apps, Cloudinary, Railway deployment,
admin access, and testing.

---

## 1. Prerequisites

| Tool         | Version            | Notes                                  |
|--------------|--------------------|----------------------------------------|
| XAMPP        | with PHP 8.1+      | provides Apache + MySQL/MariaDB         |
| Node.js      | 18+ (LTS)          | for the React frontend                 |
| Cloudinary   | free account       | optional locally, recommended for prod |
| Railway      | free account       | for deployment (optional)              |

PHP must have `pdo_mysql` and `curl` enabled (both are on by default in XAMPP).

---

## 2. XAMPP setup

1. Install XAMPP and open the **XAMPP Control Panel**.
2. Start **Apache** and **MySQL**.
3. Place the backend so Apache can serve it. Copy the whole project into your
   XAMPP `htdocs` folder, e.g.:
   ```
   C:\xampp\htdocs\grantguide-app\backend\...
   ```
   The backend will then be reachable at
   `http://localhost/grantguide-app/backend`.

> The `backend/.htaccess` enables clean routing through `index.php`. XAMPP's
> Apache already loads `mod_rewrite`, so no extra config is needed.

---

## 3. Import the database

1. Open phpMyAdmin: `http://localhost/phpmyadmin`.
2. Click **Import** (top menu). You do **not** need to create a database first —
   the script does it.
3. Choose `database/grantguide.sql` and click **Go**.
4. You should now see a `grantguide` database with 8 tables and seeded
   scholarships.

CLI alternative:
```bash
mysql -u root < database/grantguide.sql
```

---

## 4. Configure the backend environment

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env       # on Windows: copy .env.example .env
   ```
2. Edit `backend/.env`:
   ```ini
   APP_URL=http://localhost/grantguide-app/backend
   JWT_SECRET=<paste a long random string>
   CORS_ORIGIN=http://localhost:5173
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=grantguide
   DB_USER=root
   DB_PASS=
   # Cloudinary optional locally (see section 7)
   ```
   Generate a secret with: `openssl rand -hex 32` (or any long random string).

3. **Set the demo passwords (one-time).** Run the initializer so the seed
   accounts get real bcrypt hashes:
   ```bash
   php backend/tools/init_admin.php
   ```
   or open `http://localhost/grantguide-app/backend/tools/init_admin.php`
   in a browser. It prints the credentials shown in section 9.

4. **Verify the API is alive:** open
   `http://localhost/grantguide-app/backend/api/health` →
   `{"success":true,"service":"GrantGuide API","status":"ok"}`.

---

## 5. Run the frontend

```bash
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
# edit .env so VITE_API_URL points at the backend:
#   VITE_API_URL=http://localhost/grantguide-app/backend
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). Sign in with a demo
account from section 9.

To build for production: `npm run build` → static files in `frontend/dist/`.

---

## 6. Running the backend without XAMPP (optional)

You can use PHP's built-in server instead of Apache:
```bash
cd backend
php -S localhost:8000 index.php
```
Then set the frontend `VITE_API_URL=http://localhost:8000`. (You still need a
running MySQL — XAMPP's MySQL is fine.)

---

## 7. Cloudinary setup

Cloudinary stores uploaded documents and scholarship images. The API secret
stays on the server; only the resulting URL + metadata are saved to MySQL.

1. Create a free account at cloudinary.com.
2. On your dashboard, copy **Cloud name**, **API Key**, and **API Secret**.
3. Add them to `backend/.env`:
   ```ini
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart the backend. Uploads now go to Cloudinary under the
   `grantguide/applications/<id>` folder.

> **Local fallback:** if these are left blank, uploads are saved to
> `backend/uploads/` and served locally, so you can develop without a
> Cloudinary account. Use real credentials for any shared/production deploy.

---

## 8. Railway deployment

Railway hosts the PHP backend (Docker) and a managed MySQL database.

### 8.1 Create the database
1. New Project → **Add MySQL**.
2. Railway exposes `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`,
   `MYSQLPASSWORD`. The backend reads these automatically.
3. Import the schema into Railway's MySQL using its connection details:
   ```bash
   mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE> < database/grantguide.sql
   ```

### 8.2 Deploy the backend
1. New Service → **Deploy from GitHub repo** (push this project first) and set
   the **Root Directory** to `backend/`. Railway detects the `Dockerfile`.
2. Add service **Variables**:
   ```
   JWT_SECRET=<long random string>
   CORS_ORIGIN=https://<your-frontend-domain>
   APP_URL=https://<your-backend-domain>
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
   (The `MYSQL*` variables come from the MySQL plugin — reference them or use
   Railway's shared variables.)
3. Deploy. Railway gives you a public URL; verify `…/api/health`.
4. Run the admin initializer once against the deployed DB (locally pointing at
   Railway's MySQL, or via a one-off `railway run php backend/tools/init_admin.php`),
   then **delete** `backend/tools/init_admin.php`.

### 8.3 Frontend
Build the frontend with `VITE_API_URL` set to the Railway backend URL and host
the `dist/` output on any static host (Railway static site, Netlify, Vercel,
GitHub Pages). Make sure the backend `CORS_ORIGIN` matches the frontend origin.

---

## 9. Admin / account access

| Role    | Email                   | Password        | Can do                                                |
|---------|-------------------------|-----------------|-------------------------------------------------------|
| Admin   | `admin@grantguide.ph`   | `Admin@12345`   | manage scholarships, verify docs, review & decide, view reports & logs |
| Student | `student@grantguide.ph` | `Student@12345` | browse, apply (form + docs), track status             |

New students self-register from the sign-in screen. Admin accounts are not
self-service — create more by inserting a `users` row with `role='admin'`
(hash the password with `password_hash`) or by extending `init_admin.php`.

---

## 10. Testing procedures

### Smoke test (manual)
1. **Health:** open `…/api/health` → `status: ok`.
2. **Register:** create a new student from the UI → lands on the dashboard.
3. **Browse:** the five real scholarships appear; "Apply Now" is enabled on open ones.
4. **Apply (integrated flow):**
   - Step 1 shows eligibility + requirements.
   - Step 2 form validates required fields.
   - Step 3 blocks "Continue" until every required document is attached;
     rejects files >5MB or wrong type.
   - Step 4 review → **Submit** → success screen.
5. **Track:** "My Applications" shows the new application as `pending`.
6. **Admin:** sign in as admin → Review Applications → open the new one →
   verify a document → set status to `approved` with a note.
7. **Student again:** the application now shows `approved` and the office note;
   a notification was created.
8. **RBAC:** while logged in as a student, calling an admin endpoint returns
   `403`. The admin nav/pages are not shown to students.

### API checks (curl)
```bash
# login
curl -X POST …/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@grantguide.ph","password":"Admin@12345"}'

# use the returned token
curl …/api/admin/stats -H "Authorization: Bearer <TOKEN>"
```

### Common issues
- **DB connection failed** → check `.env` DB_* values / that MySQL is running.
- **401 on every call** → `JWT_SECRET` changed after a token was issued; sign in again.
- **CORS error in browser** → set `CORS_ORIGIN` to the exact frontend origin.
- **Login fails right after import** → you didn't run `init_admin.php` (section 4.3).
- **Uploads fail** → file >5MB or unsupported type; or Cloudinary creds wrong
  (clear them to use the local fallback while debugging).
