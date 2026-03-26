-- LMS Phase 2 (Neon): öğrenci görevleri + duyurular
-- Çalıştırma: Neon SQL Editor veya `psql $DATABASE_URL -f migrations/lms_phase2_neon.sql`

CREATE TABLE IF NOT EXISTS lms_learner_tasks (
  id SERIAL PRIMARY KEY,
  student_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'ödev',
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_by_user_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_learner_tasks_student ON lms_learner_tasks (student_user_id);
CREATE INDEX IF NOT EXISTS idx_lms_learner_tasks_due ON lms_learner_tasks (due_at);

CREATE TABLE IF NOT EXISTS lms_announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  audience TEXT NOT NULL DEFAULT 'all'
);

CREATE INDEX IF NOT EXISTS idx_lms_announcements_published ON lms_announcements (published_at DESC);

-- Örnek duyuru (isteğe bağlı):
-- INSERT INTO lms_announcements (title, body, audience) VALUES ('Hoş geldiniz', 'LMS Phase 2 duyuruları burada listelenir.', 'all');
