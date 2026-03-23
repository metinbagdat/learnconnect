/** Supabase `public.students` row (çalışma takip modülü) */
export type StudyTrackStudent = {
  id: string;
  goal_net: number;
  daily_minutes: number;
  current_net: number;
  created_at?: string;
};

/** `study_logs` satırı — spec’te net yok; grafik için opsiyonel `net` sütunu kullanılır */
export type StudyLogRow = {
  id: string;
  student_id: string;
  topic_id: string;
  duration: number;
  net: number | null;
  created_at: string;
};

/** `tasks` satırı */
export type TaskRow = {
  id: string;
  student_id: string;
  title: string;
  duration: number;
  type: string;
  completed: boolean;
  created_at: string;
};

export type StudentMetricsRow = {
  student_id: string;
  total_sessions: number;
  total_minutes: number;
};
