import { getUserFromRequest } from '../lib/session-auth.js';
import {
  hasDb,
  parseJsonBody,
  listLearnerTasksForStudent,
  insertLearnerTask,
  updateLearnerTaskStatus,
} from '../lib/lms-phase2.js';

function setCors(req, res) {
  const origin = req.headers.origin || 'https://www.egitim.today';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
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

  if (!hasDb()) {
    if (req.method === 'GET') {
      return res.status(200).json({ tasks: [], source: 'no_database' });
    }
    return res.status(503).json({ message: 'Database not configured' });
  }

  try {
    if (req.method === 'GET') {
      const tasks = await listLearnerTasksForStudent(user.id);
      return res.status(200).json({ tasks, source: 'neon' });
    }

    if (req.method === 'PATCH') {
      const body = parseJsonBody(req);
      const taskId = Number(body.id);
      const status = String(body.status || 'done').trim();
      if (!taskId || Number.isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task id' });
      }
      if (status !== 'done' && status !== 'pending') {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const ok = await updateLearnerTaskStatus(taskId, user.id, status);
      if (!ok) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.status(200).json({ ok: true, id: taskId, status });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req);
      const title = String(body.title || '').trim();
      const taskType = String(body.taskType || 'ödev').trim() || 'ödev';
      const dueAt = body.dueAt ? String(body.dueAt) : null;
      if (!title) {
        return res.status(400).json({ message: 'Title required' });
      }
      const task = await insertLearnerTask({
        studentUserId: user.id,
        title,
        taskType,
        dueAt,
        assignedByUserId: null,
      });
      return res.status(201).json({ task });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('[api/user/learner-tasks]', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
