import { getUserFromRequest } from '../../lib/session-auth.js';
import { getDailyStudyTasks } from '../../lib/tyt-storage.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { date, startDate, endDate } = req.query || {};
  try {
    const tasks = await getDailyStudyTasks(user.id, date, startDate, endDate);
    return res.status(200).json(tasks);
  } catch (err) {
    console.error('[api/tyt/tasks]', err);
    return res.status(500).json({ message: 'Failed to fetch daily tasks' });
  }
}
