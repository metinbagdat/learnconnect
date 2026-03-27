import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function isExamTimeOver(exam) {
  if (!exam?.starts_at || !exam?.duration_minutes) return false;
  const startMs = new Date(exam.starts_at).getTime();
  const endMs = startMs + Number(exam.duration_minutes) * 60 * 1000;
  return Date.now() >= endMs;
}

async function finalizeParticipant(participantId, timeTakenSeconds = null) {
  const { data: participant, error: pErr } = await supabase
    .from('live_exam_participants')
    .select('id, total_questions, status')
    .eq('id', participantId)
    .single();

  if (pErr) throw pErr;
  if (participant.status === 'submitted') {
    const { data: existing } = await supabase
      .from('live_exam_participants')
      .select('id, score, correct_count, total_questions, submitted_at')
      .eq('id', participantId)
      .single();
    return existing;
  }

  const { data: answers, error: aErr } = await supabase
    .from('live_exam_answers')
    .select('is_correct')
    .eq('participant_id', participantId);

  if (aErr) throw aErr;

  const correctCount = (answers || []).filter(a => a.is_correct).length;
  const totalQuestions = participant.total_questions || 0;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const { data, error } = await supabase
    .from('live_exam_participants')
    .update({
      status: 'submitted',
      score,
      correct_count: correctCount,
      time_taken_seconds: timeTakenSeconds,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', participantId)
    .select('id, score, correct_count, total_questions, submitted_at')
    .single();

  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { action, participantId, accessCode } = req.query;

    try {
      if (action === 'questions') {
        if (!participantId) return res.status(400).json({ error: 'participantId gerekli' });

        const { data: participant, error: pErr } = await supabase
          .from('live_exam_participants')
          .select('id, exam_id, question_ids, status, submitted_at, live_exams:exam_id(id, title, duration_minutes, status, access_code, starts_at)')
          .eq('id', participantId)
          .single();

        if (pErr) return res.status(500).json({ error: pErr.message });

        if (participant?.live_exams && isExamTimeOver(participant.live_exams) && participant.status !== 'submitted') {
          const autoResult = await finalizeParticipant(participant.id);
          participant.status = 'submitted';
          participant.submitted_at = autoResult?.submitted_at || participant.submitted_at;
        }

        const questionIds = participant.question_ids || [];
        const { data: questions, error: qErr } = await supabase
          .from('questions')
          .select('id, text, type, options, difficulty')
          .in('id', questionIds);

        if (qErr) return res.status(500).json({ error: qErr.message });

        // Preserve assigned order
        const byId = new Map((questions || []).map(q => [q.id, q]));
        const ordered = questionIds.map(id => byId.get(id)).filter(Boolean);

        return res.status(200).json({
          success: true,
          participant,
          questions: ordered,
        });
      }

      if (action === 'leaderboard') {
        if (!accessCode) return res.status(400).json({ error: 'accessCode gerekli' });

        const { data: exam, error: eErr } = await supabase
          .from('live_exams')
          .select('id, title, status, access_code')
          .eq('access_code', String(accessCode).toUpperCase())
          .single();

        if (eErr) return res.status(404).json({ error: 'Sınav bulunamadı' });

        const { data: participants, error: pErr } = await supabase
          .from('live_exam_participants')
          .select('user_id, status, score, correct_count, total_questions, submitted_at')
          .eq('exam_id', exam.id)
          .order('score', { ascending: false, nullsFirst: false });

        if (pErr) return res.status(500).json({ error: pErr.message });

        return res.status(200).json({ success: true, exam, leaderboard: participants || [] });
      }

      return res.status(400).json({ error: 'Geçersiz action' });
    } catch (err) {
      console.error('live-exam GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};

    try {
      if (action === 'join') {
        const { accessCode, userId } = req.body;
        if (!accessCode || !userId) {
          return res.status(400).json({ error: 'accessCode ve userId gerekli' });
        }

        const { data: exam, error: eErr } = await supabase
          .from('live_exams')
          .select('id, topic_id, title, question_count, duration_minutes, status, access_code, starts_at')
          .eq('access_code', String(accessCode).toUpperCase())
          .single();

        if (eErr || !exam) return res.status(404).json({ error: 'Sınav kodu geçersiz' });
        if (exam.status === 'completed' || exam.status === 'cancelled') {
          return res.status(400).json({ error: 'Sınav artık aktif değil' });
        }
        if (exam.status === 'scheduled' && exam.starts_at && new Date(exam.starts_at).getTime() > Date.now()) {
          return res.status(400).json({ error: 'Sınav henüz başlamadı', startsAt: exam.starts_at });
        }
        if (isExamTimeOver(exam)) {
          return res.status(400).json({ error: 'Sınav süresi doldu' });
        }

        // Existing participant?
        const { data: existing } = await supabase
          .from('live_exam_participants')
          .select('id, question_ids, status')
          .eq('exam_id', exam.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          return res.status(200).json({
            success: true,
            participantId: existing.id,
            exam,
            resumed: true,
          });
        }

        const { data: questions, error: qErr } = await supabase
          .from('questions')
          .select('id')
          .eq('topic_id', exam.topic_id)
          .eq('is_active', true);

        if (qErr) return res.status(500).json({ error: qErr.message });
        if (!questions || questions.length === 0) {
          return res.status(400).json({ error: 'Bu konu için aktif soru yok' });
        }

        const assigned = shuffle(questions).slice(0, exam.question_count).map(q => q.id);

        const { data: participant, error: pErr } = await supabase
          .from('live_exam_participants')
          .insert({
            exam_id: exam.id,
            user_id: userId,
            question_ids: assigned,
            total_questions: assigned.length,
            status: 'joined',
          })
          .select('id')
          .single();

        if (pErr) return res.status(500).json({ error: pErr.message });

        return res.status(201).json({ success: true, participantId: participant.id, exam, resumed: false });
      }

      if (action === 'answer') {
        const { participantId, questionId, userAnswer } = req.body;
        if (!participantId || !questionId || userAnswer === undefined) {
          return res.status(400).json({ error: 'participantId, questionId, userAnswer gerekli' });
        }

        const { data: participant, error: pErr } = await supabase
          .from('live_exam_participants')
          .select('id, exam_id, question_ids, status, joined_at')
          .eq('id', participantId)
          .single();

        if (pErr) return res.status(500).json({ error: pErr.message });
        if (participant.status === 'submitted') return res.status(400).json({ error: 'Sınav zaten gönderildi' });

        const { data: examRow, error: eErr } = await supabase
          .from('live_exams')
          .select('id, status, starts_at, duration_minutes')
          .eq('id', participant.exam_id)
          .single();

        if (eErr) return res.status(500).json({ error: eErr.message });
        if (examRow.status === 'completed' || isExamTimeOver(examRow)) {
          const autoResult = await finalizeParticipant(participantId);
          return res.status(409).json({ success: false, error: 'Süre doldu, sınav otomatik gönderildi', autoSubmitted: true, result: autoResult });
        }

        if (!(participant.question_ids || []).includes(questionId)) {
          return res.status(400).json({ error: 'Soru bu katılımcıya atanmadı' });
        }

        const { data: q, error: qErr } = await supabase
          .from('questions')
          .select('correct_answer')
          .eq('id', questionId)
          .single();

        if (qErr) return res.status(500).json({ error: qErr.message });

        const isCorrect = String(q.correct_answer) === String(userAnswer);

        const { error } = await supabase
          .from('live_exam_answers')
          .upsert({
            participant_id: participantId,
            question_id: questionId,
            user_answer: userAnswer,
            is_correct: isCorrect,
          });

        if (error) return res.status(500).json({ error: error.message });

        return res.status(200).json({ success: true, isCorrect });
      }

      if (action === 'submit') {
        const { participantId, timeTakenSeconds } = req.body;
        if (!participantId) return res.status(400).json({ error: 'participantId gerekli' });
        const { data: participant, error: pErr } = await supabase
          .from('live_exam_participants')
          .select('id, exam_id')
          .eq('id', participantId)
          .single();

        if (pErr) return res.status(500).json({ error: pErr.message });

        const { data: examRow, error: eErr } = await supabase
          .from('live_exams')
          .select('id, starts_at, duration_minutes')
          .eq('id', participant.exam_id)
          .single();

        if (eErr) return res.status(500).json({ error: eErr.message });

        let effectiveTimeTaken = timeTakenSeconds || null;
        if (isExamTimeOver(examRow)) {
          const startMs = new Date(examRow.starts_at).getTime();
          effectiveTimeTaken = Math.max(0, Math.round((Date.now() - startMs) / 1000));
        }

        const result = await finalizeParticipant(participantId, effectiveTimeTaken);
        return res.status(200).json({ success: true, result });
      }

      return res.status(400).json({ error: 'Geçersiz action' });
    } catch (err) {
      console.error('live-exam POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
