import React, { useState, useEffect, useCallback } from 'react';
import styles from './TeacherDashboard.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const GRADE_COLOR = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

function gradeFromScore(score) {
  if (score === null || score === undefined) return { letter: '—', color: '#9ca3af' };
  if (score >= 90) return { letter: 'A', color: GRADE_COLOR.A };
  if (score >= 75) return { letter: 'B', color: GRADE_COLOR.B };
  if (score >= 60) return { letter: 'C', color: GRADE_COLOR.C };
  if (score >= 40) return { letter: 'D', color: GRADE_COLOR.D };
  return { letter: 'F', color: GRADE_COLOR.F };
}

function ScoreBadge({ score }) {
  const { letter, color } = gradeFromScore(score);
  return (
    <span className={styles.scoreBadge} style={{ backgroundColor: color }}>
      {score !== null && score !== undefined ? `${score}% ` : ''}{letter}
    </span>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: accent }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

// ── Özet Sekmesi ──────────────────────────────────────────────────
function SummaryTab({ summary }) {
  if (!summary) return <div className={styles.loading}>Yükleniyor…</div>;
  return (
    <div className={styles.statsGrid}>
      <StatCard label="Aktif Öğrenci" value={summary.totalStudents} icon="👩‍🎓" accent="#667eea" />
      <StatCard label="Tamamlanan Quiz" value={summary.totalQuizCompleted} icon="✅" accent="#22c55e" />
      <StatCard label="Ortalama Skor" value={`%${summary.averageScore}`} icon="📊" accent="#f59e0b" />
      <StatCard label="Bu Hafta Quiz" value={summary.quizzesThisWeek} icon="🗓️" accent="#a78bfa" />
      <StatCard label="Toplam Konu" value={summary.totalTopics} icon="📚" accent="#06b6d4" />
    </div>
  );
}

// ── Öğrenci Listesi ──────────────────────────────────────────────
function StudentsTab({ students, onSelectStudent }) {
  const [search, setSearch] = useState('');
  const filtered = (students || []).filter(s =>
    s.userId.toLowerCase().includes(search.toLowerCase())
  );

  if (!students) return <div className={styles.loading}>Yükleniyor…</div>;

  return (
    <div>
      <input
        className={styles.searchInput}
        placeholder="Öğrenci ara (user ID)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Quiz Sayısı</th>
              <th>Ort. Skor</th>
              <th>Müfredat %</th>
              <th>Son Quiz</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className={styles.emptyRow}>Öğrenci bulunamadı</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.userId} className={styles.tableRow}>
                <td className={styles.userId}>
                  <span className={styles.avatar}>{s.userId.charAt(0).toUpperCase()}</span>
                  <span className={styles.userIdText}>{s.userId.slice(0, 12)}…</span>
                </td>
                <td>{s.quizCount}</td>
                <td><ScoreBadge score={s.averageScore} /></td>
                <td>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${s.completionPct}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{s.completionPct}%</span>
                </td>
                <td className={styles.dimText}>
                  {s.lastQuiz?.completedAt
                    ? new Date(s.lastQuiz.completedAt).toLocaleDateString('tr-TR')
                    : '—'}
                </td>
                <td>
                  <button
                    className={styles.detailBtn}
                    onClick={() => onSelectStudent(s.userId)}
                  >
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Öğrenci Detay Paneli ─────────────────────────────────────────
function StudentDetail({ studentId, onBack }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('quizzes'); // quizzes | curriculum

  useEffect(() => {
    fetch(`${API_BASE}/api/teacher/dashboard?view=student_detail&studentId=${studentId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(console.error);
  }, [studentId]);

  if (!data) return <div className={styles.loading}>Öğrenci yükleniyor…</div>;

  return (
    <div className={styles.detailPanel}>
      <button className={styles.backBtn} onClick={onBack}>← Geri</button>
      <h2 className={styles.detailTitle}>Öğrenci: <code>{studentId.slice(0, 16)}…</code></h2>

      {/* Mini stats */}
      <div className={styles.miniStats}>
        <span>🎯 Tamamlanan Quiz: <strong>{data.stats.completedQuizzes}</strong></span>
        <span>📊 Ort. Skor: <strong>{data.stats.averageScore !== null ? `%${data.stats.averageScore}` : '—'}</strong></span>
        <span>📚 Konular: <strong>{data.stats.topicsCompleted}/{data.stats.totalTopicsInCurriculum}</strong></span>
      </div>

      {/* Alt sekme */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${tab === 'quizzes' ? styles.subTabActive : ''}`}
          onClick={() => setTab('quizzes')}
        >
          Quiz Geçmişi
        </button>
        <button
          className={`${styles.subTab} ${tab === 'curriculum' ? styles.subTabActive : ''}`}
          onClick={() => setTab('curriculum')}
        >
          Müfredat
        </button>
      </div>

      {tab === 'quizzes' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Konu</th>
                <th>Ders</th>
                <th>Skor</th>
                <th>Not</th>
                <th>Doğru/Toplam</th>
                <th>Süre</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSessions.length === 0 && (
                <tr><td colSpan={7} className={styles.emptyRow}>Quiz bulunamadı</td></tr>
              )}
              {data.recentSessions.map(s => (
                <tr key={s.id} className={styles.tableRow}>
                  <td>{s.topic || '—'}</td>
                  <td className={styles.dimText}>{s.subject || '—'}</td>
                  <td><ScoreBadge score={s.score} /></td>
                  <td>
                    <span
                      className={styles.gradePill}
                      style={{ backgroundColor: GRADE_COLOR[s.grade] || '#9ca3af' }}
                    >
                      {s.grade}
                    </span>
                  </td>
                  <td>{s.correctCount}/{s.totalQuestions}</td>
                  <td className={styles.dimText}>{s.timeTaken ? `${Math.ceil(s.timeTaken / 60)} dk` : '—'}</td>
                  <td className={styles.dimText}>
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString('tr-TR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'curriculum' && (
        <div className={styles.curriculumGrid}>
          {data.curriculum.map((c, i) => (
            <div
              key={i}
              className={`${styles.topicCard} ${c.status === 'completed' ? styles.topicDone : ''}`}
            >
              <div className={styles.topicName}>{c.topicName}</div>
              <div className={styles.topicMeta}>{c.subject} • {c.unit}</div>
              <div className={`${styles.topicStatus} ${c.status === 'completed' ? styles.statusDone : ''}`}>
                {c.status === 'completed' ? '✅ Tamamlandı' : c.status === 'in_progress' ? '🔄 Devam Ediyor' : '⏳ Başlanmadı'}
              </div>
            </div>
          ))}
          {data.curriculum.length === 0 && (
            <p className={styles.dimText}>Müfredat kaydı yok.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Konu İstatistikleri Sekmesi ───────────────────────────────────
function QuizStatsTab({ topicStats }) {
  if (!topicStats) return <div className={styles.loading}>Yükleniyor…</div>;
  return (
    <div>
      <p className={styles.hint}>En düşük ortalama skora sahip konular üstte (zorlu konular)</p>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Konu</th>
              <th>Ders</th>
              <th>Quiz Sayısı</th>
              <th>Ortalama</th>
              <th>En Düşük</th>
              <th>En Yüksek</th>
            </tr>
          </thead>
          <tbody>
            {topicStats.length === 0 && (
              <tr><td colSpan={6} className={styles.emptyRow}>Veri yok</td></tr>
            )}
            {topicStats.map(t => (
              <tr key={t.topicId} className={styles.tableRow}>
                <td>{t.topicName}</td>
                <td className={styles.dimText}>{t.subject}</td>
                <td>{t.quizCount}</td>
                <td><ScoreBadge score={t.averageScore} /></td>
                <td className={styles.dimText}>%{t.minScore}</td>
                <td className={styles.dimText}>%{t.maxScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Canlı Sınav Sekmesi ─────────────────────────────────────────
function LiveExamsTab({ currentUser }) {
  const [teacherId, setTeacherId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('Canlı TYT Denemesi');
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const inferredTeacherId = currentUser?.uid || currentUser?.id || '';
    if (inferredTeacherId && !teacherId) {
      setTeacherId(String(inferredTeacherId));
    }
  }, [currentUser, teacherId]);

  async function loadExams() {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/live-exams?teacherId=${teacherId}`);
      const data = await res.json();
      if (data.success) setExams(data.exams || []);
    } finally {
      setLoading(false);
    }
  }

  async function createExam() {
    if (!teacherId || !topicId || !title) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/live-exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, topicId, title, questionCount, durationMinutes }),
      });
      const data = await res.json();
      if (data.success) {
        await loadExams();
      }
    } finally {
      setLoading(false);
    }
  }

  async function examAction(examId, action) {
    await fetch(`${API_BASE}/api/teacher/live-exams`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, action }),
    });
    await loadExams();
    if (selectedExam?.id === examId) await openDetail(examId);
  }

  async function openDetail(examId) {
    setSelectedExam(examId);
    const res = await fetch(`${API_BASE}/api/teacher/live-exams?teacherId=${teacherId}&examId=${examId}`);
    const data = await res.json();
    if (data.success) setDetail(data);
  }

  useEffect(() => {
    if (!selectedExam || !teacherId || detail?.exam?.status !== 'live') return;

    const interval = setInterval(() => {
      openDetail(selectedExam);
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedExam, teacherId, detail?.exam?.status]);

  return (
    <div>
      <div className={styles.liveControls}>
        <input
          className={styles.searchInput}
          placeholder="Öğretmen ID (UUID)"
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
        />
        <div className={styles.liveControlRow}>
          <input className={styles.searchInput} placeholder="Konu ID" value={topicId} onChange={e => setTopicId(e.target.value)} />
          <input className={styles.searchInput} placeholder="Sınav başlığı" value={title} onChange={e => setTitle(e.target.value)} />
          <input className={styles.searchInput} type="number" min={3} max={40} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} />
          <input className={styles.searchInput} type="number" min={5} max={120} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
          <button className={styles.detailBtn} onClick={createExam} disabled={loading}>Sınav Oluştur</button>
          <button className={styles.backBtn} onClick={loadExams} disabled={!teacherId || loading}>Listele</button>
        </div>
        <p className={styles.hint}>Öğrenciler `/live-exam` sayfasında sınav kodu ile katılır.</p>
      </div>

      <div className={styles.liveGrid}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Kod</th>
                <th>Durum</th>
                <th>Katılım</th>
                <th>Ort.</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {!loading && exams.length === 0 && <tr><td colSpan={6} className={styles.emptyRow}>Sınav yok</td></tr>}
              {exams.map(exam => (
                <tr key={exam.id} className={styles.tableRow}>
                  <td>{exam.title}</td>
                  <td><code>{exam.access_code}</code></td>
                  <td>{exam.status}</td>
                  <td>{exam.submittedCount}/{exam.joinedCount}</td>
                  <td>{exam.averageScore !== null ? `%${exam.averageScore}` : '—'}</td>
                  <td className={styles.actionCell}>
                    <button className={styles.detailBtn} onClick={() => openDetail(exam.id)}>Detay</button>
                    {exam.status !== 'live' && exam.status !== 'completed' && (
                      <button className={styles.startBtn} onClick={() => examAction(exam.id, 'start')}>Başlat</button>
                    )}
                    {exam.status === 'live' && (
                      <button className={styles.endBtn} onClick={() => examAction(exam.id, 'end')}>Bitir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {detail && (
          <div className={styles.detailPanel}>
            <h3 className={styles.detailTitle}>{detail.exam.title}</h3>
            <p className={styles.dimText}>Kod: <code>{detail.exam.access_code}</code> • Durum: {detail.exam.status}</p>
            <div className={styles.miniStats}>
              <span>👥 Katılan: <strong>{detail.metrics.joinedCount}</strong></span>
              <span>✅ Gönderen: <strong>{detail.metrics.submittedCount}</strong></span>
              <span>📊 Ort: <strong>{detail.metrics.averageScore !== null ? `%${detail.metrics.averageScore}` : '—'}</strong></span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Öğrenci</th>
                    <th>Durum</th>
                    <th>Skor</th>
                    <th>Doğru</th>
                    <th>Gönderim</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.participants.length === 0 && <tr><td colSpan={5} className={styles.emptyRow}>Henüz katılım yok</td></tr>}
                  {detail.participants.map(p => (
                    <tr key={p.id} className={styles.tableRow}>
                      <td className={styles.userIdText}>{p.user_id?.slice(0, 12)}…</td>
                      <td>{p.status}</td>
                      <td>{p.score !== null ? `%${p.score}` : '—'}</td>
                      <td>{p.correct_count}/{p.total_questions}</td>
                      <td className={styles.dimText}>{p.submitted_at ? new Date(p.submitted_at).toLocaleTimeString('tr-TR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Görev Atama Sekmesi ─────────────────────────────────────────
function AssignmentsTab({ currentUser }) {
  const [teacherId, setTeacherId] = useState('');
  const [students, setStudents] = useState([]);
  const [topics, setTopics] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [topicId, setTopicId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState(null);

  useEffect(() => {
    const inferred = currentUser?.uid || currentUser?.id || '';
    if (inferred && !teacherId) setTeacherId(String(inferred));
  }, [currentUser, teacherId]);

  async function loadStudentsAndTopics() {
    const [sRes, tRes] = await Promise.all([
      fetch(`${API_BASE}/api/teacher/dashboard?view=students`),
      fetch(`${API_BASE}/api/teacher/topics?limit=500`),
    ]);
    const [sData, tData] = await Promise.all([sRes.json(), tRes.json()]);
    if (sData.success) setStudents(sData.students || []);
    if (tData.success) setTopics(tData.topics || []);
  }

  async function loadAssignments() {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/assignments?teacherId=${teacherId}`);
      const data = await res.json();
      if (data.success) setAssignments(data.assignments || []);
    } finally {
      setLoading(false);
    }
  }

  async function createAssignment() {
    if (!teacherId || selectedStudentIds.length === 0 || !topicId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          studentIds: selectedStudentIds,
          topicId,
          dueAt: dueAt || null,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNote('');
        setSelectedStudentIds([]);
        const inserted = Number(data.insertedCount || 0);
        const skipped = Number(data.skippedCount || 0);
        const type = skipped > 0 ? 'warn' : 'success';
        const message = skipped > 0
          ? `Toplu atama tamamlandı: ${inserted} eklendi, ${skipped} atlandı.`
          : `Toplu atama başarılı: ${inserted} görev eklendi.`;

        setAssignmentFeedback({
          type,
          message,
          inserted,
          skipped,
          skippedStudentIds: data.skippedStudentIds || [],
        });
        await loadAssignments();
      } else {
        setAssignmentFeedback({
          type: 'error',
          message: data.error || 'Toplu atama sırasında hata oluştu.',
          inserted: 0,
          skipped: 0,
          skippedStudentIds: [],
        });
      }
    } catch (err) {
      setAssignmentFeedback({
        type: 'error',
        message: err.message || 'Toplu atama sırasında hata oluştu.',
        inserted: 0,
        skipped: 0,
        skippedStudentIds: [],
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleStudent(studentId) {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }

  function selectAllStudents() {
    const allIds = students.map(s => s.userId);
    setSelectedStudentIds(allIds);
  }

  function clearSelectedStudents() {
    setSelectedStudentIds([]);
  }

  async function cancelAssignment(assignmentId) {
    await fetch(`${API_BASE}/api/teacher/assignments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId, action: 'cancel' }),
    });
    await loadAssignments();
  }

  useEffect(() => {
    loadStudentsAndTopics();
  }, []);

  useEffect(() => {
    if (teacherId) loadAssignments();
  }, [teacherId]);

  return (
    <div>
      <div className={styles.liveControls}>
        <input
          className={styles.searchInput}
          placeholder="Öğretmen ID (UUID)"
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
        />
        <div className={styles.liveControlRowAssignments}>
          <div className={styles.studentPickerBox}>
            <div className={styles.studentPickerHeader}>
              <strong>Öğrenciler ({selectedStudentIds.length} seçili)</strong>
              <div className={styles.studentPickerActions}>
                <button type="button" className={styles.backBtn} onClick={selectAllStudents}>Tümünü Seç</button>
                <button type="button" className={styles.backBtn} onClick={clearSelectedStudents}>Temizle</button>
              </div>
            </div>
            <div className={styles.studentPickerList}>
              {students.map(s => (
                <label key={s.userId} className={styles.studentOption}>
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.userId)}
                    onChange={() => toggleStudent(s.userId)}
                  />
                  <span>{s.userId.slice(0, 14)}... (Quiz: {s.quizCount})</span>
                </label>
              ))}
              {students.length === 0 && <span className={styles.dimText}>Öğrenci bulunamadı</span>}
            </div>
          </div>

          <select className={styles.searchInput} value={topicId} onChange={e => setTopicId(e.target.value)}>
            <option value="">Konu seç</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>
                {t.subjects?.name || '-'} / {t.units?.name || '-'} / {t.name}
              </option>
            ))}
          </select>

          <input className={styles.searchInput} type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
          <input className={styles.searchInput} placeholder="Not (opsiyonel)" value={note} onChange={e => setNote(e.target.value)} />
          <button className={styles.detailBtn} onClick={createAssignment} disabled={loading || !teacherId || selectedStudentIds.length === 0}>
            Toplu Ata ({selectedStudentIds.length})
          </button>
          <button className={styles.backBtn} onClick={loadAssignments} disabled={!teacherId || loading}>Yenile</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {assignmentFeedback && (
          <div
            className={`${styles.assignmentFeedback} ${
              assignmentFeedback.type === 'success'
                ? styles.assignmentFeedbackSuccess
                : assignmentFeedback.type === 'warn'
                  ? styles.assignmentFeedbackWarn
                  : styles.assignmentFeedbackError
            }`}
          >
            <p>{assignmentFeedback.message}</p>
            <div className={styles.assignmentFeedbackMeta}>
              <span>Eklendi: {assignmentFeedback.inserted}</span>
              <span>Atlandı: {assignmentFeedback.skipped}</span>
              {assignmentFeedback.skippedStudentIds?.length > 0 && (
                <span>Atlanan Öğrenci Sayısı: {assignmentFeedback.skippedStudentIds.length}</span>
              )}
            </div>
            {assignmentFeedback.skippedStudentIds?.length > 0 && (
              <div className={styles.skippedIdList}>
                {assignmentFeedback.skippedStudentIds.map((id) => (
                  <span key={id} className={styles.skippedIdChip} title={id}>
                    {String(id).slice(0, 8)}...
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Ders / Konu</th>
              <th>Durum</th>
              <th>Teslim</th>
              <th>Not</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {!loading && assignments.length === 0 && <tr><td colSpan={6} className={styles.emptyRow}>Atama yok</td></tr>}
            {assignments.map(a => (
              <tr key={a.id} className={styles.tableRow}>
                <td className={styles.userIdText}>{a.student_id?.slice(0, 12)}...</td>
                <td>{a.topics?.subjects?.name || '-'} / {a.topics?.name || '-'}</td>
                <td>{a.status}</td>
                <td className={styles.dimText}>{a.due_at ? new Date(a.due_at).toLocaleString('tr-TR') : '-'}</td>
                <td className={styles.dimText}>{a.note || '-'}</td>
                <td>
                  {a.status !== 'cancelled' && a.status !== 'completed' ? (
                    <button className={styles.endBtn} onClick={() => cancelAssignment(a.id)}>İptal</button>
                  ) : (
                    <span className={styles.dimText}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────────
export default function TeacherDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState(null);
  const [topicStats, setTopicStats] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState({});

  const fetchIfNeeded = useCallback(async (view, setter) => {
    if (loading[view]) return;
    setLoading(l => ({ ...l, [view]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/teacher/dashboard?view=${view}`);
      const data = await res.json();
      if (data.success) {
        if (view === 'summary') setter(data.summary);
        else if (view === 'students') setter(data.students);
        else if (view === 'quiz_stats') setter(data.topicStats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(l => ({ ...l, [view]: false }));
    }
  }, [loading]);

  useEffect(() => {
    if (activeTab === 'summary' && !summary) fetchIfNeeded('summary', setSummary);
    if (activeTab === 'students' && !students) fetchIfNeeded('students', setStudents);
    if (activeTab === 'quiz_stats' && !topicStats) fetchIfNeeded('quiz_stats', setTopicStats);
  }, [activeTab]);

  const tabs = [
    { id: 'summary', label: '📊 Özet' },
    { id: 'students', label: '👩‍🎓 Öğrenciler' },
    { id: 'quiz_stats', label: '📝 Quiz Analizi' },
    { id: 'live_exams', label: '🔴 Canlı Sınav' },
    { id: 'assignments', label: '📌 Görev Atama' },
  ];

  if (selectedStudent) {
    return (
      <div className={styles.container}>
        <StudentDetail
          studentId={selectedStudent}
          onBack={() => setSelectedStudent(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Öğretmen Paneli</h1>
        <p className={styles.subtitle}>Öğrenci ilerlemelerini ve quiz sonuçlarını takip edin</p>
      </div>

      {/* Sekmeler */}
      <div className={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div className={styles.content}>
        {activeTab === 'summary' && <SummaryTab summary={summary} />}
        {activeTab === 'students' && (
          <StudentsTab students={students} onSelectStudent={setSelectedStudent} />
        )}
        {activeTab === 'quiz_stats' && <QuizStatsTab topicStats={topicStats} />}
        {activeTab === 'live_exams' && <LiveExamsTab currentUser={currentUser} />}
        {activeTab === 'assignments' && <AssignmentsTab currentUser={currentUser} />}
      </div>
    </div>
  );
}
