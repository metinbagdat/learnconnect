/**
 * AI Coach / arka plan işleri — pipeline sonunda kuyruğa alınır (DB audit + worker tüketimi).
 * Gerçek LLM çağrısı burada yapılmaz; satır `user_activity_logs` içinde `action = coach_pipeline` olarak saklanır.
 */
import { getSql, hasDb } from './db.js';

export const COACH_QUEUE_VERSION = 1;

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
