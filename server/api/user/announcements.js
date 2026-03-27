import { getUserFromRequest } from '../lib/session-auth.js';
import { hasDb, listActiveAnnouncements } from '../lib/lms-phase2.js';

function setCors(req, res) {
  const origin = req.headers.origin || 'https://www.egitim.today';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(req, res);
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

  if (!hasDb()) {
    return res.status(200).json({ announcements: [], source: 'no_database' });
  }

  try {
    const announcements = await listActiveAnnouncements();
    return res.status(200).json({ announcements, source: 'neon' });
  } catch (err) {
    console.error('[api/user/announcements]', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
