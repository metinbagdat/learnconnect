/**
 * Quiz Component
 * Öğrenci için çoktan seçmeli / doğru-yanlış quiz sistemi
 * Adımlar: Yükleniyor → Soru → Cevap Göster → Sonuç
 */

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Award, ChevronRight, RotateCcw, BookOpen } from 'lucide-react';
import styles from './QuizComponent.module.css';

const QUIZ_STAGES = {
  LOADING: 'loading',
  QUESTION: 'question',
  ANSWER: 'answer',
  RESULT: 'result',
  ERROR: 'error',
};

export default function QuizComponent({ userId, topicId, topicName, userEmail, userName, onComplete }) {
  const [stage, setStage] = useState(QUIZ_STAGES.LOADING);
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Zamanlayıcı
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const questionStartRef = useRef(Date.now());

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Quiz başlat
  useEffect(() => {
    startQuiz();
  }, [topicId]);

  // Zaman sayacı
  useEffect(() => {
    if (stage === QUIZ_STAGES.QUESTION) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  async function startQuiz() {
    setStage(QUIZ_STAGES.LOADING);
    setError(null);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setElapsedSeconds(0);

    try {
      // 1. Soruları al
      const qRes = await fetch(`/api/quiz/questions?topic_id=${topicId}&limit=10&shuffle=true`);
      const qData = await qRes.json();

      if (!qData.success || !qData.questions.length) {
        setError('Bu konu için henüz soru eklenmemiş. Öğretmeninizle iletişime geçin.');
        setStage(QUIZ_STAGES.ERROR);
        return;
      }

      // 2. Oturum başlat
      const sRes = await fetch('/api/quiz/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topicId,
          questionIds: qData.questions.map(q => q.id),
        }),
      });
      const sData = await sRes.json();

      if (!sData.success) throw new Error(sData.error);

      setQuestions(qData.questions);
      setSessionId(sData.session.id);
      questionStartRef.current = Date.now();
      setStage(QUIZ_STAGES.QUESTION);
    } catch (err) {
      console.error('Quiz başlatma hatası:', err);
      setError('Quiz başlatılamadı. Lütfen tekrar dene.');
      setStage(QUIZ_STAGES.ERROR);
    }
  }

  async function submitAnswer(answer) {
    if (selectedAnswer !== null) return; // Çift tıklama önleme

    const questionElapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    setSelectedAnswer(answer);

    try {
      const res = await fetch('/api/quiz/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          userAnswer: answer,
          timeTakenSeconds: questionElapsed,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setIsCorrect(data.isCorrect);
      setStage(QUIZ_STAGES.ANSWER);
    } catch (err) {
      console.error('Cevap gönderme hatası:', err);
    }
  }

  async function goToNext() {
    if (isLastQuestion) {
      await finishQuiz();
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      questionStartRef.current = Date.now();
      setStage(QUIZ_STAGES.QUESTION);
    }
  }

  async function finishQuiz() {
    setStage(QUIZ_STAGES.LOADING);

    try {
      const res = await fetch('/api/quiz/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          timeTakenSeconds: elapsedSeconds,
          recipientEmail: userEmail,
          studentName: userName,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setResult(data.result);
      setStage(QUIZ_STAGES.RESULT);

      if (onComplete) onComplete(data.result);
    } catch (err) {
      console.error('Quiz bitirme hatası:', err);
      setError('Sonuçlar kaydedilemedi.');
      setStage(QUIZ_STAGES.ERROR);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Loading
  if (stage === QUIZ_STAGES.LOADING) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <p>Quiz hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  // Error
  if (stage === QUIZ_STAGES.ERROR) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <XCircle className={styles.errorIcon} />
          <h3>Bir sorun oluştu</h3>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={startQuiz}>
            <RotateCcw size={16} /> Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Result
  if (stage === QUIZ_STAGES.RESULT && result) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <Award className={styles.awardIcon} />
            <h2>Quiz Tamamlandı!</h2>
            <p className={styles.topicLabel}>{topicName}</p>
          </div>

          {/* Büyük skor */}
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{result.score}</span>
            <span className={styles.scoreLabel}>/ 100</span>
          </div>

          {/* Harf notu */}
          <div className={`${styles.gradeBadge} ${styles[`grade${result.grade.letter}`]}`}>
            {result.grade.label}
          </div>

          {/* İstatistikler */}
          <div className={styles.resultStats}>
            <div className={styles.statItem}>
              <CheckCircle size={20} className={styles.correct} />
              <span>{result.correctCount} Doğru</span>
            </div>
            <div className={styles.statItem}>
              <XCircle size={20} className={styles.wrong} />
              <span>{result.totalQuestions - result.correctCount} Yanlış</span>
            </div>
            <div className={styles.statItem}>
              <Clock size={20} className={styles.time} />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          </div>

          {/* Cevap özeti */}
          {result.answers && result.answers.length > 0 && (
            <div className={styles.answerSummary}>
              <h4>Cevap Özeti</h4>
              {result.answers.map((a, idx) => (
                <div
                  key={idx}
                  className={`${styles.answerRow} ${a.is_correct ? styles.correctRow : styles.wrongRow}`}
                >
                  <span className={styles.answerNumber}>{idx + 1}.</span>
                  <span className={styles.answerText}>{a.questions?.text?.slice(0, 60)}...</span>
                  <span className={styles.answerStatus}>
                    {a.is_correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </span>
                  {!a.is_correct && a.questions?.explanation && (
                    <div className={styles.explanation}>
                      💡 {a.questions.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Butonlar */}
          <div className={styles.resultActions}>
            <button className={styles.retryBtn} onClick={startQuiz}>
              <RotateCcw size={16} /> Tekrar Çöz
            </button>
            <button
              className={styles.continueBtn}
              onClick={() => onComplete && onComplete(result)}
            >
              <BookOpen size={16} /> Devam Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question / Answer stage
  return (
    <div className={styles.container}>
      <div className={styles.quizCard}>
        {/* Quiz Header */}
        <div className={styles.quizHeader}>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              />
            </div>
            <span>
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div className={styles.timer}>
            <Clock size={16} />
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Konu adı */}
        <div className={styles.topicBadge}>{topicName}</div>

        {/* Zorluk */}
        <div className={`${styles.difficultyBadge} ${styles[`diff${currentQuestion.difficulty}`]}`}>
          {'★'.repeat(currentQuestion.difficulty)}{'☆'.repeat(5 - currentQuestion.difficulty)}
        </div>

        {/* Soru Metni */}
        <div className={styles.questionText}>
          <p>{currentQuestion.text}</p>
        </div>

        {/* Şıklar */}
        <div className={styles.options}>
          {currentQuestion.type === 'true_false' ? (
            // Doğru/Yanlış
            <>
              {['true', 'false'].map(opt => (
                <button
                  key={opt}
                  className={`${styles.optionBtn} ${
                    stage === QUIZ_STAGES.ANSWER
                      ? opt === currentQuestion.correct_answer
                        ? styles.correctOption
                        : selectedAnswer === opt
                        ? styles.wrongOption
                        : styles.neutralOption
                      : selectedAnswer === opt
                      ? styles.selectedOption
                      : ''
                  }`}
                  onClick={() => submitAnswer(opt)}
                  disabled={stage === QUIZ_STAGES.ANSWER}
                >
                  <span className={styles.optionLabel}>{opt === 'true' ? '✓ Doğru' : '✗ Yanlış'}</span>
                </button>
              ))}
            </>
          ) : (
            // Çoktan seçmeli
            currentQuestion.options?.map(opt => (
              <button
                key={opt.id}
                className={`${styles.optionBtn} ${
                  stage === QUIZ_STAGES.ANSWER
                    ? opt.id === currentQuestion.correct_answer
                      ? styles.correctOption
                      : selectedAnswer === opt.id
                      ? styles.wrongOption
                      : styles.neutralOption
                    : selectedAnswer === opt.id
                    ? styles.selectedOption
                    : ''
                }`}
                onClick={() => submitAnswer(opt.id)}
                disabled={stage === QUIZ_STAGES.ANSWER}
              >
                <span className={styles.optionKey}>{opt.id}</span>
                <span className={styles.optionText}>{opt.text}</span>
              </button>
            ))
          )}
        </div>

        {/* Cevap Sonrası Göster */}
        {stage === QUIZ_STAGES.ANSWER && (
          <div className={`${styles.feedback} ${isCorrect ? styles.correctFeedback : styles.wrongFeedback}`}>
            <div className={styles.feedbackHeader}>
              {isCorrect ? (
                <><CheckCircle size={20} /> <strong>Doğru!</strong></>
              ) : (
                <><XCircle size={20} /> <strong>Yanlış!</strong> Doğru cevap: <strong>{currentQuestion.correct_answer}</strong></>
              )}
            </div>
            {currentQuestion.explanation && (
              <p className={styles.feedbackExplanation}>💡 {currentQuestion.explanation}</p>
            )}
            <button className={styles.nextBtn} onClick={goToNext}>
              {isLastQuestion ? 'Sonuçları Gör' : 'Sonraki Soru'}
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
