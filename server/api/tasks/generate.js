import { getUserFromRequest } from '../lib/session-auth.js';
import { hasDb } from '../lib/db.js';
import { generateDailyTasks } from '../lib/learningOrchestrator.js';
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

/** In-memory rate limit: max 3 successful POST generations per user per calendar day. */
const successCountByUserDay = new Map();

function rateLimitKey(userId, dateStr) {
  return `${userId}:${dateStr}`;
}

function isUnderDailyLimit(userId, dateStr) {
  const n = successCountByUserDay.get(rateLimitKey(userId, dateStr)) || 0;
  return n < 3;
}

function recordSuccessfulGeneration(userId, dateStr) {
  const key = rateLimitKey(userId, dateStr);
  successCountByUserDay.set(key, (successCountByUserDay.get(key) || 0) + 1);
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
  const today = new Date().toISOString().split('T')[0];

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message:
        'POST with optional body { date, replaceExisting, curriculumHints?, autoCurriculumFromExamAttempts?, supabaseUserId? }. When autoCurriculumFromExamAttempts is not false and weakObjectiveCodes are omitted, weakest codes are loaded from Supabase exam_attempts.topic_scores if a Supabase user id is resolved (profile.supabaseUserId, body.supabaseUserId, or NEON_TO_SUPABASE_USER_MAP).',
      orchestrator: true,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!hasDb()) {
    return res.status(503).json({ message: 'Database not configured', code: 'NO_DATABASE_URL' });
  }

  const body = parseBody(req);
  const date =
    body.date && /^\d{4}-\d{2}-\d{2}$/.test(String(body.date))
      ? String(body.date)
      : today;
  const replaceExisting = body.replaceExisting !== false;

  if (!isUnderDailyLimit(userId, date)) {
    return res.status(429).json({
      message: 'Daily generation limit reached (3 successful runs per day for this date).',
      code: 'RATE_LIMIT',
    });
  }

  try {
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

    let weakSource = manualCodes.length ? 'manual' : 'none';
    let weakAutoMeta = {};

    const autoOn = body.autoCurriculumFromExamAttempts !== false;
    if (!manualCodes.length && autoOn) {
      const supabaseUserId = resolveSupabaseUserIdForNeonUser({
        neonUserId: userId,
        profile: user.profile,
        body,
      });

      if (supabaseUserId) {
        const { codes, attemptsConsidered, error: weakErr } = await fetchWeakObjectiveCodesFromExamAttempts(
          supabaseUserId,
          { limit: 12, attemptLimit: 10 },
        );
        if (codes.length) {
          curriculumHints = { ...curriculumHints, weakObjectiveCodes: codes };
          weakSource = 'exam_attempts';
          weakAutoMeta = {
            examAttemptsConsidered: attemptsConsidered,
            supabaseUserResolved: true,
          };
        } else {
          weakAutoMeta = {
            examAttemptsConsidered: attemptsConsidered,
            supabaseUserResolved: true,
            weakObjectiveAutoNote: weakErr || 'no_topic_scores_or_empty',
          };
        }
      } else {
        weakAutoMeta = {
          supabaseUserResolved: false,
          weakObjectiveAutoNote: 'set profile.supabaseUserId, body.supabaseUserId, or NEON_TO_SUPABASE_USER_MAP',
        };
      }
    } else if (manualCodes.length) {
      curriculumHints.weakObjectiveCodes = manualCodes;
    }

    const result = await generateDailyTasks({
      userId,
      date,
      replaceExisting,
      profileHints,
      curriculumHints: Object.keys(curriculumHints).length ? curriculumHints : undefined,
    });

    if (result.meta && typeof result.meta === 'object') {
      result.meta.curriculumWeakCodesSource = weakSource;
      Object.assign(result.meta, weakAutoMeta);
    }

    recordSuccessfulGeneration(userId, date);

    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error('[api/tasks/generate]', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Failed to generate tasks',
    });
  }
}
