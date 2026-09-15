// src/components/student/CurriculumSelection.jsx
/**
 * Öğrenci Müfredat Onboarding
 * İlk giriş sırasında öğrencinin çalışacağı dersleri seçer
 */
import React, { useState, useEffect } from 'react';
import styles from './CurriculumSelection.module.css';

export default function CurriculumSelection({ onComplete, userId }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [step, setStep] = useState(1); // 1: dersleri seç, 2: İmtihanları seç, 3: onay
  const [selectedExams, setSelectedExams] = useState(['tyt', 'ayt']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/subjects');
      const data = await res.json();
      
      // Dersleri grupla
      const grouped = {};
      data.forEach(subject => {
        const examType = subject.exam_type?.[0] || 'other';
        if (!grouped[examType]) grouped[examType] = [];
        grouped[examType].push(subject);
      });
      
      setSubjects(grouped);
    } catch (error) {
      console.error('Dersler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllSubjects = () => {
    const allIds = Object.values(subjects)
      .flat()
      .map(s => s.id);
    setSelectedSubjects(allIds);
  };

  const handleSelectSubject = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleSelectExam = (exam) => {
    setSelectedExams(prev => {
      if (prev.includes(exam)) {
        return prev.filter(e => e !== exam);
      } else {
        return [...prev, exam];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      alert('Lütfen en az bir ders seçin');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/user/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: selectedSubjects,
          customMode: true,
          examTypes: selectedExams
        })
      });

      if (!res.ok) throw new Error('Curriculum selection failed');
      
      const data = await res.json();
      console.log('Curriculum saved:', data);
      
      // Callback fonksiyonunu çağır
      if (onComplete) {
        onComplete({ 
          subjects: selectedSubjects, 
          exams: selectedExams,
          topicsApproved: data.topicsApproved 
        });
      }
    } catch (error) {
      console.error('Müfredat kaydedilirken hata:', error);
      alert('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner} />
        <p>Müfredat yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1>📚 Hangi Dersleri Çalışmak İstiyorsun?</h1>
          <p>Adım {step} / 3 - Müfredat Seçimi</p>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progress} 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step 1: Exam Type Selection */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2>Hangi İmtihanlar için çalışıyorsun?</h2>
            <div className={styles.examGrid}>
              {[
                { id: 'tyt', name: 'TYT', desc: 'Temel Yeterlilik Testi (9-10. sınıf)' },
                { id: 'ayt', name: 'AYT', desc: 'Alan Yeterlilik Testi (11-12. sınıf)' }
              ].map(exam => (
                <div 
                  key={exam.id}
                  className={`${styles.examButton} ${selectedExams.includes(exam.id) ? styles.selected : ''}`}
                  onClick={() => handleSelectExam(exam.id)}
                >
                  <div className={styles.examIcon}>📖</div>
                  <div className={styles.examName}>{exam.name}</div>
                  <div className={styles.examDesc}>{exam.desc}</div>
                  <input 
                    type="checkbox" 
                    checked={selectedExams.includes(exam.id)}
                    onChange={() => {}}
                    className={styles.checkbox}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Subject Selection */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.subjectsHeader}>
              <h2>Çalışacağın Dersleri Seç</h2>
              <button 
                className={styles.btnOutline}
                onClick={handleSelectAllSubjects}
              >
                Tümünü Seç
              </button>
            </div>

            <div className={styles.subjectsContainer}>
              {Object.entries(subjects).map(([examType, subjs]) => (
                <div key={examType}>
                  {subjs.length > 0 && <h3 className={styles.subjectCategory}>{examType.toUpperCase()}</h3>}
                  <div className={styles.subjectGrid}>
                    {subjs.map(subject => (
                      <label 
                        key={subject.id} 
                        className={`${styles.subjectCard} ${selectedSubjects.includes(subject.id) ? styles.selected : ''}`}
                      >
                        <input 
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => handleSelectSubject(subject.id)}
                          className={styles.checkbox}
                        />
                        <div className={styles.subjectName}>{subject.name}</div>
                        <div className={styles.subjectSlug}>{subject.slug}</div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedSubjects.length > 0 && (
              <div className={styles.selectionInfo}>
                ✓ {selectedSubjects.length} ders seçildi
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.confirmBox}>
              <h2>Özet</h2>
              <div className={styles.confirmDetails}>
                <div>
                  <strong>Seçili İmtihanlar:</strong>
                  <p>
                    {selectedExams.includes('tyt') && <span className={styles.badge}>TYT</span>}
                    {selectedExams.includes('ayt') && <span className={styles.badge}>AYT</span>}
                  </p>
                </div>
                <div>
                  <strong>Seçili Dersler:</strong>
                  <p>{selectedSubjects.length} ders</p>
                </div>
              </div>
              
              <div className={styles.warningBox}>
                <p>
                  ℹ️ Bu seçimler daha sonra profil ayarlarından değiştirilebilir. 
                  AI Coach bu derslere göre çalışma planı oluşturacak.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.buttonGroup}>
          {step > 1 && (
            <button 
              className={styles.btnSecondary}
              onClick={() => setStep(step - 1)}
              disabled={submitting}
            >
              ← Geri
            </button>
          )}
          
          {step < 3 ? (
            <button 
              className={styles.btnPrimary}
              onClick={() => setStep(step + 1)}
              disabled={submitting}
            >
              İleri →
            </button>
          ) : (
            <button 
              className={styles.btnSuccess}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : '✓ Müfredatımı Onayla'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
