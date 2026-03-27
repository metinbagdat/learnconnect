import { createSessionToken, setSessionCookie } from './lib/session-auth.js';

function setCommonHeaders(req, res) {
  const origin = req.headers.origin || 'https://www.egitim.today';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCommonHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const displayName = String(req.body?.displayName || username || '').trim();
  const role = String(req.body?.role || 'student').trim() || 'student';

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Stateless serverless fallback registration: create ephemeral session user.
  const user = {
    id: Date.now(),
    username,
    displayName,
    role,
    profile: { grade: null, targetExam: null },
  };

  const token = createSessionToken(user);
  setSessionCookie(res, token);

  return res.status(201).json(user);
}
