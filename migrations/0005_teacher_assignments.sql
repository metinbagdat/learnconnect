-- Migration: Teacher topic assignments
-- Description: Ogretmenin ogrenciye belirli konu atamasi
-- Created at: 2026-03-26

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  note TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | completed | cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_student_id ON teacher_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_topic_id ON teacher_assignments(topic_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_status ON teacher_assignments(status);

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_assignments_teacher_manage" ON teacher_assignments
  FOR ALL USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "teacher_assignments_student_read_update" ON teacher_assignments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "teacher_assignments_student_update" ON teacher_assignments
  FOR UPDATE USING (student_id = auth.uid());
