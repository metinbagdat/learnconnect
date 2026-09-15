import { getUserFromRequest, guestUser } from './lib/session-auth.js';

// Session-backed user endpoint for serverless auth flow.
export default function handler(req, res) {
  const origin = req.headers.origin || 'https://www.egitim.today';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(200).json(guestUser());
  }

  return res.status(200).json(user);
}
