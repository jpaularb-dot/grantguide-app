// lib/upload.js — file uploads tied to an application.
// Validates real file type by magic bytes (does NOT trust the client MIME),
// enforces a 5MB limit, and stores locally under /uploads. If Cloudinary
// credentials are set in .env, uploads go there instead.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { ApiError } from './response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Reads `file` (field name) from a multipart/form-data request into memory.
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
}).single('file');

// Detect the real file type from the first bytes of the buffer.
function detectType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf.slice(0, 5).toString('latin1') === '%PDF-') return { ext: 'pdf', mime: 'application/pdf' };
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: 'png', mime: 'image/png' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP')
    return { ext: 'webp', mime: 'image/webp' };
  return null;
}

function cloudinaryConfigured() {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Validate + store one uploaded file. Returns { url, public_id, type, size }.
export async function storeUpload(file, folder = 'grantguide') {
  if (!file) throw new ApiError('No file provided.', 422);
  if (file.size > MAX_BYTES) throw new ApiError('File exceeds the 5MB limit.', 422);

  const detected = detectType(file.buffer);
  if (!detected) throw new ApiError('Only PDF, JPG, PNG, and WEBP files are allowed.', 422);

  return cloudinaryConfigured()
    ? toCloudinary(file, detected, folder)
    : toLocal(file, detected);
}

function toLocal(file, detected) {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = crypto.randomBytes(16).toString('hex') + '.' + detected.ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  // Store a RELATIVE path; the frontend resolves it against the backend base
  // URL. This avoids depending on an APP_URL env var and works on any host.
  return {
    url: '/uploads/' + name,
    public_id: 'local:' + name,
    type: detected.mime,
    size: file.size,
  };
}

async function toCloudinary(file, detected, folder) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const ts = Math.floor(Date.now() / 1000);

  // Signature: sha1 of sorted "param=value" pairs + api_secret.
  const toSign = `folder=${folder}&timestamp=${ts}`;
  const signature = crypto.createHash('sha1').update(toSign + secret).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: detected.mime }), file.originalname || 'upload');
  form.append('api_key', key);
  form.append('timestamp', String(ts));
  form.append('folder', folder);
  form.append('signature', signature);

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: 'POST',
    body: form,
  });
  const res = await resp.json().catch(() => ({}));
  if (!resp.ok || !res.secure_url) throw new ApiError('Cloud storage upload failed.', 502);

  return {
    url: res.secure_url,
    public_id: res.public_id || null,
    type: detected.mime,
    size: file.size,
  };
}
