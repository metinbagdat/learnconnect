/**
 * POST /api/ai/learning-tree – Konu → Alt konu → Kazanım ağacı
 * Body: { topicTitle, subject? }
 */

import { generateLearningTree } from '../lib/ayt-engine.js';

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
    const { topicTitle, subject } = req.body ?? {};
    if (!topicTitle || typeof topicTitle !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid topicTitle',
      });
    }
    const data = await generateLearningTree(topicTitle, subject ?? 'AYT Matematik');
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('[api/ai/learning-tree]', e);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: e?.message ?? String(e),
    });
  }
}
