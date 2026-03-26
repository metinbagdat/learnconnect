import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Save, X, Search, ChevronDown, ChevronRight,
  BookOpen, HelpCircle, CheckCircle, AlertCircle, Upload
} from 'lucide-react';
import styles from './QuestionManager.module.css';

const DIFFICULTY_LABELS = ['', 'Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];
const EMPTY_QUESTION = {
  text: '',
  type: 'multiple_choice',
  options: [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  correct_answer: 'A',
  explanation: '',
  difficulty: 3,
  source: '',
};

export default function QuestionManager() {
  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);  // { id, name }
  const [questions, setQuestions] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_QUESTION);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Bulk import state
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Ders/Ünite/Konu ağacını yükle
  useEffect(() => {
    loadSubjectsTree();
  }, []);

  async function loadSubjectsTree() {
    setLoadingSubjects(true);
    try {
      const res = await fetch('/api/admin/subjects');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Dersler alınamadı');

      const withUnits = await Promise.all(
        data.map(async subject => {
          const uRes = await fetch(`/api/admin/units?subject_id=${subject.id}`);
          const units = await uRes.json();
          const withTopics = await Promise.all(
            (Array.isArray(units) ? units : []).map(async unit => {
              const tRes = await fetch(`/api/admin/topics?unit_id=${unit.id}`);
              const topics = await tRes.json();
              return { ...unit, topics: Array.isArray(topics) ? topics : [] };
            })
          );
          return { ...subject, units: withTopics };
        })
      );
      setSubjects(withUnits);
    } catch (err) {
      setError('Müfredat ağacı yüklenemedi: ' + err.message);
    } finally {
      setLoadingSubjects(false);
    }
  }

  // Seçili konunun sorularını yükle
  async function loadQuestions(topicId) {
    setLoadingQuestions(true);
    setQuestions([]);
    try {
      const res = await fetch(`/api/quiz/questions?topic_id=${topicId}&limit=100&shuffle=false`);
      const data = await res.json();
      if (data.success) setQuestions(data.questions);
    } catch (err) {
      setError('Sorular yüklenemedi: ' + err.message);
    } finally {
      setLoadingQuestions(false);
    }
  }

  function selectTopic(topic) {
    setSelectedTopic({ id: topic.id, name: topic.name });
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_QUESTION);
    setImportResult(null);
    loadQuestions(topic.id);
  }

  // Form helpers
  function openNewForm() {
    setEditingId(null);
    setForm({ ...EMPTY_QUESTION, options: EMPTY_QUESTION.options.map(o => ({ ...o })) });
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(q) {
    setEditingId(q.id);
    setForm({
      text: q.text,
      type: q.type,
      options: q.options || EMPTY_QUESTION.options.map(o => ({ ...o })),
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 3,
      source: q.source || '',
    });
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_QUESTION);
    setFormError(null);
  }

  function updateOption(idx, value) {
    setForm(prev => {
      const opts = prev.options.map((o, i) => (i === idx ? { ...o, text: value } : o));
      return { ...prev, options: opts };
    });
  }

  function validateForm() {
    if (!form.text.trim()) return 'Soru metni gerekli.';
    if (form.type === 'multiple_choice') {
      if (form.options.some(o => !o.text.trim())) return 'Tüm şıklar doldurulmalı.';
      if (!['A', 'B', 'C', 'D'].includes(form.correct_answer)) return 'Doğru cevap seçin.';
    }
    if (form.type === 'true_false' && !['true', 'false'].includes(form.correct_answer)) {
      return 'Doğru/Yanlış cevabı seçin.';
    }
    return null;
  }

  async function saveQuestion() {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        topic_id: selectedTopic.id,
        text: form.text.trim(),
        type: form.type,
        options: form.type === 'multiple_choice' ? form.options : null,
        correct_answer: form.correct_answer,
        explanation: form.explanation.trim() || null,
        difficulty: form.difficulty,
        source: form.source.trim() || null,
      };

      let res;
      if (editingId) {
        // Güncelle (PATCH)
        res = await fetch(`/api/quiz/questions?id=${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Yeni ekle (POST)
        res = await fetch('/api/quiz/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      cancelForm();
      await loadQuestions(selectedTopic.id);
    } catch (err) {
      setFormError('Kayıt hatası: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(id) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/quiz/questions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      setError('Silme hatası: ' + err.message);
    }
  }

  // Toplu JSON import
  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) throw new Error('JSON bir dizi olmalı');

      const results = { success: 0, failed: 0, errors: [] };
      for (const q of parsed) {
        try {
          const res = await fetch('/api/quiz/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic_id: selectedTopic.id, ...q }),
          });
          const data = await res.json();
          if (data.success) results.success++;
          else { results.failed++; results.errors.push(data.error); }
        } catch (e) {
          results.failed++;
          results.errors.push(e.message);
        }
      }
      setImportResult(results);
      setImportJson('');
      await loadQuestions(selectedTopic.id);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  }

  // Filtreli sorular
  const filtered = questions.filter(q =>
    q.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.layout}>
      {/* ─── Sol Panel: Müfredat Ağacı ─────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <BookOpen size={18} />
          <h3>Müfredat</h3>
        </div>

        {loadingSubjects ? (
          <div className={styles.sideLoading}>Yükleniyor...</div>
        ) : (
          <nav className={styles.tree}>
            {subjects.map(subject => (
              <div key={subject.id}>
                {/* Ders */}
                <button
                  className={`${styles.treeItem} ${styles.subjectItem} ${expandedSubject === subject.id ? styles.expanded : ''}`}
                  onClick={() => setExpandedSubject(s => s === subject.id ? null : subject.id)}
                >
                  {expandedSubject === subject.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>{subject.name}</span>
                  <span className={styles.badge}>{subject.units?.reduce((s, u) => s + u.topics?.length, 0)} konu</span>
                </button>

                {/* Üniteler */}
                {expandedSubject === subject.id && subject.units.map(unit => (
                  <div key={unit.id}>
                    <button
                      className={`${styles.treeItem} ${styles.unitItem} ${expandedUnit === unit.id ? styles.expanded : ''}`}
                      onClick={() => setExpandedUnit(u => u === unit.id ? null : unit.id)}
                    >
                      {expandedUnit === unit.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      <span>{unit.name}</span>
                      <span className={styles.badge}>{unit.topics?.length}</span>
                    </button>

                    {/* Konular */}
                    {expandedUnit === unit.id && unit.topics.map(topic => (
                      <button
                        key={topic.id}
                        className={`${styles.treeItem} ${styles.topicItem} ${selectedTopic?.id === topic.id ? styles.selected : ''}`}
                        onClick={() => selectTopic(topic)}
                      >
                        <HelpCircle size={12} />
                        <span>{topic.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        )}
      </aside>

      {/* ─── Sağ Panel: Soru Yönetimi ──────────────── */}
      <main className={styles.main}>
        {!selectedTopic ? (
          <div className={styles.emptyState}>
            <HelpCircle size={48} className={styles.emptyIcon} />
            <h3>Bir konu seçin</h3>
            <p>Sol panelden soru eklemek istediğiniz konuyu seçin.</p>
          </div>
        ) : (
          <>
            {/* Main Header */}
            <div className={styles.mainHeader}>
              <div>
                <h2>{selectedTopic.name}</h2>
                <span className={styles.questionCount}>{questions.length} soru</span>
              </div>
              <div className={styles.mainActions}>
                <button className={styles.importBtn} onClick={() => setShowImport(s => !s)}>
                  <Upload size={16} /> JSON Import
                </button>
                <button className={styles.addBtn} onClick={openNewForm}>
                  <Plus size={16} /> Soru Ekle
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} /> {error}
                <button onClick={() => setError(null)}><X size={14} /></button>
              </div>
            )}

            {/* ── JSON Import Paneli ── */}
            {showImport && (
              <div className={styles.importPanel}>
                <div className={styles.importHeader}>
                  <h4>Toplu Soru Import (JSON)</h4>
                  <button onClick={() => { setShowImport(false); setImportResult(null); }}><X size={16} /></button>
                </div>
                <p className={styles.importHint}>
                  Format: <code>{'[{"text":"Soru?","type":"multiple_choice","options":[{"id":"A","text":"..."},...],"correct_answer":"A","explanation":"...","difficulty":3}]'}</code>
                </p>
                <textarea
                  className={styles.importTextarea}
                  placeholder="JSON verisini buraya yapıştırın..."
                  value={importJson}
                  onChange={e => setImportJson(e.target.value)}
                  rows={6}
                />
                {importResult && (
                  <div className={`${styles.importResult} ${importResult.error ? styles.importError : styles.importSuccess}`}>
                    {importResult.error
                      ? `❌ ${importResult.error}`
                      : `✅ ${importResult.success} başarılı, ${importResult.failed} başarısız`}
                    {importResult.errors?.length > 0 && (
                      <ul>{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    )}
                  </div>
                )}
                <div className={styles.importActions}>
                  <button
                    className={styles.addBtn}
                    onClick={handleImport}
                    disabled={importing || !importJson.trim()}
                  >
                    {importing ? 'Yükleniyor...' : 'Import Et'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Soru Ekleme/Düzenleme Formu ── */}
            {showForm && (
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h4>{editingId ? 'Soruyu Düzenle' : 'Yeni Soru'}</h4>
                  <button onClick={cancelForm}><X size={18} /></button>
                </div>

                {formError && (
                  <div className={styles.formError}><AlertCircle size={14} /> {formError}</div>
                )}

                {/* Soru tipi */}
                <div className={styles.fieldGroup}>
                  <label>Soru Tipi</label>
                  <div className={styles.typeToggle}>
                    {['multiple_choice', 'true_false'].map(t => (
                      <button
                        key={t}
                        className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ''}`}
                        onClick={() => setForm(p => ({
                          ...p, type: t,
                          correct_answer: t === 'true_false' ? 'true' : 'A'
                        }))}
                      >
                        {t === 'multiple_choice' ? 'Çoktan Seçmeli' : 'Doğru / Yanlış'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soru metni */}
                <div className={styles.fieldGroup}>
                  <label>Soru Metni *</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder="Soruyu buraya yazın..."
                    value={form.text}
                    onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  />
                </div>

                {/* Şıklar (çoktan seçmeli) */}
                {form.type === 'multiple_choice' && (
                  <div className={styles.fieldGroup}>
                    <label>Şıklar *</label>
                    <div className={styles.optionsGrid}>
                      {form.options.map((opt, idx) => (
                        <div key={opt.id} className={styles.optionRow}>
                          <span className={`${styles.optKey} ${form.correct_answer === opt.id ? styles.optKeyCorrect : ''}`}>
                            {opt.id}
                          </span>
                          <input
                            className={styles.input}
                            placeholder={`${opt.id} şıkkı`}
                            value={opt.text}
                            onChange={e => updateOption(idx, e.target.value)}
                          />
                          <button
                            className={`${styles.correctMarkBtn} ${form.correct_answer === opt.id ? styles.correctMarkActive : ''}`}
                            title="Doğru cevap olarak işaretle"
                            onClick={() => setForm(p => ({ ...p, correct_answer: opt.id }))}
                          >
                            {form.correct_answer === opt.id ? <CheckCircle size={18} /> : <div className={styles.emptyCircle} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doğru/Yanlış */}
                {form.type === 'true_false' && (
                  <div className={styles.fieldGroup}>
                    <label>Doğru Cevap *</label>
                    <div className={styles.typeToggle}>
                      {[{ val: 'true', label: '✓ Doğru' }, { val: 'false', label: '✗ Yanlış' }].map(o => (
                        <button
                          key={o.val}
                          className={`${styles.typeBtn} ${form.correct_answer === o.val ? styles.typeBtnActive : ''}`}
                          onClick={() => setForm(p => ({ ...p, correct_answer: o.val }))}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Açıklama */}
                <div className={styles.fieldGroup}>
                  <label>Cevap Açıklaması</label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    placeholder="Öğrenciye gösterilecek açıklama (opsiyonel)"
                    value={form.explanation}
                    onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                  />
                </div>

                {/* Zorluk + Kaynak */}
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label>Zorluk (1-5)</label>
                    <div className={styles.diffRow}>
                      {[1, 2, 3, 4, 5].map(d => (
                        <button
                          key={d}
                          className={`${styles.diffBtn} ${form.difficulty === d ? styles.diffBtnActive : ''}`}
                          onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                          title={DIFFICULTY_LABELS[d]}
                        >
                          {d}
                        </button>
                      ))}
                      <span className={styles.diffLabel}>{DIFFICULTY_LABELS[form.difficulty]}</span>
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Kaynak (opsiyonel)</label>
                    <input
                      className={styles.input}
                      placeholder="tyt-2024, ayt-2023..."
                      value={form.source}
                      onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Kaydet butonu */}
                <div className={styles.formFooter}>
                  <button className={styles.cancelBtn} onClick={cancelForm}>İptal</button>
                  <button className={styles.saveBtn} onClick={saveQuestion} disabled={saving}>
                    {saving ? 'Kaydediliyor...' : <><Save size={16} /> {editingId ? 'Güncelle' : 'Kaydet'}</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Arama ── */}
            <div className={styles.searchRow}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  placeholder="Sorularda ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <span className={styles.filterCount}>{filtered.length} / {questions.length}</span>
            </div>

            {/* ── Sorular Listesi ── */}
            {loadingQuestions ? (
              <div className={styles.listLoading}>Sorular yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyQuestions}>
                {questions.length === 0
                  ? 'Bu konu için henüz soru yok. "Soru Ekle" ile başla.'
                  : 'Arama sonucu bulunamadı.'}
              </div>
            ) : (
              <div className={styles.questionList}>
                {filtered.map((q, idx) => (
                  <div key={q.id} className={styles.questionCard}>
                    <div className={styles.qCardHeader}>
                      <span className={styles.qNumber}>{idx + 1}</span>
                      <span className={`${styles.qType} ${q.type === 'true_false' ? styles.tfType : styles.mcType}`}>
                        {q.type === 'true_false' ? 'D/Y' : 'Ç.S.'}
                      </span>
                      <span className={`${styles.qDiff} ${styles[`diff${q.difficulty}`]}`}>
                        {'★'.repeat(q.difficulty)}
                      </span>
                      {q.source && <span className={styles.qSource}>{q.source}</span>}
                      <div className={styles.qActions}>
                        <button className={styles.editIcon} onClick={() => openEditForm(q)} title="Düzenle">
                          <Edit2 size={15} />
                        </button>
                        <button className={styles.deleteIcon} onClick={() => deleteQuestion(q.id)} title="Sil">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className={styles.qText}>{q.text}</p>

                    {q.type === 'multiple_choice' && q.options && (
                      <div className={styles.qOptions}>
                        {q.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`${styles.qOpt} ${opt.id === q.correct_answer ? styles.qOptCorrect : ''}`}
                          >
                            <span className={styles.qOptKey}>{opt.id}</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className={styles.qOptions}>
                        <div className={`${styles.qOpt} ${q.correct_answer === 'true' ? styles.qOptCorrect : ''}`}>
                          <span className={styles.qOptKey}>✓</span> Doğru
                        </div>
                        <div className={`${styles.qOpt} ${q.correct_answer === 'false' ? styles.qOptCorrect : ''}`}>
                          <span className={styles.qOptKey}>✗</span> Yanlış
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <p className={styles.qExplanation}>💡 {q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
