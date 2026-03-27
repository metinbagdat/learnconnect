import { getUserFromRequest } from '../../lib/session-auth.js';
import { createDailyStudyTasksBatch } from '../../lib/tyt-storage.js';

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
    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const defaultDate = body.defaultDate || new Date().toISOString().split('T')[0];
    const created = await createDailyStudyTasksBatch(user.id, tasks, defaultDate);
    return res.status(201).json(created);
  } catch (err) {
    console.error('[api/tyt/tasks/batch]', err);
    return res.status(500).json({ message: 'Failed to create tasks' });
  }
}
