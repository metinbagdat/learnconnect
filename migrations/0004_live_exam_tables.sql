-- Migration: Live Exam Mode
-- Description: Öğretmenin canlı sınav başlatıp öğrencilerin aynı anda çözebilmesi
-- Created at: 2026-03-26

CREATE TABLE IF NOT EXISTS live_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question_count INT NOT NULL DEFAULT 10,
  duration_minutes INT NOT NULL DEFAULT 20,
  access_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | live | completed | cancelled
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_exam_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES live_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'joined', -- joined | submitted
  score INT,
  correct_count INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  time_taken_seconds INT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(exam_id, user_id)
);

CREATE TABLE IF NOT EXISTS live_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES live_exam_participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_live_exams_teacher_id ON live_exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_exams_access_code ON live_exams(access_code);
CREATE INDEX IF NOT EXISTS idx_live_exam_participants_exam_id ON live_exam_participants(exam_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_participants_user_id ON live_exam_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_answers_participant_id ON live_exam_answers(participant_id);

ALTER TABLE live_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_exam_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_exams_teacher_manage" ON live_exams
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "live_exam_participants_own" ON live_exam_participants
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "live_exam_participants_teacher_read" ON live_exam_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_exams le
      WHERE le.id = exam_id
      AND (
        le.teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('teacher', 'admin')
        )
      )
    )
  );

CREATE POLICY "live_exam_answers_own" ON live_exam_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM live_exam_participants p
      WHERE p.id = participant_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "live_exam_answers_teacher_read" ON live_exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_exam_participants p
      JOIN live_exams le ON le.id = p.exam_id
      WHERE p.id = participant_id
      AND (
        le.teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('teacher', 'admin')
        )
      )
    )
  );
