import { getUserFromRequest } from '../lib/session-auth.js';
import { hasDb, parseJsonBody, insertLearnerTask } from '../lib/lms-phase2.js';

function setCors(req, res) {
  const origin = req.headers.origin || 'https://www.egitim.today';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

  const role = String(user.role || '');
  if (role !== 'teacher' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!hasDb()) {
    return res.status(503).json({ message: 'Database not configured' });
  }

  try {
    const body = parseJsonBody(req);
    const studentUserId = Number(body.studentUserId);
    const title = String(body.title || '').trim();
    const taskType = String(body.taskType || 'ödev').trim() || 'ödev';
    const dueAt = body.dueAt ? String(body.dueAt) : null;

    if (!studentUserId || Number.isNaN(studentUserId)) {
      return res.status(400).json({ message: 'studentUserId required' });
    }
    if (!title) {
      return res.status(400).json({ message: 'title required' });
    }

    const task = await insertLearnerTask({
      studentUserId,
      title,
      taskType,
      dueAt,
      assignedByUserId: user.id,
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error('[api/teacher/learner-tasks]', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
