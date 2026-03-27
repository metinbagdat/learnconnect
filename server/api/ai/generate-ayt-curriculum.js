/**
 * POST /api/ai/generate-ayt-curriculum – AYT Müfredat Üretimi
 * Client path alignment: aiAytService calls this. Same contract as /api/ai/ayt-curriculum.
 */

import { generateAYTCurriculum } from '../lib/ayt-engine.js';

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
    const data = await generateAYTCurriculum();
    return res.status(200).json({ success: true, data: { subjects: data.subjects } });
  } catch (e) {
    console.error('[api/ai/generate-ayt-curriculum]', e);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: e?.message ?? String(e),
    });
  }
}
