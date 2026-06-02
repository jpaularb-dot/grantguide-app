// lib/response.js — uniform JSON responses and centralized error handling.
// Mirrors the PHP Response class: every reply is { success, message, data? }.

export class ApiError extends Error {
  constructor(message, status = 400, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const ok = (res, data = {}, message = 'OK') =>
  res.status(200).json({ success: true, message, data });

export const created = (res, data = {}, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

// Wrap async route handlers so thrown errors reach the error handler below.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Final middleware: turns ApiError (and anything uncaught) into clean JSON.
export function errorHandler(err, req, res, _next) {
  // Multer file-size limit.
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(422).json({ success: false, message: 'File exceeds the 5MB limit.' });
  }
  if (err instanceof ApiError) {
    const body = { success: false, message: err.message };
    if (err.errors !== null && err.errors !== undefined) body.errors = err.errors;
    return res.status(err.status).json(body);
  }
  console.error(err);
  const debug = process.env.APP_DEBUG === 'true';
  return res.status(500).json({
    success: false,
    message: debug ? 'Server error: ' + (err?.message ?? '') : 'An unexpected server error occurred.',
  });
}
