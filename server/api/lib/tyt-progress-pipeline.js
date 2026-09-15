/**
 * TYT — görev tamamlama → user_topic_progress ve deneme → konu bazlı güncelleme (evaluate pipeline).
 * LLM kullanmaz; kural tabanlıdır.
 */
import { getSql, hasDb } from './db.js';
import { getTytSubjects } from './tyt-storage.js';
import { enqueueCoachPipelineJobs } from './ai-coach-queue.js';

/** TYT deneme: ders bazlı maksimum net (yaklaşık) */
const SUBJECT_NET_CAP = {
  Matematik: 40,
  Türkçe: 40,
  Fen: 20,
  Sosyal: 20,
};

/**
 * @param {string | null | undefined} description
 * @returns {{ kind: string, topicId: number | null, subjectId: number | null }}
 */
export function parseOrchestratorTaskDescription(description) {
  if (!description || typeof description !== 'string') {
    return { kind: 'unknown', topicId: null, subjectId: null };
  }
  const topicMatch = description.match(/topic_id=(\d+)/);
  const subjectMatch = description.match(/subject_id=(\d+)/);
  const topicId = topicMatch ? Number(topicMatch[1]) : null;
  const subjectId = subjectMatch ? Number(subjectMatch[1]) : null;
  /** Örnek: `[orchestrator v1] TYT | study | topic_id=1` veya `practice | topic_id=1` */
  let kind = 'unknown';
  if (/\|\s*study\b/i.test(description)) kind = 'study';
  else if (/\bpractice\s*\|/i.test(description) || /\|\s*practice\b/i.test(description)) kind = 'practice';
  else if (/\|\s*exam\b/i.test(description)) kind = 'exam';
  else if (/\|\s*review\b/i.test(description) || /\]\s*review\s*$/i.test(description.trim())) kind = 'review';
  return { kind, topicId, subjectId };
}

async function bumpTopicProgress(userId, topicId, deltaPercent, extraMinutes = 0) {
  if (!hasDb() || !topicId) return null;
  const sql = getSql();
  const existing = await sql`
    SELECT id, progress_percent, time_spent_minutes
    FROM user_topic_progress
    WHERE user_id = ${userId} AND topic_id = ${topicId}
    LIMIT 1
  `;
  const prev = Number(existing?.[0]?.progress_percent) || 0;
  const next = Math.min(100, prev + Math.max(0, deltaPercent));
  const mastery = Math.min(5, Math.floor(next / 20));
  const status = next >= 100 ? 'completed' : next > 0 ? 'studying' : 'not_started';
  const timeAdd = Math.max(0, Number(extraMinutes) || 0);

  if (existing?.[0]?.id) {
    await sql`
      UPDATE user_topic_progress SET
        progress_percent = ${next},
        mastery_level = ${mastery},
        status = ${status},
        time_spent_minutes = COALESCE(time_spent_minutes, 0) + ${timeAdd},
        last_studied_at = NOW(),
        updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
  } else {
    await sql`
      INSERT INTO user_topic_progress (
        user_id, topic_id, status, progress_percent, mastery_level,
        time_spent_minutes, last_studied_at, updated_at
      ) VALUES (
        ${userId}, ${topicId}, ${status}, ${next}, ${mastery},
        ${timeAdd}, NOW(), NOW()
      )
    `;
  }
  return { topicId, previousPercent: prev, nextPercent: next };
}

async function topicIdsForSubject(subjectId) {
  if (!hasDb() || !subjectId) return [];
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM tyt_topics WHERE subject_id = ${subjectId} ORDER BY id ASC
  `;
  return (rows || []).map((r) => r.id);
}

async function bumpWeakestProgressSlots(userId, limit, deltaPercent) {
  if (!hasDb()) return [];
  const sql = getSql();
  const rows = await sql`
    SELECT topic_id FROM user_topic_progress
    WHERE user_id = ${userId}
    ORDER BY progress_percent ASC NULLS FIRST, topic_id ASC
    LIMIT ${limit}
  `;
  const out = [];
  for (const r of rows || []) {
    const res = await bumpTopicProgress(userId, r.topic_id, deltaPercent, 0);
    if (res) out.push(res);
  }
  return out;
}

/**
 * Günlük görev tamamlandığında çağrılır (daily_tasks satırı güncellendikten sonra).
 * @param {number} userId
 * @param {{ title?: string, description?: string | null }} taskRow
 * @param {number} [actualDurationMinutes]
 * @returns {Promise<{ applied: object[] }>}
 */
export async function applyDailyTaskCompletionToProgress(userId, taskRow, actualDurationMinutes) {
  const desc = taskRow?.description || '';
  const meta = parseOrchestratorTaskDescription(desc);
  const minutes = Math.min(240, Math.max(0, Number(actualDurationMinutes) || 0));
  const applied = [];

  if (meta.kind === 'study' && meta.topicId) {
    const r = await bumpTopicProgress(userId, meta.topicId, 12, minutes || 25);
    if (r) applied.push({ action: 'study', ...r });
  } else if (meta.kind === 'practice' && meta.topicId) {
    const r = await bumpTopicProgress(userId, meta.topicId, 18, minutes || 30);
    if (r) applied.push({ action: 'practice', ...r });
  } else if (meta.kind === 'exam' && meta.subjectId) {
    const tids = await topicIdsForSubject(meta.subjectId);
    const share = tids.length ? Math.max(3, Math.round(24 / tids.length)) : 0;
    for (const tid of tids.slice(0, 10)) {
      const r = await bumpTopicProgress(userId, tid, share, Math.round(minutes / Math.max(1, tids.length)));
      if (r) applied.push({ action: 'exam_subject', ...r });
    }
  } else if (meta.kind === 'review') {
    const slots = await bumpWeakestProgressSlots(userId, 3, 4);
    for (const s of slots) applied.push({ action: 'review', ...s });
  }

  let coachQueue = { ok: false, reason: 'unknown' };
  try {
    coachQueue = await enqueueCoachPipelineJobs(userId, {
      source: 'task_complete',
      progressEvaluation: { applied, meta },
    });
  } catch (e) {
    console.error('[tyt-progress-pipeline] coach queue (task)', e);
    coachQueue = { ok: false, error: String(e?.message || e) };
  }

  return { applied, meta, coachQueue };
}

/** scoreKey (ör. Fen, Sosyal) ile tyt_subjects satırını eşleştirir. */
function resolveSubjectFromScoreKey(subjects, scoreKey) {
  const k = String(scoreKey || '').trim();
  if (!k) return null;
  if (k === 'Matematik' || k === 'Türkçe') {
    return subjects.find((s) => s.title === k) || null;
  }
  if (k === 'Fen') {
    return subjects.find((s) => /fen/i.test(s.title)) || null;
  }
  if (k === 'Sosyal') {
    return subjects.find((s) => /sosyal/i.test(s.title)) || null;
  }
  return subjects.find((s) => s.title === k) || null;
}

function maxNetForSubjectTitle(title) {
  const t = String(title || '');
  if (/Matematik/i.test(t)) return SUBJECT_NET_CAP.Matematik;
  if (/Türkçe/i.test(t)) return SUBJECT_NET_CAP.Türkçe;
  if (/Fen/i.test(t)) return SUBJECT_NET_CAP.Fen;
  if (/Sosyal/i.test(t)) return SUBJECT_NET_CAP.Sosyal;
  return 40;
}

/**
 * Deneme kaydından sonra konu ilerlemesini günceller (evaluate adımı).
 * @param {number} userId
 * @param {{ subjectScores?: object, subject_scores?: object, id?: number, netScore?: number, net_score?: number }} trial
 * @param {{ netDrop?: boolean }} [opts]
 * @returns {Promise<{ subjectUpdates: object[], topicsTouched: number }>}
 */
export async function evaluateTytTrialProgress(userId, trial, opts = {}) {
  const raw = trial?.subjectScores ?? trial?.subject_scores;
  let scores = raw;
  if (typeof scores === 'string') {
    try {
      scores = JSON.parse(scores);
    } catch {
      scores = null;
    }
  }

  const subjectUpdates = [];
  let topicsTouched = 0;

  if (scores && typeof scores === 'object') {
    const subjects = await getTytSubjects();

    for (const [scoreKey, rawVal] of Object.entries(scores)) {
      const net =
        typeof rawVal === 'number'
          ? rawVal
          : rawVal && typeof rawVal === 'object' && 'net' in rawVal
            ? Number(rawVal.net)
            : Number(rawVal);
      if (Number.isNaN(net)) continue;

      const sub = resolveSubjectFromScoreKey(subjects, scoreKey);
      if (!sub?.id) continue;

      const maxNet = maxNetForSubjectTitle(sub.title);
      const ratio = Math.min(1, Math.max(0, net / Math.max(1, maxNet)));
      const topicIds = await topicIdsForSubject(sub.id);
      if (!topicIds.length) continue;

      const totalGain = Math.round(ratio * 36);
      const perTopic = Math.max(2, Math.round(totalGain / Math.min(topicIds.length, 8)));
      let touched = 0;
      for (const tid of topicIds.slice(0, 8)) {
        await bumpTopicProgress(userId, tid, perTopic, 0);
        touched += 1;
      }
      topicsTouched += touched;
      subjectUpdates.push({
        scoreKey,
        subjectId: sub.id,
        subjectTitle: sub.title,
        net,
        maxNet,
        ratio: Math.round(ratio * 1000) / 1000,
        topicsUpdated: touched,
      });
    }
  }

  const result = { subjectUpdates, topicsTouched };

  let coachQueue = { ok: false, reason: 'unknown' };
  try {
    coachQueue = await enqueueCoachPipelineJobs(userId, {
      source: 'trial_evaluated',
      progressEvaluation: result,
      trialNet: Number(trial?.netScore ?? trial?.net_score),
      netDrop: !!opts.netDrop,
    });
  } catch (e) {
    console.error('[tyt-progress-pipeline] coach queue (trial)', e);
    coachQueue = { ok: false, error: String(e?.message || e) };
  }

  return { ...result, coachQueue };
}
