import { getUserFromRequest } from '../../lib/session-auth.js';
import { getTytTrialExams, createTytTrialExam } from '../../lib/tyt-storage.js';
import { evaluateTytTrialProgress } from '../../lib/tyt-progress-pipeline.js';

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
      const priorTrials = await getTytTrialExams(user.id);
      const prevNet =
        priorTrials?.[0]?.netScore != null ? Number(priorTrials[0].netScore) : null;

      const trial = await createTytTrialExam(user.id, body);
      if (!trial) return res.status(500).json({ message: 'Failed to create trial' });

      const newNet = Number(trial.netScore ?? trial.net_score);
      const netDrop =
        prevNet != null && !Number.isNaN(newNet) && newNet < prevNet - 3;

      let progressEvaluation = { subjectUpdates: [], topicsTouched: 0, coachQueue: { ok: false } };
      try {
        progressEvaluation = await evaluateTytTrialProgress(user.id, trial, { netDrop });
      } catch (ev) {
        console.error('[api/tyt/trials] evaluate pipeline', ev);
      }
      return res.status(201).json({ ...trial, progressEvaluation });
    } catch (err) {
      console.error('[api/tyt/trials]', err);
      return res.status(500).json({ message: 'Failed to create trial exam' });
    }
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
