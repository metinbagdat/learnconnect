import { getUserFromRequest } from '../lib/session-auth.js';

export default async function handler(req, res) {
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

  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  // Stub: return empty classes until teacher/class management is implemented
  return res.status(200).json({ classes: [] });
}
