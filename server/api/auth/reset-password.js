/**
 * Password reset - verifies token and updates password.
 * Requires users table with password_hash when DATABASE_URL is set.
 */
import { createHash } from 'node:crypto';
import { getSql, hasDb } from '../lib/db.js';
import { verifyPasswordResetToken } from '../lib/session-auth.js';

function hashPassword(password) {
  return createHash('sha256').update(password + (process.env.SESSION_SECRET || 'salt')).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const token = body.token || req.query?.token;
    const newPassword = String(body.password || '').trim();
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }
    if (!hasDb()) {
      return res.status(503).json({ message: 'Password reset is not configured. Please contact support.' });
    }
    const sql = getSql();
    const hashed = hashPassword(newPassword);
    if (payload.userId) {
      await sql`UPDATE users SET password_hash = ${hashed}, updated_at = NOW() WHERE id = ${payload.userId}`;
    } else if (payload.email) {
      await sql`UPDATE users SET password_hash = ${hashed}, updated_at = NOW() WHERE email = ${payload.email}`;
    } else {
      return res.status(400).json({ message: 'Invalid reset token' });
    }
    return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}
