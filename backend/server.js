// server.js — GrantGuide API (Node.js + Express).
// Mirrors the previous PHP backend's routes and JSON responses exactly,
// so the React frontend keeps working without changes.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorHandler } from './lib/response.js';
import { assertDbReady } from './config/db.js';

import authRoutes from './routes/auth.js';
import scholarshipRoutes from './routes/scholarships.js';
import applicationRoutes from './routes/applications.js';
import documentRoutes from './routes/documents.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve locally-stored uploaded files (when not using Cloudinary).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check.
app.get(['/', '/api', '/api/health'], (req, res) =>
  res.json({ success: true, service: 'GrantGuide API', status: 'ok' })
);

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 + error handling.
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint not found.' }));
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, async () => {
  await assertDbReady();
  console.log(`GrantGuide API (Node) running at http://localhost:${PORT}`);
});
