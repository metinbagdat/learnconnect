/**
 * LMS Phase 2 — Neon helpers for learner tasks & announcements.
 */
import { getSql, hasDb } from './db.js';

export { hasDb };

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

export function parseJsonBody(req) {
  return parseBody(req);
}

/** @returns {Promise<{ id: number, studentUserId: number, title: string, taskType: string, dueAt: string | null, status: string, assignedByUserId: number | null, createdAt: string }[]>} */
export async function listLearnerTasksForStudent(studentUserId) {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, student_user_id, title, task_type, due_at, status, assigned_by_user_id, created_at
    FROM lms_learner_tasks
    WHERE student_user_id = ${studentUserId}
    ORDER BY due_at ASC NULLS LAST, created_at DESC
    LIMIT 100
  `;
  return rows.map((r) => ({
    id: r.id,
    studentUserId: r.student_user_id,
    title: r.title,
    taskType: r.task_type,
    dueAt: r.due_at ? new Date(r.due_at).toISOString() : null,
    status: r.status,
    assignedByUserId: r.assigned_by_user_id,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function insertLearnerTask({
  studentUserId,
  title,
  taskType,
  dueAt,
  assignedByUserId,
}) {
  const sql = getSql();
  if (!sql) throw new Error('Database not configured');
  const due = dueAt ? new Date(dueAt) : null;
  const rows = await sql`
    INSERT INTO lms_learner_tasks (student_user_id, title, task_type, due_at, status, assigned_by_user_id)
    VALUES (${studentUserId}, ${title}, ${taskType}, ${due}, 'pending', ${assignedByUserId ?? null})
    RETURNING id, student_user_id, title, task_type, due_at, status, assigned_by_user_id, created_at
  `;
  const r = rows[0];
  return {
    id: r.id,
    studentUserId: r.student_user_id,
    title: r.title,
    taskType: r.task_type,
    dueAt: r.due_at ? new Date(r.due_at).toISOString() : null,
    status: r.status,
    assignedByUserId: r.assigned_by_user_id,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function updateLearnerTaskStatus(taskId, studentUserId, status) {
  const sql = getSql();
  if (!sql) throw new Error('Database not configured');
  const rows = await sql`
    UPDATE lms_learner_tasks
    SET status = ${status}
    WHERE id = ${taskId} AND student_user_id = ${studentUserId}
    RETURNING id
  `;
  return rows.length > 0;
}

/** @returns {Promise<{ id: number, title: string, body: string, publishedAt: string, expiresAt: string | null }[]>} */
export async function listActiveAnnouncements() {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, title, body, published_at, expires_at
    FROM lms_announcements
    WHERE (expires_at IS NULL OR expires_at > NOW())
    ORDER BY published_at DESC
    LIMIT 20
  `;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    publishedAt: new Date(r.published_at).toISOString(),
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
  }));
}
