/**
 * Öğretmen Dashboard API
 * Tüm öğrencilerin quiz sonuçlarını, ilerleme durumunu ve müfredat takibini döndürür.
 *
 * GET /api/teacher/dashboard
 *   ?userId=<teacherId>         → Özet istatistikler
 *
 * GET /api/teacher/dashboard?view=students
 *   → Tüm öğrencilerin listesi + quiz ortalamaları
 *
 * GET /api/teacher/dashboard?view=student_detail&studentId=<id>
 *   → Tek öğrencinin quiz geçmişi + müfredat ilerlemesi
 *
 * GET /api/teacher/dashboard?view=quiz_stats
 *   → Konu bazında ortalama skorlar
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { view = 'summary', studentId } = req.query;

  try {
    // ── 1. Özet: Genel istatistikler ──────────────────
    if (view === 'summary') {
      const [studentsRes, sessionsRes, topicsRes] = await Promise.all([
        supabase.from('user_curriculum').select('user_id').limit(1000),
        supabase.from('quiz_sessions').select('score, status').eq('status', 'completed'),
        supabase.from('topics').select('id', { count: 'exact', head: true }),
      ]);

      const uniqueStudents = new Set((studentsRes.data || []).map(r => r.user_id)).size;
      const sessions = sessionsRes.data || [];
      const avgScore = sessions.length
        ? Math.round(sessions.reduce((s, r) => s + (r.score || 0), 0) / sessions.length)
        : 0;

      // Son 7 günde tamamlanan quiz sayısı
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSessions } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('status', 'completed')
        .gte('completed_at', oneWeekAgo);

      return res.status(200).json({
        success: true,
        summary: {
          totalStudents: uniqueStudents,
          totalQuizCompleted: sessions.length,
          averageScore: avgScore,
          quizzesThisWeek: recentSessions?.length || 0,
          totalTopics: topicsRes.count || 0,
        },
      });
    }

    // ── 2. Öğrenci Listesi ────────────────────────────
    if (view === 'students') {
      // Tüm quiz_sessions'ı kullanıcı bazında grupla
      const { data: sessions, error: sErr } = await supabase
        .from('quiz_sessions')
        .select(`
          user_id,
          score,
          status,
          completed_at,
          topics:topic_id(name, subjects:subject_id(name))
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (sErr) throw sErr;

      // user_curriculum'dan öğrenci listesi
      const { data: curricula, error: cErr } = await supabase
        .from('user_curriculum')
        .select('user_id, status')
        .limit(2000);

      if (cErr) throw cErr;

      // Öğrenci bazında gruplama
      const studentMap = {};

      (sessions || []).forEach(s => {
        if (!studentMap[s.user_id]) {
          studentMap[s.user_id] = { userId: s.user_id, quizzes: [], totalTopics: 0, completedTopics: 0 };
        }
        studentMap[s.user_id].quizzes.push({
          score: s.score,
          topic: s.topics?.name,
          subject: s.topics?.subjects?.name,
          completedAt: s.completed_at,
        });
      });

      (curricula || []).forEach(c => {
        if (!studentMap[c.user_id]) {
          studentMap[c.user_id] = { userId: c.user_id, quizzes: [], totalTopics: 0, completedTopics: 0 };
        }
        studentMap[c.user_id].totalTopics++;
        if (c.status === 'completed') studentMap[c.user_id].completedTopics++;
      });

      const students = Object.values(studentMap).map(s => {
        const quizScores = s.quizzes.map(q => q.score).filter(Boolean);
        return {
          userId: s.userId,
          quizCount: s.quizzes.length,
          averageScore: quizScores.length
            ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
            : null,
          lastQuiz: s.quizzes[0] || null,
          totalTopics: s.totalTopics,
          completedTopics: s.completedTopics,
          completionPct: s.totalTopics
            ? Math.round((s.completedTopics / s.totalTopics) * 100)
            : 0,
        };
      });

      // Ortalama skora göre sırala (en yükseği üstte)
      students.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));

      return res.status(200).json({ success: true, students });
    }

    // ── 3. Tek Öğrenci Detayı ─────────────────────────
    if (view === 'student_detail') {
      if (!studentId) return res.status(400).json({ error: 'studentId gerekli' });

      const [sessionsRes, curriculumRes] = await Promise.all([
        supabase
          .from('quiz_sessions')
          .select(`
            id, score, correct_count, total_questions, time_taken_seconds,
            status, started_at, completed_at,
            topics:topic_id(name, difficulty_level, subjects:subject_id(name))
          `)
          .eq('user_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(50),

        supabase
          .from('user_curriculum')
          .select(`
            status,
            topics:topic_id(name, difficulty_level, subjects:subject_id(name), units:unit_id(name))
          `)
          .eq('user_id', studentId),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;

      const sessions = (sessionsRes.data || []).map(s => ({
        id: s.id,
        topic: s.topics?.name,
        subject: s.topics?.subjects?.name,
        difficulty: s.topics?.difficulty_level,
        score: s.score,
        correctCount: s.correct_count,
        totalQuestions: s.total_questions,
        timeTaken: s.time_taken_seconds,
        status: s.status,
        completedAt: s.completed_at,
        grade: getGrade(s.score).letter,
      }));

      const completedSessions = sessions.filter(s => s.status === 'completed');
      const avgScore = completedSessions.length
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
        : null;

      // Konu bazında ilerleme
      const curriculum = (curriculumRes.data || []).map(c => ({
        topicName: c.topics?.name,
        subject: c.topics?.subjects?.name,
        unit: c.topics?.units?.name,
        difficulty: c.topics?.difficulty_level,
        status: c.status,
      }));

      return res.status(200).json({
        success: true,
        studentId,
        stats: {
          totalQuizzes: sessions.length,
          completedQuizzes: completedSessions.length,
          averageScore: avgScore,
          totalTopicsInCurriculum: curriculum.length,
          topicsCompleted: curriculum.filter(c => c.status === 'completed').length,
        },
        recentSessions: sessions,
        curriculum,
      });
    }

    // ── 4. Konu Bazlı Quiz İstatistikleri ─────────────
    if (view === 'quiz_stats') {
      const { data: sessions, error } = await supabase
        .from('quiz_sessions')
        .select(`
          score, correct_count, total_questions,
          topics:topic_id(id, name, subjects:subject_id(name))
        `)
        .eq('status', 'completed');

      if (error) throw error;

      const topicMap = {};
      (sessions || []).forEach(s => {
        const tid = s.topics?.id;
        if (!tid) return;
        if (!topicMap[tid]) {
          topicMap[tid] = {
            topicId: tid,
            topicName: s.topics.name,
            subject: s.topics.subjects?.name,
            scores: [],
          };
        }
        topicMap[tid].scores.push(s.score || 0);
      });

      const stats = Object.values(topicMap).map(t => ({
        topicId: t.topicId,
        topicName: t.topicName,
        subject: t.subject,
        quizCount: t.scores.length,
        averageScore: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
        minScore: Math.min(...t.scores),
        maxScore: Math.max(...t.scores),
      }));

      stats.sort((a, b) => a.averageScore - b.averageScore); // En düşük ortalama üstte (zor konular)

      return res.status(200).json({ success: true, topicStats: stats });
    }

    return res.status(400).json({ error: 'Geçersiz view parametresi' });
  } catch (err) {
    console.error('Teacher dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function getGrade(score) {
  if (score >= 90) return { letter: 'A' };
  if (score >= 75) return { letter: 'B' };
  if (score >= 60) return { letter: 'C' };
  if (score >= 40) return { letter: 'D' };
  return { letter: 'F' };
}
