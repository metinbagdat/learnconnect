import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Search, AlertCircle } from 'lucide-react';
import styles from './CurriculumManager.module.css';

export default function CurriculumManager() {
  const [subjects, setSubjects] = useState([]);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);
  const [newUnitSubjectId, setNewUnitSubjectId] = useState(null);
  const [newTopicUnitId, setNewTopicUnitId] = useState(null);

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/subjects');
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const subjectsWithChildren = await Promise.all(
          data.map(async (subject) => {
            const unitsRes = await fetch(`/api/admin/units?subjectId=${subject.id}`);
            const units = await unitsRes.json();
            const unitsWithTopics = await Promise.all(
              units.map(async (unit) => {
                const topicsRes = await fetch(`/api/admin/topics?unitId=${unit.id}`);
                const topics = await topicsRes.json();
                return { ...unit, topics: Array.isArray(topics) ? topics : [] };
              })
            );
            return { ...subject, units: unitsWithTopics };
          })
        );
        setSubjects(subjectsWithChildren);
      }
    } catch (err) {
      setError(`Müfredat yüklenirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'tyt') return matchesSearch && subject.exams?.includes('tyt');
    if (filter === 'ayt') return matchesSearch && subject.exams?.includes('ayt');
    return matchesSearch;
  });

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Dersi adı gerekli');
      return;
    }
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          exams: formData.exams || [],
          gradeLevel: formData.gradeLevel ? parseInt(formData.gradeLevel) : null
        })
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      setShowNewSubjectForm(false);
      setFormData({});
      await loadCurriculum();
      setError(null);
    } catch (err) {
      setError(`Dersi eklerken hata: ${err.message}`);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!confirm(`"${name}" derşını silmek istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      await loadCurriculum();
    } catch (err) {
      setError(`Dersi silerken hata: ${err.message}`);
    }
  };

  const handleAddUnit = async (subjectId) => {
    if (!formData.name?.trim()) {
      setError('Ünite adı gerekli');
      return;
    }
    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          name: formData.name,
          description: formData.description
        })
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      setNewUnitSubjectId(null);
      setFormData({});
      await loadCurriculum();
    } catch (err) {
      setError(`Ünite eklerken hata: ${err.message}`);
    }
  };

  const handleDeleteUnit = async (id, name) => {
    if (!confirm(`"${name}" ünitesini silmek istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/units/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      await loadCurriculum();
    } catch (err) {
      setError(`Ünite silerken hata: ${err.message}`);
    }
  };

  const handleAddTopic = async (unitId) => {
    if (!formData.name?.trim()) {
      setError('Konu adı gerekli');
      return;
    }
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          name: formData.name,
          description: formData.description,
          difficulty: formData.difficulty ? parseInt(formData.difficulty) : 3,
          estimated_minutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : 45,
          is_tyt: formData.isTyt || false,
          is_ayt: formData.isAyt || false
        })
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      setNewTopicUnitId(null);
      setFormData({});
      await loadCurriculum();
    } catch (err) {
      setError(`Konu eklerken hata: ${err.message}`);
    }
  };

  const handleDeleteTopic = async (id, name) => {
    if (!confirm(`"${name}" konusunu silmek istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/topics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      await loadCurriculum();
    } catch (err) {
      setError(`Konu silerken hata: ${err.message}`);
    }
  };

  const toggleSubject = (id) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleUnit = (id) => {
    setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading && subjects.length === 0) {
    return <div className={styles.loading}>Müfredat yükleniyor...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📚 Müfredat Yönetimi</h1>
        <p>Dersler, Üniteler, Konuları Düzenle</p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Dersi, ünite, konu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Tümü
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'tyt' ? styles.active : ''}`}
            onClick={() => setFilter('tyt')}
          >
            TYT
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'ayt' ? styles.active : ''}`}
            onClick={() => setFilter('ayt')}
          >
            AYT
          </button>
        </div>

        <button
          className={styles.addBtn}
          onClick={() => setShowNewSubjectForm(!showNewSubjectForm)}
        >
          <Plus size={18} /> Dersi Ekle
        </button>
      </div>

      {showNewSubjectForm && (
        <div className={styles.formPanel}>
          <h3>Yeni Dersi Ekle</h3>
          <form onSubmit={handleAddSubject}>
            <input
              type="text"
              placeholder="Dersi Adı"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Açıklama"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className={styles.formRow}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.exams?.includes('tyt') || false}
                  onChange={(e) => {
                    const exams = formData.exams || [];
                    setFormData({
                      ...formData,
                      exams: e.target.checked
                        ? [...exams, 'tyt']
                        : exams.filter(x => x !== 'tyt')
                    });
                  }}
                />
                TYT
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.exams?.includes('ayt') || false}
                  onChange={(e) => {
                    const exams = formData.exams || [];
                    setFormData({
                      ...formData,
                      exams: e.target.checked
                        ? [...exams, 'ayt']
                        : exams.filter(x => x !== 'ayt')
                    });
                  }}
                />
                AYT
              </label>
            </div>
            <div className={styles.formActions}>
              <button type="submit">Ekle</button>
              <button type="button" onClick={() => { setShowNewSubjectForm(false); setFormData({}); }}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tree}>
        {filteredSubjects.length === 0 ? (
          <p className={styles.empty}>Müfredat bulunamadı</p>
        ) : (
          filteredSubjects.map((subject) => (
            <div key={subject.id} className={styles.subjectNode}>
              <div className={styles.nodeRow}>
                <button className={styles.expandBtn} onClick={() => toggleSubject(subject.id)}>
                  {expandedSubjects[subject.id] ? <ChevronUp /> : <ChevronDown />}
                </button>
                <div className={styles.nodeContent}>
                  <span className={styles.name}>{subject.name}</span>
                  <span className={styles.stats}>
                    {subject.units?.length || 0} ünite • {subject.units?.reduce((sum, u) => sum + (u.topics?.length || 0), 0) || 0} konu
                  </span>
                </div>
                <span className={styles.exams}>
                  {subject.exams?.map(e => (
                    <span key={e} className={`${styles.exam} ${styles[e]}`}>{e.toUpperCase()}</span>
                  ))}
                </span>
                <div className={styles.actions}>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteSubject(subject.id, subject.name)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedSubjects[subject.id] && (
                <div className={styles.children}>
                  {newUnitSubjectId === subject.id && (
                    <div className={styles.newItemForm}>
                      <input
                        type="text"
                        placeholder="Yeni ünite adı..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                      />
                      <button onClick={() => handleAddUnit(subject.id)}>Ekle</button>
                      <button onClick={() => { setNewUnitSubjectId(null); setFormData({}); }}>İptal</button>
                    </div>
                  )}

                  {subject.units?.map((unit) => (
                    <div key={unit.id} className={styles.unitNode}>
                      <div className={styles.nodeRow}>
                        <button className={styles.expandBtn} onClick={() => toggleUnit(unit.id)}>
                          {expandedUnits[unit.id] ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        <div className={styles.nodeContent}>
                          <span className={styles.name}>{unit.name}</span>
                          <span className={styles.stats}>{unit.topics?.length || 0} konu</span>
                        </div>
                        <div className={styles.actions}>
                          <button className={styles.deleteBtn} onClick={() => handleDeleteUnit(unit.id, unit.name)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {expandedUnits[unit.id] && (
                        <div className={styles.children}>
                          {newTopicUnitId === unit.id && (
                            <div className={styles.newItemForm}>
                              <input
                                type="text"
                                placeholder="Yeni konu adı..."
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                autoFocus
                              />
                              <select
                                value={formData.difficulty || 3}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                              >
                                <option value="1">Zorluk: Çok Kolay</option>
                                <option value="2">Zorluk: Kolay</option>
                                <option value="3">Zorluk: Orta</option>
                                <option value="4">Zorluk: Zor</option>
                                <option value="5">Zorluk: Çok Zor</option>
                              </select>
                              <button onClick={() => handleAddTopic(unit.id)}>Ekle</button>
                              <button onClick={() => { setNewTopicUnitId(null); setFormData({}); }}>İptal</button>
                            </div>
                          )}

                          {unit.topics?.map((topic) => (
                            <div key={topic.id} className={styles.topicNode}>
                              <div className={styles.nodeRow}>
                                <span className={styles.indent} />
                                <div className={styles.nodeContent}>
                                  <span className={styles.name}>{topic.name}</span>
                                  <span className={`${styles.difficulty} ${styles[`diff${topic.difficulty}`]}`}>
                                    Zorluk: {topic.difficulty}/5
                                  </span>
                                  {topic.estimated_minutes && (
                                    <span className={styles.stats}>⏱️ {topic.estimated_minutes} dk</span>
                                  )}
                                </div>
                                <span className={styles.exams}>
                                  {topic.is_tyt && <span className={`${styles.exam} ${styles.tyt}`}>TYT</span>}
                                  {topic.is_ayt && <span className={`${styles.exam} ${styles.ayt}`}>AYT</span>}
                                </span>
                                <div className={styles.actions}>
                                  <button className={styles.deleteBtn} onClick={() => handleDeleteTopic(topic.id, topic.name)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {newTopicUnitId !== unit.id && (
                            <button className={styles.addChildBtn} onClick={() => { setNewTopicUnitId(unit.id); setFormData({}); }}>
                              + Konu Ekle
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {newUnitSubjectId !== subject.id && (
                    <button className={styles.addChildBtn} onClick={() => { setNewUnitSubjectId(subject.id); setFormData({}); }}>
                      + Ünite Ekle
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span>Toplam Dersler:</span>
          <strong>{subjects.length}</strong>
        </div>
        <div className={styles.statItem}>
          <span>Toplam Üniteler:</span>
          <strong>{subjects.reduce((sum, s) => sum + (s.units?.length || 0), 0)}</strong>
        </div>
        <div className={styles.statItem}>
          <span>Toplam Konular:</span>
          <strong>{subjects.reduce((sum, s) => sum + (s.units?.reduce((u, unit) => u + (unit.topics?.length || 0), 0) || 0), 0)}</strong>
        </div>
        <div className={styles.statItem}>
          <span>Tahmini Çalışma:</span>
          <strong>
            {Math.round(
              subjects.reduce((sum, s) => 
                sum + (s.units?.reduce((u, unit) => 
                  u + (unit.topics?.reduce((t, topic) => t + (topic.estimated_minutes || 0), 0) || 0), 0
                ) || 0), 0
              ) / 60
            )} saat
          </strong>
        </div>
      </div>
    </div>
  );
}
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
