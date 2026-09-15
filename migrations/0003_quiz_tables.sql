-- Migration: Quiz & Assessment Tabloları
-- Description: Öğrencilerin konu bazlı quiz çözmesi için tablo yapısı
-- Created at: 2026-03-26

-- 1. Sorular (Questions) Tablosu
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  text TEXT NOT NULL,                        -- Soru metni
  type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' | 'true_false'
  options JSONB,                             -- [{id:'A', text:'...'}, {id:'B', text:'...'}]
  correct_answer TEXT NOT NULL,              -- 'A', 'B', 'C', 'D' veya 'true'/'false'
  explanation TEXT,                          -- Cevap açıklaması
  difficulty INT DEFAULT 3,                   -- 1-5 arası zorluk
  source TEXT,                               -- 'tyt-2024', 'ayt-2024' gibi sınav kaynağı
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Quiz Oturumları (Quiz Sessions) Tablosu
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question_ids UUID[] NOT NULL,              -- Oturumda sorulan soru ID'leri
  status TEXT NOT NULL DEFAULT 'started',   -- 'started' | 'completed' | 'abandoned'
  score INT,                                 -- Toplam puan (0-100)
  correct_count INT DEFAULT 0,
  total_questions INT NOT NULL,
  time_taken_seconds INT,                    -- Kaç saniyede çözüldü
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quiz Cevapları (Quiz Answers) Tablosu
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,                          -- Öğrencinin cevabı
  is_correct BOOLEAN,
  time_taken_seconds INT,                    -- Bu soruya kaç saniyede cevap verildi
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_topic_id ON quiz_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);

-- RLS (Row Level Security) Politikaları

-- questions: herkes okuyabilir
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read_all" ON questions
  FOR SELECT USING (true);
CREATE POLICY "questions_admin_write" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- quiz_sessions: sadece kendi oturumları
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_sessions_own" ON quiz_sessions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "quiz_sessions_teacher_read" ON quiz_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'teacher')
    )
  );

-- quiz_answers: sadece kendi cevapları
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_answers_own" ON quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_answers_teacher_read" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'teacher')
    )
  );

-- Güncelleme tetikleyicisi
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
