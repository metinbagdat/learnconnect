/**
 * POST /api/ai/study-plan – Her konuya AI çalışma planı
 * Body: { topicTitle, estimatedHours?, studentLevel?, dailyHours?, userId?, topicId? }
 */

import { generateStudyPlan } from '../lib/ayt-engine.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
  }

  try {
    const b = req.body ?? {};
    const topicTitle = b.topicTitle;
    const estimatedHours = b.totalHours ?? b.estimatedHours ?? 8;
    const studentLevel = b.level ?? b.studentLevel ?? 'orta';
    const dailyHours = b.dailyHours ?? 2;
    const { userId, topicId } = b;

    if (!topicTitle || typeof topicTitle !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid topicTitle',
      });
    }

    const data = await generateStudyPlan(
      topicTitle,
      Number(estimatedHours) || 8,
      typeof studentLevel === 'string' ? studentLevel : 'orta',
      Number(dailyHours) || 2
    );
    return res.status(200).json({
      success: true,
      data: { ...data, _meta: { userId, topicId } },
    });
  } catch (e) {
    console.error('[api/ai/study-plan]', e);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: e?.message ?? String(e),
    });
  }
}
