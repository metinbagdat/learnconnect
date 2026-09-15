import { getUserFromRequest } from '../../../lib/session-auth.js';
import {
  getDailyTaskById,
  completeDailyStudyTask,
} from '../../../lib/tyt-storage.js';
import { applyDailyTaskCompletionToProgress } from '../../../lib/tyt-progress-pipeline.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const taskId = parseInt(req.query?.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const actualDuration = body.actualDuration;

    const task = await getDailyTaskById(taskId, user.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (task.completed) {
      return res.status(200).json({
        idempotent: true,
        task,
        progressEvaluation: null,
      });
    }

    const completed = await completeDailyStudyTask(taskId, user.id, actualDuration);
    if (!completed) {
      const again = await getDailyTaskById(taskId, user.id);
      if (again?.completed) {
        return res.status(200).json({ idempotent: true, task: again, progressEvaluation: null });
      }
      return res.status(404).json({ message: 'Task not found' });
    }

    let progressEvaluation = { applied: [], meta: null, coachQueue: { ok: false } };
    try {
      progressEvaluation = await applyDailyTaskCompletionToProgress(user.id, task, actualDuration);
    } catch (pe) {
      console.error('[api/tyt/tasks/complete] progress pipeline', pe);
    }

    return res.status(200).json({ ...completed, progressEvaluation });
  } catch (err) {
    console.error('[api/tyt/tasks/complete]', err);
    return res.status(500).json({ message: 'Failed to complete task' });
  }
}
