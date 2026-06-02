// lib/jwt.js — HS256 JSON Web Tokens (same claims/secret as the old PHP version).
import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'change-this-in-your-env-file';

// Create a signed token. ttl = lifetime in seconds (default 7 days).
export const issueToken = (claims, ttlSeconds = 604800) =>
  jwt.sign(claims, secret(), { algorithm: 'HS256', expiresIn: ttlSeconds });

// Verify a token and return its payload, or null on failure.
export function verifyToken(token) {
  try {
    return jwt.verify(token, secret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}
