import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LiveExamPage() {
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('live_exam_state');
    if (saved) {
      const state = JSON.parse(saved);
      if (state.participantId) {
        setParticipantId(state.participantId);
        setCode(state.code || '');
        setUserId(state.userId || '');
      }
    }

    // Try session-backed user to prefill student identity
    fetch('/api/user')
      .then(r => r.json())
      .then(u => {
        if (!u) return;
        if (!userId && u.id && String(u.id) !== '0') setUserId(String(u.id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (participantId) {
      fetchQuestions(participantId);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
      localStorage.setItem('live_exam_state', JSON.stringify({ participantId, code, userId }));
    }
    return () => clearInterval(timerRef.current);
  }, [participantId]);

  useEffect(() => {
    if (!exam?.duration_minutes || result || !participantId) return;
    const maxSeconds = Number(exam.duration_minutes) * 60;
    if (!autoSubmittedRef.current && elapsed >= maxSeconds) {
      autoSubmittedRef.current = true;
      submitExam();
    }
  }, [elapsed, exam?.duration_minutes, result, participantId]);

  const currentQuestion = questions[current];
  const progress = useMemo(() => (questions.length ? Math.round(((current + 1) / questions.length) * 100) : 0), [current, questions.length]);

  async function joinExam() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/live-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', accessCode: code.toUpperCase(), userId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Katılım başarısız');

      setParticipantId(data.participantId);
      setExam(data.exam);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestions(pid) {
    try {
      const res = await fetch(`${API_BASE}/api/live-exam?action=questions&participantId=${pid}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Sorular yüklenemedi');
      setExam(data.participant.live_exams || null);
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    const res = await fetch(`${API_BASE}/api/live-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'answer', participantId, questionId, userAnswer: value }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && data?.autoSubmitted && data?.result) {
      clearInterval(timerRef.current);
      setResult(data.result);
      localStorage.removeItem('live_exam_state');
    }
  }

  async function submitExam() {
    try {
      const res = await fetch(`${API_BASE}/api/live-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', participantId, timeTakenSeconds: elapsed }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Gönderme başarısız');
      clearInterval(timerRef.current);
      setResult(data.result);
      localStorage.removeItem('live_exam_state');
    } catch (e) {
      setError(e.message);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800">Sınav Tamamlandı</h1>
          <p className="mt-3 text-gray-600">Skorunuz</p>
          <p className="text-5xl font-extrabold text-emerald-600 mt-2">%{result.score}</p>
          <p className="mt-4 text-gray-700">Doğru: {result.correct_count} / {result.total_questions}</p>
          <a href="/tyt-dashboard" className="inline-block mt-6 px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Panele Dön</a>
        </div>
      </div>
    );
  }

  if (!participantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
          <h1 className="text-2xl font-bold text-gray-800">Canlı Sınava Katıl</h1>
          <p className="text-gray-600 mt-2">Öğretmenin paylaştığı kod ile katıl.</p>

          <div className="mt-6 space-y-3">
            <input
              className="w-full border rounded-lg px-4 py-3"
              placeholder="Öğrenci ID (UUID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <input
              className="w-full border rounded-lg px-4 py-3 uppercase tracking-widest"
              placeholder="Sınav Kodu (örn: AB12CD)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading || !userId || !code}
              onClick={joinExam}
            >
              {loading ? 'Katılınıyor...' : 'Sınava Katıl'}
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{exam?.title || 'Canlı Sınav'}</h2>
            <p className="text-sm text-gray-600">Kod: <strong>{exam?.access_code || code.toUpperCase()}</strong></p>
          </div>
          <div className="text-sm font-semibold text-blue-700">Süre: {formatTime(elapsed)}</div>
        </div>

        <div className="px-6 pt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Soru {current + 1} / {questions.length}</p>
        </div>

        {currentQuestion ? (
          <div className="p-6 md:p-8">
            <p className="text-lg font-semibold text-gray-800">{currentQuestion.text}</p>
            <div className="mt-5 space-y-3">
              {currentQuestion.type === 'true_false' ? (
                ['true', 'false'].map(v => (
                  <button
                    key={v}
                    className={`w-full text-left px-4 py-3 border rounded-lg transition ${answers[currentQuestion.id] === v ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                    onClick={() => saveAnswer(currentQuestion.id, v)}
                  >
                    {v === 'true' ? 'Doğru' : 'Yanlış'}
                  </button>
                ))
              ) : (
                (currentQuestion.options || []).map(opt => (
                  <button
                    key={opt.id}
                    className={`w-full text-left px-4 py-3 border rounded-lg transition ${answers[currentQuestion.id] === opt.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                    onClick={() => saveAnswer(currentQuestion.id, opt.id)}
                  >
                    <strong>{opt.id})</strong> {opt.text}
                  </button>
                ))
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                disabled={current === 0}
                onClick={() => setCurrent(c => c - 1)}
              >
                Önceki
              </button>
              {current < questions.length - 1 ? (
                <button
                  className="px-5 py-2 rounded bg-blue-600 text-white font-semibold"
                  onClick={() => setCurrent(c => c + 1)}
                >
                  Sonraki
                </button>
              ) : (
                <button
                  className="px-5 py-2 rounded bg-emerald-600 text-white font-semibold"
                  onClick={submitExam}
                >
                  Sınavı Gönder
                </button>
              )}
            </div>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">Sorular yükleniyor...</div>
        )}
      </div>
    </div>
  );
}
