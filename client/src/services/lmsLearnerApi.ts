/**
 * LMS Phase 2 — Neon-backed tasks & announcements (Vercel /api).
 */
export interface LmsLearnerTask {
  id: number;
  studentUserId: number;
  title: string;
  taskType: string;
  dueAt: string | null;
  status: string;
  assignedByUserId: number | null;
  createdAt: string;
}

export interface LmsAnnouncement {
  id: number;
  title: string;
  body: string;
  publishedAt: string;
  expiresAt: string | null;
}

export async function fetchLearnerTasks(): Promise<{ tasks: LmsLearnerTask[]; source?: string }> {
  const res = await fetch('/api/user/learner-tasks', { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Görevler yüklenemedi');
  }
  const data = await res.json();
  return { tasks: data.tasks || [], source: data.source };
}

export async function patchLearnerTaskStatus(id: number, status: 'done' | 'pending'): Promise<void> {
  const res = await fetch('/api/user/learner-tasks', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Güncellenemedi');
  }
}

export async function createPersonalLearnerTask(body: {
  title: string;
  taskType?: string;
  dueAt?: string | null;
}): Promise<LmsLearnerTask> {
  const res = await fetch('/api/user/learner-tasks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Oluşturulamadı');
  }
  const data = await res.json();
  return data.task as LmsLearnerTask;
}

export async function fetchAnnouncements(): Promise<{ announcements: LmsAnnouncement[]; source?: string }> {
  const res = await fetch('/api/user/announcements', { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Duyurular yüklenemedi');
  }
  const data = await res.json();
  return { announcements: data.announcements || [], source: data.source };
}

export async function teacherAssignLearnerTask(body: {
  studentUserId: number;
  title: string;
  taskType?: string;
  dueAt?: string | null;
}): Promise<LmsLearnerTask> {
  const res = await fetch('/api/teacher/learner-tasks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Atama başarısız');
  }
  const data = await res.json();
  return data.task as LmsLearnerTask;
}
