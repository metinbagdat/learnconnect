/**
 * Password reset request - sends email via Resend when configured.
 * Uses signed token (no DB table required). Always returns success to avoid email enumeration.
 */
import { getSql, hasDb } from '../lib/db.js';
import { createPasswordResetToken } from '../lib/session-auth.js';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    let userId = 0;
    if (hasDb()) {
      try {
        const sql = getSql();
        const rows = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        userId = rows?.[0]?.id ?? 0;
      } catch (e) {
        // users table may not exist
      }
    }
    const token = createPasswordResetToken(email, userId);
    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'LearnConnect - Şifre Sıfırlama',
        html: `
          <p>Merhaba,</p>
          <p>Şifre sıfırlama talebiniz alındı. Aşağıdaki linke tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Bu link 1 saat geçerlidir.</p>
          <p>LearnConnect Ekibi</p>
        `,
      });
    }
    return res.status(200).json({ message: 'If an account exists, you will receive a password reset link.' });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    return res.status(200).json({ message: 'If an account exists, you will receive a password reset link.' });
  }
}
