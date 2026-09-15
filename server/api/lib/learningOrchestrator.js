/**
 * Learning Orchestrator — rule-based daily task generation (no LLM).
 * Combines TYT subjects, deneme subject_scores, and topic progress into normalized tasks,
 * then persists via createDailyStudyTasksBatch (daily_tasks / Neon).
 */
import { getSql, hasDb } from './db.js';
import {
  getTytSubjects,
  getTytTrialExams,
  createDailyStudyTasksBatch,
  deleteDailyStudyTasksForDate,
} from './tyt-storage.js';

export const ORCHESTRATOR_VERSION = '1.0.0';

/** @typedef {{ id: number, title: string }} TytSubject */
/** @typedef {{ id: number, title: string, subjectId: number, subjectTitle: string, mastery: number, progress: number }} WeakTopic */

/**
 * @param {number} userId
 * @param {number} [limit]
 * @returns {Promise<WeakTopic[]>}
 */
async function fetchWeakTopics(userId, limit = 6) {
  if (!hasDb()) return [];
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT t.id AS id,
             t.title AS title,
             t.subject_id AS "subjectId",
             s.title AS "subjectTitle",
             COALESCE(p.mastery_level, 0) AS mastery,
             COALESCE(p.progress_percent, 0) AS progress
      FROM tyt_topics t
      INNER JOIN tyt_subjects s ON s.id = t.subject_id
      LEFT JOIN user_topic_progress p ON p.topic_id = t.id AND p.user_id = ${userId}
      ORDER BY COALESCE(p.mastery_level, 0) ASC,
               COALESCE(p.progress_percent, 0) ASC,
               t.id ASC
      LIMIT ${limit}
    `;
    return (rows || []).map((r) => ({
      id: r.id,
      title: r.title,
      subjectId: r.subjectId,
      subjectTitle: r.subjectTitle,
      mastery: Number(r.mastery) || 0,
      progress: Number(r.progress) || 0,
    }));
  } catch (err) {
    console.error('[learningOrchestrator] fetchWeakTopics:', err);
    return [];
  }
}

/**
 * Map deneme subject_scores keys (e.g. Matematik) to subject ids when titles match.
 * @param {Record<string, unknown>} scores
 * @param {TytSubject[]} subjects
 * @returns {number | null} subject id with lowest numeric score, or null
 */
function weakestSubjectIdFromTrial(scores, subjects) {
  if (!scores || typeof scores !== 'object') return null;
  let worstId = null;
  let worstVal = Infinity;
  for (const sub of subjects) {
    const key = sub.title;
    const raw = scores[key];
    const val =
      typeof raw === 'number'
        ? raw
        : raw && typeof raw === 'object' && 'net' in raw
          ? Number(raw.net)
          : raw != null
            ? Number(raw)
            : null;
    if (val != null && !Number.isNaN(val) && val < worstVal) {
      worstVal = val;
      worstId = sub.id;
    }
  }
  return worstId;
}

/**
 * @param {object} opts
 * @param {number} opts.userId
 * @param {string} [opts.date] YYYY-MM-DD (Turkey calendar day — caller passes local or UTC date string as product expects)
 * @param {boolean} [opts.replaceExisting] default true
 * @param {{ dailyHours?: number, targetExam?: string }} [opts.profileHints] from session user.profile
 * @param {{ weakObjectiveCodes?: string[] }} [opts.curriculumHints] optional MEB-style codes (e.g. F.8.4.3.1) for AI coach / reporting
 * @returns {Promise<{ tasks: object[], created: object[], meta: object }>}
 */
export async function generateDailyTasks(opts) {
  const userId = Number(opts.userId);
  if (!userId || Number.isNaN(userId)) {
    throw new Error('Invalid userId');
  }

  const date =
    opts.date && /^\d{4}-\d{2}-\d{2}$/.test(String(opts.date))
      ? String(opts.date)
      : new Date().toISOString().split('T')[0];

  const replaceExisting = opts.replaceExisting !== false;
  const hints = opts.profileHints || {};
  const curriculumHints = opts.curriculumHints && typeof opts.curriculumHints === 'object' ? opts.curriculumHints : {};
  const weakObjectiveCodes = Array.isArray(curriculumHints.weakObjectiveCodes)
    ? curriculumHints.weakObjectiveCodes.map(String).filter(Boolean).slice(0, 12)
    : [];

  const [subjects, trials, weakTopics] = await Promise.all([
    getTytSubjects(),
    getTytTrialExams(userId),
    fetchWeakTopics(userId, 8),
  ]);

  const latestTrial = trials[0];
  let trialScores = null;
  if (latestTrial) {
    const raw = latestTrial.subject_scores ?? latestTrial.subjectScores;
    if (raw != null) {
      if (typeof raw === 'string') {
        try {
          trialScores = JSON.parse(raw);
        } catch {
          trialScores = null;
        }
      } else if (typeof raw === 'object') {
        trialScores = raw;
      }
    }
  }

  const weakSubjectId = trialScores
    ? weakestSubjectIdFromTrial(trialScores, subjects)
    : null;

  const focusSubject =
    (weakSubjectId && subjects.find((s) => s.id === weakSubjectId)) ||
    subjects[0] ||
    { id: 0, title: 'Genel' };

  const dailyMinutes =
    hints.dailyHours != null
      ? Math.min(720, Math.max(30, Number(hints.dailyHours) * 60))
      : 240;

  const targetExam = hints.targetExam || 'TYT';

  const pickTopic = (subjectTitle) => {
    const list = weakTopics.filter((t) => t.subjectTitle === subjectTitle);
    if (list.length) return list[0];
    return weakTopics[0] || null;
  };

  const topicForFocus = pickTopic(focusSubject.title);
  const secondTopic =
    weakTopics.find((t) => t.id !== topicForFocus?.id) || topicForFocus;

  /** @type {object[]} */
  const normalized = [];

  const loTag =
    weakObjectiveCodes.length > 0 ? ` | curriculum_lo=${weakObjectiveCodes.slice(0, 4).join(',')}` : '';

  if (topicForFocus) {
    normalized.push({
      title: `${focusSubject.title}: ${topicForFocus.title} — konu çalışması`,
      description: `[orchestrator v${ORCHESTRATOR_VERSION}] ${targetExam} | study | topic_id=${topicForFocus.id}${loTag}`,
      taskType: 'study',
      estimatedDuration: Math.round(dailyMinutes * 0.35),
      priority: 'high',
      subject: focusSubject.title,
      date,
    });
  } else {
    normalized.push({
      title: `${focusSubject.title}: temel tekrar ve özet`,
      description: `[orchestrator v${ORCHESTRATOR_VERSION}] ${targetExam} | study${loTag}`,
      taskType: 'study',
      estimatedDuration: Math.round(dailyMinutes * 0.35),
      priority: 'high',
      subject: focusSubject.title,
      date,
    });
  }

  if (secondTopic && secondTopic.id !== topicForFocus?.id) {
    normalized.push({
      title: `${secondTopic.subjectTitle}: ${secondTopic.title} — soru pratiği`,
      description: `[orchestrator v${ORCHESTRATOR_VERSION}] practice | topic_id=${secondTopic.id}`,
      taskType: 'practice',
      estimatedDuration: Math.round(dailyMinutes * 0.25),
      priority: 'medium',
      subject: secondTopic.subjectTitle,
      date,
    });
  }

  normalized.push({
    title: `${focusSubject.title}: hızlı mini deneme (20 soru)`,
    description: `[orchestrator v${ORCHESTRATOR_VERSION}] exam | subject_id=${focusSubject.id}`,
    taskType: 'exam',
    estimatedDuration: Math.round(dailyMinutes * 0.25),
    priority: 'high',
    subject: focusSubject.title,
    date,
  });

  normalized.push({
    title: 'Karışık tekrar: önceki hataları gözden geçir',
    description: `[orchestrator v${ORCHESTRATOR_VERSION}] review`,
    taskType: 'review',
    estimatedDuration: Math.round(dailyMinutes * 0.15),
    priority: 'low',
    subject: 'Genel',
    date,
  });

  if (replaceExisting && hasDb()) {
    await deleteDailyStudyTasksForDate(userId, date);
  }

  const created = await createDailyStudyTasksBatch(userId, normalized, date);

  return {
    tasks: normalized,
    created,
    meta: {
      orchestratorVersion: ORCHESTRATOR_VERSION,
      date,
      userId,
      replaceExisting,
      weakTopicIds: weakTopics.map((t) => t.id).slice(0, 4),
      focusSubjectId: focusSubject.id,
      latestTrialId: latestTrial?.id ?? null,
      dailyMinutesBudget: dailyMinutes,
      curriculumObjectiveCodes: weakObjectiveCodes,
    },
  };
}
