/**
 * Quiz Oturum API
 * POST /api/quiz/session        → Yeni oturum başlat
 * PUT  /api/quiz/session        → Cevap gönder
 * PATCH /api/quiz/session       → Oturumu bitir (skor hesapla)
 * GET  /api/quiz/session        → Oturum sonucunu getir
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  // POST: Yeni quiz oturumu başlat
  if (req.method === 'POST') {
    const { userId, topicId, questionIds } = req.body;

    if (!userId || !topicId || !questionIds?.length) {
      return res.status(400).json({ error: 'userId, topicId ve questionIds gerekli' });
    }

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        topic_id: topicId,
        question_ids: questionIds,
        total_questions: questionIds.length,
        status: 'started',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ success: true, session: data });
  }

  // PUT: Cevap kaydet
  if (req.method === 'PUT') {
    const { sessionId, questionId, userAnswer, timeTakenSeconds } = req.body;

    if (!sessionId || !questionId || userAnswer === undefined) {
      return res.status(400).json({ error: 'sessionId, questionId ve userAnswer gerekli' });
    }

    // Doğru cevabı al
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single();

    if (qErr) return res.status(500).json({ error: qErr.message });

    const isCorrect = question.correct_answer === userAnswer;

    // Cevabı kaydet
    const { data, error } = await supabase
      .from('quiz_answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_taken_seconds: timeTakenSeconds || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true, answer: data, isCorrect });
  }

  // PATCH: Oturumu bitir (skor hesapla)
  if (req.method === 'PATCH') {
    const { sessionId, timeTakenSeconds, recipientEmail, studentName } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId gerekli' });
    }

    // Oturumu al
    const { data: session, error: sErr } = await supabase
      .from('quiz_sessions')
      .select('total_questions')
      .eq('id', sessionId)
      .single();

    if (sErr) return res.status(500).json({ error: sErr.message });

    // Doğru cevap sayısını hesapla
    const { data: answers, error: aErr } = await supabase
      .from('quiz_answers')
      .select('is_correct')
      .eq('session_id', sessionId);

    if (aErr) return res.status(500).json({ error: aErr.message });

    const correctCount = answers.filter(a => a.is_correct).length;
    const score = Math.round((correctCount / session.total_questions) * 100);

    // Oturumu güncelle
    const { data, error } = await supabase
      .from('quiz_sessions')
      .update({
        status: 'completed',
        score,
        correct_count: correctCount,
        time_taken_seconds: timeTakenSeconds || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Sonuç detaylarını da getir
    const { data: detailedAnswers } = await supabase
      .from('quiz_answers')
      .select(`
        question_id,
        user_answer,
        is_correct,
        questions:question_id(text, correct_answer, explanation)
      `)
      .eq('session_id', sessionId);

    const resultPayload = {
      score,
      correctCount,
      totalQuestions: session.total_questions,
      percentage: `${score}%`,
      grade: getGrade(score),
      answers: detailedAnswers || [],
    };

    const emailState = await sendQuizCompletionEmail({
      sessionId,
      recipientEmail,
      studentName,
      result: resultPayload,
      elapsedSeconds: timeTakenSeconds || null,
    });

    return res.status(200).json({
      success: true,
      session: data,
      result: resultPayload,
      notification: emailState,
    });
  }

  // GET: Oturum sonucunu getir
  if (req.method === 'GET') {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId gerekli' });
    }

    const { data: session, error: sErr } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sErr) return res.status(500).json({ error: sErr.message });

    const { data: answers, error: aErr } = await supabase
      .from('quiz_answers')
      .select(`
        question_id,
        user_answer,
        is_correct,
        time_taken_seconds,
        questions:question_id(text, correct_answer, explanation, options)
      `)
      .eq('session_id', sessionId);

    if (aErr) return res.status(500).json({ error: aErr.message });

    return res.status(200).json({
      success: true,
      session,
      answers: answers || [],
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Quiz tamamlandı e-postası gönderir.
 * Hata durumunda quiz akışını bozmaz, sadece durum döner.
 */
async function sendQuizCompletionEmail({ sessionId, recipientEmail, studentName, result, elapsedSeconds }) {
  try {
    let resolvedEmail = recipientEmail;
    let topicName = 'Quiz';

    const { data: sessionData } = await supabase
      .from('quiz_sessions')
      .select('user_id, topics:topic_id(name)')
      .eq('id', sessionId)
      .single();

    if (sessionData?.topics?.name) topicName = sessionData.topics.name;

    if (!resolvedEmail && sessionData?.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(sessionData.user_id);
      resolvedEmail = authUser?.user?.email;
    }

    if (!resolvedEmail) {
      return { sent: false, reason: 'recipient_email_not_available' };
    }

    const durationText =
      typeof elapsedSeconds === 'number'
        ? `${Math.floor(elapsedSeconds / 60)} dk ${elapsedSeconds % 60} sn`
        : '-';

    const subject = 'Quiz Sonucun Hazır 🎯';
    const textBody = `
Merhaba ${studentName || 'Öğrenci'},

${topicName} oturumun tamamlandı.

Sonuç Özeti:
- Skor: %${result?.score ?? '-'}
- Doğru Sayısı: ${result?.correctCount ?? '-'} / ${result?.totalQuestions ?? '-'}
- Harf Notu: ${result?.grade?.letter || '-'}
- Süre: ${durationText}

İyi çalışmalar,
LearnConnect Ekibi
    `;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await resend.emails.send({
        from,
        to: resolvedEmail,
        subject,
        html: textBody.replace(/\n/g, '<br>'),
      });
    } else {
      console.log('📧 Quiz completion email (simulated):', {
        to: resolvedEmail,
        subject,
        score: result?.score,
      });
    }

    return { sent: true, recipient: resolvedEmail };
  } catch (error) {
    console.error('Quiz completion email error:', error);
    return { sent: false, reason: 'send_failed', error: error.message };
  }
}

/**
 * Puan → Harf notu
 */
function getGrade(score) {
  if (score >= 90) return { letter: 'A', label: 'Mükemmel! 🏆' };
  if (score >= 75) return { letter: 'B', label: 'Çok İyi! ⭐' };
  if (score >= 60) return { letter: 'C', label: 'İyi 👍' };
  if (score >= 40) return { letter: 'D', label: 'Geçer ⚠️' };
  return { letter: 'F', label: 'Tekrar Çalış 📚' };
}
