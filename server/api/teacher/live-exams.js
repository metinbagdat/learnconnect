import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateAccessCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { teacherId, examId } = req.query;
    if (!teacherId) return res.status(400).json({ error: 'teacherId gerekli' });

    try {
      if (examId) {
        const { data: exam, error: examErr } = await supabase
          .from('live_exams')
          .select('id, title, topic_id, question_count, duration_minutes, access_code, status, starts_at, ends_at, created_at, topics:topic_id(name, subjects:subject_id(name))')
          .eq('id', examId)
          .eq('teacher_id', teacherId)
          .single();

        if (examErr) return res.status(500).json({ error: examErr.message });

        const { data: participants, error: pErr } = await supabase
          .from('live_exam_participants')
          .select('id, user_id, status, score, correct_count, total_questions, time_taken_seconds, joined_at, submitted_at')
          .eq('exam_id', examId)
          .order('submitted_at', { ascending: false });

        if (pErr) return res.status(500).json({ error: pErr.message });

        return res.status(200).json({
          success: true,
          exam,
          participants: participants || [],
          metrics: {
            joinedCount: (participants || []).length,
            submittedCount: (participants || []).filter(p => p.status === 'submitted').length,
            averageScore: (participants || []).filter(p => p.score !== null).length
              ? Math.round((participants || []).filter(p => p.score !== null).reduce((s, p) => s + p.score, 0) / (participants || []).filter(p => p.score !== null).length)
              : null,
          },
        });
      }

      const { data: exams, error } = await supabase
        .from('live_exams')
        .select('id, title, topic_id, question_count, duration_minutes, access_code, status, starts_at, ends_at, created_at, topics:topic_id(name, subjects:subject_id(name))')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const examIds = (exams || []).map(e => e.id);
      let participants = [];
      if (examIds.length > 0) {
        const { data } = await supabase
          .from('live_exam_participants')
          .select('exam_id, status, score')
          .in('exam_id', examIds);
        participants = data || [];
      }

      const byExam = {};
      participants.forEach(p => {
        if (!byExam[p.exam_id]) byExam[p.exam_id] = { joined: 0, submitted: 0, scores: [] };
        byExam[p.exam_id].joined += 1;
        if (p.status === 'submitted') byExam[p.exam_id].submitted += 1;
        if (p.score !== null && p.score !== undefined) byExam[p.exam_id].scores.push(p.score);
      });

      const enriched = (exams || []).map(e => {
        const m = byExam[e.id] || { joined: 0, submitted: 0, scores: [] };
        const avg = m.scores.length ? Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length) : null;
        return { ...e, joinedCount: m.joined, submittedCount: m.submitted, averageScore: avg };
      });

      return res.status(200).json({ success: true, exams: enriched });
    } catch (err) {
      console.error('live-exams GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { teacherId, title, topicId, questionCount = 10, durationMinutes = 20, startsAt = null } = req.body;

    if (!teacherId || !title || !topicId) {
      return res.status(400).json({ error: 'teacherId, title, topicId gerekli' });
    }

    try {
      const accessCode = generateAccessCode();

      const { data, error } = await supabase
        .from('live_exams')
        .insert({
          teacher_id: teacherId,
          title,
          topic_id: topicId,
          question_count: Number(questionCount),
          duration_minutes: Number(durationMinutes),
          access_code: accessCode,
          status: startsAt ? 'scheduled' : 'live',
          starts_at: startsAt || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ success: true, exam: data });
    } catch (err) {
      console.error('live-exams POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { examId, action } = req.body;
    if (!examId || !action) return res.status(400).json({ error: 'examId ve action gerekli' });

    try {
      if (action === 'start') {
        const { data, error } = await supabase
          .from('live_exams')
          .update({ status: 'live', starts_at: new Date().toISOString() })
          .eq('id', examId)
          .select()
          .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, exam: data });
      }

      if (action === 'end') {
        const { data, error } = await supabase
          .from('live_exams')
          .update({ status: 'completed', ends_at: new Date().toISOString() })
          .eq('id', examId)
          .select()
          .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, exam: data });
      }

      return res.status(400).json({ error: 'Geçersiz action. start|end olmalı' });
    } catch (err) {
      console.error('live-exams PATCH error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
