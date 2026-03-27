/**
 * TYT storage layer for Vercel serverless.
 * Returns mock data when DATABASE_URL is not set; uses Neon when set.
 */
import { getSql, hasDb } from './db.js';

const MOCK_SUBJECTS = [
  { id: 1, title: 'Matematik', displayName: 'Matematik', code: 'MAT', questionCount: 40 },
  { id: 2, title: 'Türkçe', displayName: 'Türkçe', code: 'TR', questionCount: 40 },
  { id: 3, title: 'Fen Bilimleri', displayName: 'Fen Bilimleri', code: 'FEN', questionCount: 20 },
  { id: 4, title: 'Sosyal Bilimler', displayName: 'Sosyal Bilimler', code: 'SOS', questionCount: 20 },
];

export async function getTytStudentProfile(userId) {
  if (!hasDb()) return null;
  try {
    const sql = getSql();
    const rows = await sql`SELECT id, user_id as "userId" FROM tyt_student_profiles WHERE user_id = ${userId}`;
    const row = rows?.[0];
    return row ? { id: row.id, userId: row.userId } : null;
  } catch (err) {
    console.error('[tyt-storage] getTytStudentProfile:', err);
    return null;
  }
}

export async function getTytSubjects() {
  if (!hasDb()) return MOCK_SUBJECTS;
  try {
    const sql = getSql();
    const rows = await sql`SELECT id, title FROM tyt_subjects ORDER BY id`;
    return (rows || []).map(r => ({
      id: r.id,
      title: r.title,
      displayName: r.title,
      code: (r.title || '').slice(0, 3),
      questionCount: 40,
    }));
  } catch (err) {
    console.error('[tyt-storage] getTytSubjects:', err);
    return MOCK_SUBJECTS;
  }
}

export async function createTytTrialExam(userId, data) {
  const examDate = data.examDate || data.exam_date || new Date().toISOString().split('T')[0];
  const netScore = Number(data.netScore ?? data.net_score ?? 0);
  const correct = Number(data.correctAnswers ?? data.correct_answers ?? 0);
  const wrong = Number(data.wrongAnswers ?? data.wrong_answers ?? 0);
  const empty = Number(data.emptyAnswers ?? data.empty_answers ?? 0);
  const total = correct + wrong + empty || 120;
  if (!hasDb()) {
    return {
      id: Date.now(),
      userId,
      examType: 'TYT',
      examDate,
      netScore,
      correctAnswers: correct,
      wrongAnswers: wrong,
      emptyAnswers: empty,
    };
  }
  try {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO tyt_trial_exams (user_id, exam_name, exam_date, duration_minutes, total_questions, correct_answers, wrong_answers, empty_answers, net_score, subject_scores)
      VALUES (${userId}, ${data.examName || 'TYT Deneme'}, ${examDate}, ${data.durationMinutes || 135}, ${total}, ${correct}, ${wrong}, ${empty}, ${netScore}, ${JSON.stringify(data.subjectScores || data.subject_scores || {})})
      RETURNING id, user_id as "userId", exam_date as "examDate", net_score as "netScore", correct_answers as "correctAnswers", wrong_answers as "wrongAnswers", empty_answers as "emptyAnswers"
    `;
    const r = rows?.[0];
    return r ? { ...r, examType: 'TYT' } : null;
  } catch (err) {
    console.error('[tyt-storage] createTytTrialExam:', err);
    return null;
  }
}

export async function getTytTrialExams(userId) {
  if (!hasDb()) return [];
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, user_id as "userId", net_score as "netScore",
        correct_answers as "correctAnswers", wrong_answers as "wrongAnswers",
        empty_answers as "emptyAnswers", exam_date as "examDate"
      FROM tyt_trial_exams WHERE user_id = ${userId}
      ORDER BY exam_date DESC
    `;
    return (rows || []).map(r => ({
      ...r,
      examType: 'TYT',
      netScore: r.netScore ?? 0,
      correctAnswers: r.correctAnswers ?? 0,
      wrongAnswers: r.wrongAnswers ?? 0,
      emptyAnswers: r.emptyAnswers ?? 0,
    }));
  } catch (err) {
    console.error('[tyt-storage] getTytTrialExams:', err);
    return [];
  }
}

export async function getDailyStudyTasks(userId, date, startDate, endDate) {
  if (!hasDb()) return [];
  try {
    const sql = getSql();
    let rows;
    if (startDate && endDate) {
      rows = await sql`
        SELECT id, user_id as "userId", title, description, due_date as "dueDate",
          completed, completed_at as "completedAt"
        FROM daily_tasks WHERE user_id = ${userId} AND due_date >= ${startDate} AND due_date <= ${endDate}
        ORDER BY due_date, id
      `;
    } else if (date) {
      rows = await sql`
        SELECT id, user_id as "userId", title, description, due_date as "dueDate",
          completed, completed_at as "completedAt"
        FROM daily_tasks WHERE user_id = ${userId} AND due_date = ${date}
        ORDER BY due_date, id
      `;
    } else {
      rows = await sql`
        SELECT id, user_id as "userId", title, description, due_date as "dueDate",
          completed, completed_at as "completedAt"
        FROM daily_tasks WHERE user_id = ${userId}
        ORDER BY due_date, id
      `;
    }
    return (rows || []).map(r => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      description: r.description,
      scheduledDate: r.dueDate,
      dueDate: r.dueDate,
      isCompleted: r.completed,
      completed: r.completed,
      completedAt: r.completedAt,
      estimatedDuration: 60,
      taskType: 'study',
      priority: 'medium',
      scheduledTime: null,
    }));
  } catch (err) {
    console.error('[tyt-storage] getDailyStudyTasks:', err);
    return [];
  }
}

export async function getTytStudyStats(userId) {
  const tasks = await getDailyStudyTasks(userId, null, null, null);
  const trials = await getTytTrialExams(userId);
  const completedTasks = tasks.filter(t => t.isCompleted || t.completed).length;
  const totalStudyTime = completedTasks * 60;
  const avgNet = trials.length > 0 ? trials.reduce((s, t) => s + (t.netScore || 0), 0) / trials.length : 0;
  return {
    totalStudyTime,
    completedTasks,
    averageNetScore: Math.round(avgNet),
    subjectProgress: [],
    streaks: [{ type: 'daily', current: 0, longest: 0 }],
  };
}

export async function completeDailyStudyTask(taskId, userId, actualDuration) {
  if (!hasDb()) {
    return { id: taskId, userId, isCompleted: true, completed: true, completedAt: new Date().toISOString(), actualDuration };
  }
  try {
    const sql = getSql();
    await sql`UPDATE daily_tasks SET completed = true, completed_at = NOW() WHERE id = ${taskId} AND user_id = ${userId}`;
    const rows = await sql`SELECT id, user_id as "userId", title, completed, completed_at as "completedAt" FROM daily_tasks WHERE id = ${taskId}`;
    const r = rows?.[0];
    return r ? { ...r, isCompleted: true, completed: true } : null;
  } catch (err) {
    console.error('[tyt-storage] completeDailyStudyTask:', err);
    return null;
  }
}

export async function createDailyStudyTasksBatch(userId, tasks, defaultDate) {
  const fallbackDate = defaultDate || new Date().toISOString().split('T')[0];
  if (!hasDb()) {
    return tasks.map((t, i) => {
      const d = t.date || t.scheduledDate || t.dueDate || fallbackDate;
      return {
        id: Date.now() + i,
        userId,
        title: t.title || `${t.subject || 'Görev'}`,
        description: t.description,
        scheduledDate: d,
        dueDate: d,
        isCompleted: false,
        completed: false,
        estimatedDuration: t.estimatedDuration || 60,
        taskType: t.taskType || 'study',
        priority: t.priority || 'medium',
      };
    });
  }
  const created = [];
  try {
    const sql = getSql();
    for (const t of tasks) {
      const title = t.title || `${t.subject || 'Görev'}`;
      const taskDate = t.date || t.scheduledDate || t.dueDate || fallbackDate;
      const rows = await sql`
        INSERT INTO daily_tasks (user_id, title, description, due_date, completed)
        VALUES (${userId}, ${title}, ${t.description || null}, ${taskDate}, false)
        RETURNING id, user_id as "userId", title, due_date as "dueDate", completed
      `;
      const r = rows?.[0];
      if (r) created.push({ ...r, scheduledDate: r.dueDate, isCompleted: false, completed: false, estimatedDuration: t.estimatedDuration || 60, taskType: t.taskType || 'study', priority: t.priority || 'medium' });
    }
    return created;
  } catch (err) {
    console.error('[tyt-storage] createDailyStudyTasksBatch:', err);
    return [];
  }
}
