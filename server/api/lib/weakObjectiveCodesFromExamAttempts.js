/**
 * Derive weakest curriculum objective codes from Supabase exam_attempts.topic_scores.
 * Used to auto-fill curriculumHints for daily task generation (learning loop).
 */
import { getSupabaseAdmin } from './supabase-admin.js';

/**
 * @param {string} supabaseUserId - auth.users UUID
 * @param {{ limit?: number, attemptLimit?: number }} [opts]
 * @returns {Promise<{ codes: string[], attemptsConsidered: number, error?: string }>}
 */
export async function fetchWeakObjectiveCodesFromExamAttempts(supabaseUserId, opts = {}) {
  const limit = Math.min(16, Math.max(1, Number(opts.limit) || 8));
  const attemptLimit = Math.min(20, Math.max(1, Number(opts.attemptLimit) || 8));

  if (!supabaseUserId || typeof supabaseUserId !== 'string') {
    return { codes: [], attemptsConsidered: 0, error: 'invalid_supabase_user_id' };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: attempts, error } = await supabase
      .from('exam_attempts')
      .select('topic_scores, score, completed_at')
      .eq('student_id', supabaseUserId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(attemptLimit);

    if (error) throw error;

    const rows = attempts || [];
    /** @type {Map<string, number>} code -> best (lowest) score = weakest */
    const minByCode = new Map();

    for (const row of rows) {
      const ts = row.topic_scores;
      if (!ts || typeof ts !== 'object') continue;
      for (const [code, raw] of Object.entries(ts)) {
        if (!code || typeof code !== 'string') continue;
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isNaN(num)) continue;
        const prev = minByCode.get(code);
        if (prev === undefined || num < prev) {
          minByCode.set(code, num);
        }
      }
    }

    const sorted = [...minByCode.entries()].sort((a, b) => a[1] - b[1]).map(([code]) => code);
    const codes = sorted.slice(0, limit);

    return { codes, attemptsConsidered: rows.length };
  } catch (e) {
    console.error('[weakObjectiveCodesFromExamAttempts]', e);
    return {
      codes: [],
      attemptsConsidered: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Resolve Supabase auth UUID for a Neon session user (no DB migration required).
 * Priority: explicit body → profile field → JSON env map.
 *
 * @param {{ neonUserId: number, profile?: object, body?: object }} p
 * @returns {string | null}
 */
export function resolveSupabaseUserIdForNeonUser(p) {
  const fromBody = p.body && typeof p.body === 'object' ? p.body.supabaseUserId : null;
  if (fromBody && typeof fromBody === 'string' && fromBody.length > 10) {
    return fromBody.trim();
  }

  const prof = p.profile && typeof p.profile === 'object' ? p.profile : null;
  const fromProfile = prof?.supabaseUserId || prof?.supabase_user_id;
  if (fromProfile && typeof fromProfile === 'string' && fromProfile.length > 10) {
    return fromProfile.trim();
  }

  const rawMap = process.env.NEON_TO_SUPABASE_USER_MAP;
  if (rawMap && String(rawMap).trim().startsWith('{')) {
    try {
      const map = JSON.parse(rawMap);
      const key = String(p.neonUserId);
      const id = map[key];
      if (id && typeof id === 'string' && id.length > 10) return id.trim();
    } catch {
      /* ignore */
    }
  }

  return null;
}
