/**
 * Password change for logged-in users.
 * Requires users table when DATABASE_URL is set.
 */
import { createHash } from 'node:crypto';
import { getUserFromRequest } from '../lib/session-auth.js';
import { getSql, hasDb } from '../lib/db.js';

function hashPassword(password) {
  return createHash('sha256').update(password + (process.env.SESSION_SECRET || 'salt')).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '').trim();
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (!hasDb()) {
      return res.status(503).json({
        message: 'Şifre değişikliği şu an yapılandırılmamış. Veritabanı bağlantısı gerekli.',
      });
    }
    const sql = getSql();
    const rows = await sql`SELECT id, password_hash FROM users WHERE id = ${user.id} LIMIT 1`;
    const u = rows?.[0];
    if (!u) {
      return res.status(404).json({ message: 'User not found' });
    }
    const currentHash = hashPassword(currentPassword);
    if (u.password_hash !== currentHash) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }
    const newHash = hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${user.id}`;
    return res.status(200).json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('[user/change-password]', err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
}
