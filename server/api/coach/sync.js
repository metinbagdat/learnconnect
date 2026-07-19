import { getUserFromRequest } from '../lib/session-auth.js';
import { hasDb } from '../lib/db.js';
import {
  getCoachSyncStatus,
  processCoachSync,
} from '../lib/ai-coach-queue.js';
import {
  fetchWeakObjectiveCodesFromExamAttempts,
  resolveSupabaseUserIdForNeonUser,
} from '../lib/weakObjectiveCodesFromExamAttempts.js';

function setCors(req, res) {
  const origin = req.headers.origin || 'https://www.egitim.today';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const raw = req.body;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
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

  const userId = Number(user.id);

  if (!hasDb()) {
    return res.status(503).json({ message: 'Database not configured', code: 'NO_DATABASE_URL' });
  }

  if (req.method === 'GET') {
    try {
      const status = await getCoachSyncStatus(userId);
      return res.status(200).json({ ok: true, ...status });
    } catch (e) {
      console.error('[api/coach/sync GET]', e);
      return res.status(500).json({ message: 'Failed to read coach sync status' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = parseBody(req);
  const date =
    body.date && /^\d{4}-\d{2}-\d{2}$/.test(String(body.date))
      ? String(body.date)
      : new Date().toISOString().split('T')[0];
  const replaceExisting = body.replaceExisting !== false;

  const profileHints = {};
  if (user.profile && typeof user.profile === 'object') {
    if (user.profile.dailyStudyHours != null) {
      profileHints.dailyHours = Number(user.profile.dailyStudyHours);
    }
    if (user.profile.targetExam) {
      profileHints.targetExam = String(user.profile.targetExam);
    }
  }

  let curriculumHints =
    body.curriculumHints && typeof body.curriculumHints === 'object' ? { ...body.curriculumHints } : {};

  const manualCodes = Array.isArray(curriculumHints.weakObjectiveCodes)
    ? curriculumHints.weakObjectiveCodes.map(String).filter(Boolean)
    : [];

  if (!manualCodes.length && body.autoCurriculumFromExamAttempts !== false) {
    const supabaseUserId = resolveSupabaseUserIdForNeonUser({
      neonUserId: userId,
      profile: user.profile,
      body,
    });
    if (supabaseUserId) {
      const { codes } = await fetchWeakObjectiveCodesFromExamAttempts(supabaseUserId, {
        limit: 12,
        attemptLimit: 10,
      });
      if (codes.length) {
        curriculumHints = { ...curriculumHints, weakObjectiveCodes: codes };
      }
    }
  }

  try {
    const result = await processCoachSync(userId, {
      date,
      replaceExisting,
      profileHints,
      curriculumHints: Object.keys(curriculumHints).length ? curriculumHints : undefined,
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('[api/coach/sync POST]', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Coach sync failed',
    });
  }
}
