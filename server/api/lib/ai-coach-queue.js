/**
 * AI Coach / arka plan işleri — pipeline sonunda kuyruğa alınır (DB audit + worker tüketimi).
 * Gerçek LLM çağrısı burada yapılmaz; satır `user_activity_logs` içinde `action = coach_pipeline` olarak saklanır.
 *
 * `processCoachSync` — bekleyen kuyruk satırlarını tüketir: `plan_generate` → `generateDailyTasks`,
 * `coach_context_refresh` → stub log (LLM için yer ayırır).
 */
import { getSql, hasDb } from './db.js';
import { generateDailyTasks } from './learningOrchestrator.js';

export const COACH_QUEUE_VERSION = 1;

/** Neon/Postgres jsonb bazen string döner; jobs okumadan önce normalize et. */
export function parseLogMetadata(raw) {
  if (raw == null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * @typedef {{ type: string, trigger?: string, priority?: number }} CoachJob
 */

/**
 * @param {number} userId
 * @param {object} envelope
 * @param {'task_complete'|'trial_evaluated'} envelope.source
 * @param {object} [envelope.progressEvaluation]
 * @param {object} [envelope.taskMeta]
 * @param {number} [envelope.trialNet]
 * @param {boolean} [envelope.netDrop]
 * @returns {Promise<{ ok: boolean, jobs?: CoachJob[], reason?: string, error?: string }>}
 */
export async function enqueueCoachPipelineJobs(userId, envelope) {
  if (!hasDb() || !userId) {
    return { ok: false, reason: 'no_db_or_user' };
  }
  const jobs = buildJobsFromEnvelope(envelope);
  if (!jobs.length) {
    return { ok: true, jobs: [], reason: 'no_jobs' };
  }
  try {
    const sql = getSql();
    const metadata = {
      v: COACH_QUEUE_VERSION,
      queuedAt: new Date().toISOString(),
      jobs,
      envelope: sanitizeEnvelopeForLog(envelope),
    };
    await sql`
      INSERT INTO user_activity_logs (user_id, action, resource_type, metadata)
      VALUES (${userId}, ${'coach_pipeline'}, ${'queue'}, ${JSON.stringify(metadata)})
    `;
    return { ok: true, jobs };
  } catch (e) {
    console.error('[ai-coach-queue] enqueue failed', e);
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Log boyutunu sınırla (metadata çok şişmesin).
 */
function sanitizeEnvelopeForLog(envelope) {
  const e = { ...envelope };
  if (e.progressEvaluation?.applied?.length > 20) {
    e.progressEvaluation = {
      ...e.progressEvaluation,
      applied: e.progressEvaluation.applied.slice(0, 20),
      appliedTruncated: true,
    };
  }
  if (e.progressEvaluation?.subjectUpdates?.length > 20) {
    e.progressEvaluation = {
      ...e.progressEvaluation,
      subjectUpdates: e.progressEvaluation.subjectUpdates.slice(0, 20),
      subjectUpdatesTruncated: true,
    };
  }
  return e;
}

/**
 * @param {object} envelope
 * @returns {CoachJob[]}
 */
function buildJobsFromEnvelope(envelope) {
  const jobs = [];
  const src = envelope?.source;

  if (src === 'task_complete') {
    jobs.push({
      type: 'plan_generate',
      trigger: 'task_completed',
      priority: 2,
    });
    jobs.push({
      type: 'coach_context_refresh',
      trigger: 'task_after',
      priority: 1,
    });
  }

  if (src === 'trial_evaluated') {
    jobs.push({
      type: 'plan_generate',
      trigger: 'trial_scores_updated',
      priority: 3,
    });
    jobs.push({
      type: 'coach_context_refresh',
      trigger: 'test_after',
      priority: 1,
    });
    if (envelope.netDrop) {
      jobs.push({
        type: 'coach_context_refresh',
        trigger: 'net_drop',
        priority: 0,
      });
    }
  }

  return jobs;
}

// --- Senkron tüketici (coach_pipeline → günlük plan + context stub) ---

/**
 * @param {number} userId
 * @returns {Promise<number>}
 */
export async function getLastProcessedCoachLogId(userId) {
  if (!hasDb() || !userId) return 0;
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT metadata FROM user_activity_logs
      WHERE user_id = ${userId} AND action = ${'coach_pipeline_processed'}
      ORDER BY id DESC LIMIT 1
    `;
    const id = parseLogMetadata(rows?.[0]?.metadata)?.processedThroughLogId;
    return id != null ? Number(id) : 0;
  } catch (e) {
    console.error('[ai-coach-queue] getLastProcessedCoachLogId', e);
    return 0;
  }
}

/**
 * @param {number} userId
 * @param {number} afterId
 * @returns {Promise<Array<{ id: number, metadata: object, created_at: string }>>}
 */
export async function fetchPendingCoachPipelineRows(userId, afterId) {
  if (!hasDb() || !userId) return [];
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, metadata, created_at
      FROM user_activity_logs
      WHERE user_id = ${userId}
        AND action = ${'coach_pipeline'}
        AND id > ${afterId}
        AND created_at >= NOW() - INTERVAL '7 days'
      ORDER BY id ASC
    `;
    return (rows || []).map((r) => ({
      id: r.id,
      metadata: parseLogMetadata(r.metadata),
      created_at: r.created_at,
    }));
  } catch (e) {
    console.error('[ai-coach-queue] fetchPendingCoachPipelineRows', e);
    return [];
  }
}

/**
 * @param {Array<{ id: number, metadata?: object }>} rows
 */
export function summarizeCoachQueueJobs(rows) {
  let planGenerate = 0;
  let coachContextRefresh = 0;
  for (const row of rows || []) {
    const jobs = Array.isArray(row.metadata?.jobs) ? row.metadata.jobs : [];
    for (const j of jobs) {
      if (j?.type === 'plan_generate') planGenerate += 1;
      if (j?.type === 'coach_context_refresh') coachContextRefresh += 1;
    }
  }
  return { planGenerate, coachContextRefresh };
}

/**
 * @param {number} userId
 * @param {number} throughLogId
 */
export async function markCoachPipelineProcessed(userId, throughLogId) {
  if (!hasDb() || !userId || !throughLogId) return { ok: false };
  try {
    const sql = getSql();
    await sql`
      INSERT INTO user_activity_logs (user_id, action, resource_type, metadata)
      VALUES (${userId}, ${'coach_pipeline_processed'}, ${'coach'}, ${JSON.stringify({
        processedThroughLogId: throughLogId,
        syncedAt: new Date().toISOString(),
        v: COACH_QUEUE_VERSION,
      })})
    `;
    return { ok: true };
  } catch (e) {
    console.error('[ai-coach-queue] markCoachPipelineProcessed', e);
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Bekleyen coach_pipeline satırlarını işler.
 * @param {number} userId
 * @param {{ profileHints?: object, date?: string, curriculumHints?: object, replaceExisting?: boolean }} [options]
 */
export async function processCoachSync(userId, options = {}) {
  if (!hasDb() || !userId) {
    return { ok: false, reason: 'no_db_or_user' };
  }

  const afterId = await getLastProcessedCoachLogId(userId);
  const pending = await fetchPendingCoachPipelineRows(userId, afterId);

  if (!pending.length) {
    return {
      ok: true,
      ran: false,
      reason: 'no_pending',
      lastProcessedLogId: afterId,
      pendingJobSummary: { planGenerate: 0, coachContextRefresh: 0 },
    };
  }

  const summary = summarizeCoachQueueJobs(pending);
  const needsPlan = summary.planGenerate > 0;
  const needsContext = summary.coachContextRefresh > 0;

  const date =
    options.date && /^\d{4}-\d{2}-\d{2}$/.test(String(options.date))
      ? String(options.date)
      : new Date().toISOString().split('T')[0];
  const replaceExisting = options.replaceExisting !== false;
  const profileHints = options.profileHints && typeof options.profileHints === 'object' ? options.profileHints : {};
  const curriculumHints =
    options.curriculumHints && typeof options.curriculumHints === 'object' ? options.curriculumHints : undefined;

  /** @type {object | null} */
  let planResult = null;
  /** @type {object | null} */
  let contextStub = null;

  if (needsPlan) {
    planResult = await generateDailyTasks({
      userId,
      date,
      replaceExisting,
      profileHints,
      curriculumHints,
    });
    if (planResult?.meta && typeof planResult.meta === 'object') {
      planResult.meta.coachSyncSource = 'coach_pipeline';
    }
  }

  if (needsContext) {
    try {
      const sql = getSql();
      await sql`
        INSERT INTO user_activity_logs (user_id, action, resource_type, metadata)
        VALUES (${userId}, ${'coach_context_refresh'}, ${'coach'}, ${JSON.stringify({
          stub: true,
          note: 'Hazır: LLM coach bağlanınca burada bağlam yenilenecek.',
          pendingRowIds: pending.map((r) => r.id),
          v: COACH_QUEUE_VERSION,
        })})
      `;
      contextStub = { logged: true };
    } catch (e) {
      console.error('[ai-coach-queue] context stub', e);
      contextStub = { logged: false, error: String(e?.message || e) };
    }
  }

  const maxId = Math.max(...pending.map((r) => r.id));
  await markCoachPipelineProcessed(userId, maxId);

  return {
    ok: true,
    ran: true,
    lastProcessedLogId: afterId,
    processedThroughLogId: maxId,
    pendingJobSummary: summary,
    needsPlan,
    needsContext,
    planResult,
    contextStub,
  };
}

/**
 * GET /api/coach/sync için özet (işlem yapmaz).
 * @param {number} userId
 */
export async function getCoachSyncStatus(userId) {
  const lastProcessedLogId = await getLastProcessedCoachLogId(userId);
  const pending = await fetchPendingCoachPipelineRows(userId, lastProcessedLogId);
  return {
    lastProcessedLogId,
    pendingRows: pending.length,
    pendingJobSummary: summarizeCoachQueueJobs(pending),
    pendingLogIds: pending.map((r) => r.id),
  };
}
