-- Migration: Curriculum Management Tables
-- Description: Müfredat yönetimi için hiyerarşik tablo yapısı
-- Created at: 2026-03-26

-- 1. Dersler (Subjects) Tablosu
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                        -- 'Matematik', 'Türkçe', 'Fizik'
  slug TEXT UNIQUE NOT NULL,                 -- 'matematik', 'turkce'
  description TEXT,
  exam_type TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['tyt', 'ayt'] hangi sınavda var
  grade_level INT,                           -- 9,10,11,12 veya NULL (genel)
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Üniteler (Units) Tablosu
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- 'Türev', 'Limit', 'Paragraf'
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Konular (Topics) - En küçük öğrenme birimi
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- 'Türevin Tanımı', 'Limit Kuralları'
  description TEXT,
  difficulty INT DEFAULT 3,                  -- 1-5 arası zorluk
  estimated_minutes INT,                     -- tahmini çalışma süresi
  is_tyt BOOLEAN DEFAULT false,
  is_ayt BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  learning_objectives TEXT[],                -- Öğrenme hedefleri
  keywords TEXT[],                           -- Arama için anahtar kelimeler
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Öğrenci Müfredat Seçimi (User Curriculum) - Öğrencinin Onayladığı Konular
CREATE TABLE IF NOT EXISTS user_curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'approved',            -- 'approved', 'skipped', 'custom'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- 5. Öğrenci Tercihler (User Preferences)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_subjects UUID[],                  -- Seçili derslerin ID'leri
  is_custom_curriculum BOOLEAN DEFAULT false, -- Kişiselleştirilmişse
  exam_type TEXT[],                          -- ['tyt', 'ayt'] hangileri seçti
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Öğretmen Yetkileri (Teacher Permissions)
CREATE TABLE IF NOT EXISTS teacher_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT true,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- 7. Müfredat Değişim Geçmişi (Curriculum Audit Log)
CREATE TABLE IF NOT EXISTS curriculum_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,                 -- 'subject', 'unit', 'topic'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,                      -- 'create', 'update', 'delete'
  changed_by UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler (Performance optimization)
CREATE INDEX IF NOT EXISTS idx_units_subject_id ON units(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_unit_id ON topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_user_id ON user_curriculum(user_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_topic_id ON user_curriculum(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_permissions_user_id ON teacher_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_permissions_subject_id ON teacher_permissions(subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);

-- RLS Policies (Row Level Security)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Admin'ler all subject operations yapabilir
CREATE POLICY admin_subjects_policy ON subjects
  FOR ALL
  USING (auth.jwt_to_jsonb() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt_to_jsonb() ->> 'role' = 'admin');

-- Policy: Teachers kendi derslerini görebilir
CREATE POLICY teacher_subject_view ON subjects
  FOR SELECT
  USING (
    id IN (
      SELECT subject_id FROM teacher_permissions WHERE user_id = auth.uid()
    )
    OR auth.jwt_to_jsonb() ->> 'role' = 'admin'
  );

-- Policy: Öğrenciler sadece onayladıkları konuları görebilir
CREATE POLICY student_topics_view ON topics
  FOR SELECT
  USING (
    id IN (
      SELECT topic_id FROM user_curriculum WHERE user_id = auth.uid()
    )
    OR auth.jwt_to_jsonb() ->> 'role' IN ('admin', 'teacher')
  );

-- Policy: Kullanıcılar sadece kendi tercihlerini görebilir
CREATE POLICY user_preferences_policy ON user_preferences
  FOR ALL
  USING (user_id = auth.uid() OR auth.jwt_to_jsonb() ->> 'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt_to_jsonb() ->> 'role' = 'admin');

-- Policy: Kullanıcılar sadece kendi müfredat seçimini görebilir
CREATE POLICY user_curriculum_policy ON user_curriculum
  FOR ALL
  USING (user_id = auth.uid() OR auth.jwt_to_jsonb() ->> 'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt_to_jsonb() ->> 'role' = 'admin');
