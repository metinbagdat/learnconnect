import { getTytSubjects } from '../lib/tyt-storage.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const subjects = await getTytSubjects();
    return res.status(200).json(subjects);
  } catch (err) {
    console.error('[api/tyt/subjects]', err);
    return res.status(500).json({ message: 'Failed to fetch TYT subjects' });
  }
}
