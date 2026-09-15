-- Migration: Prevent duplicate pending assignments
-- Description: Same teacher+student+topic should not have multiple pending rows
-- Created at: 2026-03-26

CREATE UNIQUE INDEX IF NOT EXISTS uniq_teacher_assignment_pending
ON teacher_assignments (teacher_id, student_id, topic_id)
WHERE status = 'pending';
