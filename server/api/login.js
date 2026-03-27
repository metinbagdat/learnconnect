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

function getDemoUsers() {
  return [
    {
      id: 1001,
      username: 'demo',
      password: 'demo123',
      displayName: 'Demo Öğrenci',
      role: 'student',
      profile: { grade: '12. Sınıf', targetExam: 'TYT' },
    },
    {
      id: 1002,
      username: 'admin',
      password: 'admin123',
      displayName: 'Admin Kullanıcı',
      role: 'admin',
      profile: { grade: null, targetExam: null },
    },
    {
      id: 1003,
      username: 'teacher',
      password: 'teacher123',
      displayName: 'Öğretmen Kullanıcı',
      role: 'teacher',
      profile: { grade: null, targetExam: null },
    },
  ];
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

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const users = getDemoUsers();
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createSessionToken(user);
  setSessionCookie(res, token);

  const { password: _password, ...safeUser } = user;
  return res.status(200).json(safeUser);
}
