import { getUserFromRequest } from '../../lib/session-auth.js';
import { getTytTrialExams, createTytTrialExam } from '../../lib/tyt-storage.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method === 'GET') {
    try {
      const trials = await getTytTrialExams(user.id);
      return res.status(200).json(trials);
    } catch (err) {
      console.error('[api/tyt/trials]', err);
      return res.status(500).json({ message: 'Failed to fetch trial exams' });
    }
  }
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const trial = await createTytTrialExam(user.id, body);
      if (!trial) return res.status(500).json({ message: 'Failed to create trial' });
      return res.status(201).json(trial);
    } catch (err) {
      console.error('[api/tyt/trials]', err);
      return res.status(500).json({ message: 'Failed to create trial exam' });
    }
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
