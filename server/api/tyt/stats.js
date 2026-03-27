import { getUserFromRequest } from '../lib/session-auth.js';
import { getTytStudyStats } from '../lib/tyt-storage.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const stats = await getTytStudyStats(user.id);
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[api/tyt/stats]', err);
    return res.status(500).json({ message: 'Failed to fetch TYT study stats' });
  }
}
