import { useState } from 'react';
import { generateCurriculum, generateCurriculumWithTemplate, type GeneratedSubject } from '@/services/aiCurriculumService';
import {
  generateAYTCurriculumApi,
  generateLearningTreeApi,
  generateStudyPlanApi,
  type AYTSubject,
  type LearningTreeData,
  type StudyPlanData,
} from '@/services/aiAytService';
import { BilingualText } from '@/components/ui/bilingual-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/consolidated-language-context';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Brain, Sparkles, CheckCircle2, TreePine, Calendar } from 'lucide-react';

type ExamType = 'tyt' | 'ayt' | 'yks';

export default function AICurriculumGenerator() {
  const { language } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedSubject[] | null>(null);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamType>('tyt');
  const [saving, setSaving] = useState(false);

  // AYT AIReasoningEngine state
  const [aytLoading, setAytLoading] = useState(false);
  const [aytSaving, setAytSaving] = useState(false);
  const [aytResult, setAytResult] = useState<{ subjects: AYTSubject[] } | null>(null);
  const [aytError, setAytError] = useState('');
  const [ltTopic, setLtTopic] = useState('');
  const [ltSubject, setLtSubject] = useState('AYT Matematik');
  const [ltLoading, setLtLoading] = useState(false);
  const [ltSaving, setLtSaving] = useState(false);
  const [ltResult, setLtResult] = useState<LearningTreeData | null>(null);
  const [ltError, setLtError] = useState('');
  const [spTopic, setSpTopic] = useState('');
  const [spHours, setSpHours] = useState(8);
  const [spLevel, setSpLevel] = useState('orta');
  const [spDaily, setSpDaily] = useState(2);
  const [spLoading, setSpLoading] = useState(false);
  const [spSaving, setSpSaving] = useState(false);
  const [spResult, setSpResult] = useState<StudyPlanData | null>(null);
  const [spError, setSpError] = useState('');

  const predefinedPrompts = [
    {
      label: language === 'tr' ? 'TYT Matematik Full Müfredat' : 'TYT Mathematics Full Curriculum',
      value: language === 'tr' 
        ? 'TYT Matematik için tüm konuları ve alt konuları oluştur. Her konu için tahmini çalışma saati, zorluk seviyesi ve bağlantılı konuları belirt.'
        : 'Create all topics and subtopics for TYT Mathematics. Specify estimated study hours, difficulty level, and related topics for each topic.'
    },
    {
      label: language === 'tr' ? 'TYT Türkçe Konu Ağacı' : 'TYT Turkish Topic Tree',
      value: language === 'tr'
        ? 'TYT Türkçe dersi için detaylı konu ağacı oluştur. Paragraf, dil bilgisi, anlatım bozukluğu gibi ana başlıklar altında tüm alt konuları listele.'
        : 'Create a detailed topic tree for TYT Turkish. List all subtopics under main headings such as paragraph, grammar, and expression errors.'
    },
    {
      label: language === 'tr' ? 'AYT Fizik Müfredatı' : 'AYT Physics Curriculum',
      value: language === 'tr'
        ? 'AYT Fizik dersinin tüm konularını, konular arasındaki öncelik sırasını ve her konunun tahmini çalışma süresini içeren bir müfredat oluştur.'
        : 'Create a curriculum for AYT Physics that includes all topics, priority order between topics, and estimated study time for each topic.'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(language === 'tr' ? 'Lütfen bir prompt girin' : 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedData(null);
    
    try {
      const result = await generateCurriculum(prompt, selectedExam, false);
      
      if (result.success && result.data) {
        setGeneratedData(result.data);
      } else {
        setError(result.error || (language === 'tr' ? 'AI yanıtı oluşturulamadı' : 'Failed to generate AI response'));
      }
    } catch (err) {
      setError(language === 'tr' ? 'AI servisine bağlanılamadı' : 'Could not connect to AI service');
      console.error('AI Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFullTYT = async () => {
    setLoading(true);
    setError('');
    setGeneratedData(null);
    setSelectedExam('tyt');
    try {
      const result = await generateCurriculumWithTemplate('tyt');
      if (result.success && result.data) {
        setGeneratedData(result.data);
      } else {
        setError(result.error || (language === 'tr' ? 'AI yanıtı oluşturulamadı' : 'Failed to generate AI response'));
      }
    } catch (err) {
      setError(language === 'tr' ? 'AI servisine bağlanılamadı' : 'Could not connect to AI service');
      console.error('AI Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!generatedData || generatedData.length === 0) return;

    setSaving(true);
    try {
      for (const subject of generatedData) {
        // Add subject
        const subjectRef = await addDoc(
          collection(db, `curriculum/${selectedExam}/subjects`),
          {
            name: subject.title,
            title: subject.title,
            description: subject.description || '',
            icon: subject.icon || '📘',
            color: subject.color || 'blue',
            order: subject.order,
            estimatedHours: subject.estimatedHours,
            totalTopics: subject.topics.length,
            examType: selectedExam,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );

        // Add topics
        for (const topic of subject.topics) {
          const topicRef = await addDoc(
            collection(db, `curriculum/${selectedExam}/subjects/${subjectRef.id}/topics`),
            {
              name: topic.title,
              title: topic.title,
              order: topic.order,
              estimatedHours: topic.estimatedHours || 0,
              difficulty: topic.difficulty || 'medium',
              subjectId: subjectRef.id,
              createdAt: new Date().toISOString()
            }
          );

          // Add subtopics
          for (let i = 0; i < topic.subtopics.length; i++) {
            const subtopicName = topic.subtopics[i];
            await addDoc(
              collection(db, `curriculum/${selectedExam}/subjects/${subjectRef.id}/topics/${topicRef.id}/subtopics`),
              {
                name: subtopicName,
                title: subtopicName,
                order: i + 1,
                topicId: topicRef.id,
                subjectId: subjectRef.id,
                createdAt: new Date().toISOString()
              }
            );
          }
        }
      }

      alert(language === 'tr' 
        ? 'Müfredat başarıyla Firestore\'a kaydedildi!' 
        : 'Curriculum successfully saved to Firestore!'
      );
      setGeneratedData(null);
      setPrompt('');
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert(language === 'tr' 
        ? 'Müfredat kaydedilirken hata oluştu' 
        : 'Error saving curriculum'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAytCurriculum = async () => {
    setAytLoading(true);
    setAytError('');
    setAytResult(null);
    try {
      const res = await generateAYTCurriculumApi();
      if (res.success && res.data?.subjects?.length) {
        setAytResult({ subjects: res.data.subjects });
      } else {
        setAytError(res.error || (language === 'tr' ? 'AI yanıtı oluşturulamadı' : 'Failed to generate'));
      }
    } catch (e) {
      setAytError(language === 'tr' ? 'AI servisine bağlanılamadı' : 'Could not connect to AI service');
    } finally {
      setAytLoading(false);
    }
  };

  const saveAytCurriculum = async () => {
    if (!aytResult?.subjects?.length) return;
    setAytSaving(true);
    try {
      for (const subj of aytResult.subjects) {
        const subjectRef = await addDoc(collection(db, 'curriculum_ayt'), {
          title: subj.title,
          description: subj.description || '',
          createdAt: new Date().toISOString(),
        });
        for (let i = 0; i < subj.topics.length; i++) {
          const t = subj.topics[i];
          await addDoc(collection(db, `curriculum_ayt/${subjectRef.id}/topics`), {
            title: t.title,
            estimatedHours: t.estimatedHours ?? 8,
            difficulty: t.difficulty || 'medium',
            order: i + 1,
            subjectId: subjectRef.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
      alert(language === 'tr' ? 'AYT müfredatı Firestore\'a kaydedildi!' : 'AYT curriculum saved to Firestore!');
      setAytResult(null);
    } catch (e) {
      console.error(e);
      alert(language === 'tr' ? 'Kaydetme hatası' : 'Error saving');
    } finally {
      setAytSaving(false);
    }
  };

  const handleLearningTree = async () => {
    if (!ltTopic.trim()) {
      setLtError(language === 'tr' ? 'Konu girin' : 'Enter topic');
      return;
    }
    setLtLoading(true);
    setLtError('');
    setLtResult(null);
    try {
      const res = await generateLearningTreeApi(ltTopic.trim(), ltSubject || 'AYT Matematik');
      if (res.success && res.data) {
        setLtResult(res.data);
      } else {
        setLtError(res.error || (language === 'tr' ? 'AI yanıtı oluşturulamadı' : 'Failed to generate'));
      }
    } catch (e) {
      setLtError(language === 'tr' ? 'AI servisine bağlanılamadı' : 'Could not connect to AI service');
    } finally {
      setLtLoading(false);
    }
  };

  const saveLearningTree = async () => {
    if (!ltResult || !ltTopic.trim() || !ltSubject.trim()) return;
    setLtSaving(true);
    try {
      const subjectRef = await addDoc(collection(db, 'curriculum_ayt'), {
        title: ltSubject,
        description: '',
        createdAt: new Date().toISOString(),
      });
      const topicRef = await addDoc(collection(db, `curriculum_ayt/${subjectRef.id}/topics`), {
        title: ltTopic,
        estimatedHours: 8,
        difficulty: 'medium',
        order: 1,
        subjectId: subjectRef.id,
        createdAt: new Date().toISOString(),
      });
      const learningTreeRef = collection(db, `curriculum_ayt/${subjectRef.id}/topics/${topicRef.id}/learningTree`);
      await addDoc(learningTreeRef, {
        ...ltResult,
        createdAt: new Date().toISOString(),
      });
      alert(language === 'tr' ? 'Konu ağacı Firestore\'a kaydedildi!' : 'Learning tree saved to Firestore!');
      setLtResult(null);
      setLtTopic('');
    } catch (e) {
      console.error(e);
      alert(language === 'tr' ? 'Kaydetme hatası' : 'Error saving');
    } finally {
      setLtSaving(false);
    }
  };

  const handleStudyPlan = async () => {
    if (!spTopic.trim()) {
      setSpError(language === 'tr' ? 'Konu girin' : 'Enter topic');
      return;
    }
    setSpLoading(true);
    setSpError('');
    setSpResult(null);
    try {
      const res = await generateStudyPlanApi(spTopic.trim(), spHours, spLevel, spDaily);
      if (res.success && res.data) {
        setSpResult(res.data);
      } else {
        setSpError(res.error || (language === 'tr' ? 'AI yanıtı oluşturulamadı' : 'Failed to generate'));
      }
    } catch (e) {
      setSpError(language === 'tr' ? 'AI servisine bağlanılamadı' : 'Could not connect to AI service');
    } finally {
      setSpLoading(false);
    }
  };

  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-ğüşıöç]/g, '').slice(0, 64);

  const saveStudyPlan = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert(language === 'tr' ? 'Çalışma planı kaydetmek için giriş yapın.' : 'Sign in to save study plan.');
      return;
    }
    if (!spResult || !spTopic.trim()) return;
    setSpSaving(true);
    try {
      const topicId = slug(spTopic) || 'plan';
      const planRef = doc(db, 'study_plans', uid, 'plans', topicId);
      await setDoc(planRef, {
        topic: spResult.topic,
        totalDays: spResult.totalDays,
        dailyPlan: spResult.dailyPlan,
        metadata: {
          studentLevel: spLevel,
          dailyHours: spDaily,
          estimatedHours: spHours,
          createdAt: new Date().toISOString(),
        },
      });
      alert(language === 'tr' ? 'Çalışma planı Firestore\'a kaydedildi!' : 'Study plan saved to Firestore!');
      setSpResult(null);
      setSpTopic('');
    } catch (e) {
      console.error(e);
      alert(language === 'tr' ? 'Kaydetme hatası' : 'Error saving');
    } finally {
      setSpSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <BilingualText text="AI ile Müfredat Oluştur – Generate Curriculum with AI" />
          </CardTitle>
          <CardDescription>
            <BilingualText 
              text="AI kullanarak otomatik müfredat oluşturun – Automatically generate curriculum using AI"
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exam Type Selector */}
          <div className="flex gap-2">
            <Button
              variant={selectedExam === 'tyt' ? 'default' : 'outline'}
              onClick={() => setSelectedExam('tyt')}
            >
              TYT
            </Button>
            <Button
              variant={selectedExam === 'ayt' ? 'default' : 'outline'}
              onClick={() => setSelectedExam('ayt')}
            >
              AYT
            </Button>
            <Button
              variant={selectedExam === 'yks' ? 'default' : 'outline'}
              onClick={() => setSelectedExam('yks')}
            >
              YKS
            </Button>
          </div>

          {/* Tam TYT Müfredatı Oluştur (4 Ders) - Plan Phase 2.3 */}
          <Button
            onClick={handleGenerateFullTYT}
            disabled={loading}
            variant="default"
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <BilingualText text="Oluşturuluyor... – Generating..." />
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <BilingualText text="⚡ Tam TYT Müfredatı Oluştur (4 Ders) – Generate Full TYT Curriculum (4 Subjects)" />
              </>
            )}
          </Button>

          {/* Predefined Prompts */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <BilingualText text="Hızlı Şablonlar – Quick Templates" />
            </label>
            <div className="flex flex-wrap gap-2">
              {predefinedPrompts.map((predefined, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(predefined.value)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {predefined.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <BilingualText text="Özel Prompt – Custom Prompt" />
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={language === 'tr' 
                ? "Örn: 'TYT Geometri konularını oluştur'"
                : "E.g.: 'Create TYT Geometry topics'"
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <BilingualText text="Oluşturuluyor... – Generating..." />
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                <BilingualText text="Müfredat Oluştur – Generate Curriculum" />
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Generated Preview */}
          {generatedData && generatedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <BilingualText text="Oluşturulan Müfredat – Generated Curriculum" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {generatedData.map((subject, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{subject.icon || '📘'}</span>
                        <h4 className="font-semibold">{subject.title}</h4>
                        <Badge variant="secondary">{subject.topics.length} topics</Badge>
                      </div>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground mb-2">{subject.description}</p>
                      )}
                      <div className="space-y-1">
                        {subject.topics.slice(0, 3).map((topic, topicIndex) => (
                          <div key={topicIndex} className="text-sm ml-4">
                            • {topic.title} ({topic.subtopics.length} subtopics)
                          </div>
                        ))}
                        {subject.topics.length > 3 && (
                          <div className="text-sm ml-4 text-muted-foreground">
                            ... ve {subject.topics.length - 3} konu daha
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={handleApply} 
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <BilingualText text="Kaydediliyor... – Saving..." />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <BilingualText text="Firestore'a Kaydet – Save to Firestore" />
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setGeneratedData(null);
                      setPrompt('');
                    }}
                  >
                    <BilingualText text="İptal – Cancel" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* AYT AIReasoningEngine – three-stage prompt package */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <BilingualText text="AYT AIReasoningEngine – AYT AI Araçları" />
          </CardTitle>
          <CardDescription>
            <BilingualText text="AYT müfredatı, konu ağacı ve çalışma planı üret – Generate AYT curriculum, learning tree, and study plans" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1) AYT Müfredat Üret */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <BilingualText text="AYT Müfredat Üret – Generate AYT Curriculum" />
            </h4>
            <Button
              onClick={handleAytCurriculum}
              disabled={aytLoading}
              variant="default"
              className="w-full sm:w-auto"
            >
              {aytLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  <BilingualText text="Oluşturuluyor... – Generating..." />
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  <BilingualText text="AYT Müfredat Üret" />
                </>
              )}
            </Button>
            {aytError && (
              <p className="text-sm text-red-600">{aytError}</p>
            )}
            {aytResult && (
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {aytResult.subjects.length} ders,{' '}
                  {aytResult.subjects.reduce((n, s) => n + s.topics.length, 0)} konu
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveAytCurriculum} disabled={aytSaving}>
                    {aytSaving ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    <BilingualText text="Firestore'a Kaydet" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAytResult(null)}>
                    <BilingualText text="İptal" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 2) Konu Ağacı Üret */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              <BilingualText text="Konu Ağacı Üret – Generate Learning Tree" />
            </h4>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={ltSubject}
                onChange={(e) => setLtSubject(e.target.value)}
                placeholder={language === 'tr' ? 'Ders (örn. AYT Matematik)' : 'Subject (e.g. AYT Math)'}
                className="px-3 py-2 border rounded-lg w-48"
              />
              <input
                type="text"
                value={ltTopic}
                onChange={(e) => setLtTopic(e.target.value)}
                placeholder={language === 'tr' ? 'Konu (örn. Limit ve Süreklilik)' : 'Topic (e.g. Limit and Continuity)'}
                className="px-3 py-2 border rounded-lg flex-1 min-w-[180px]"
              />
            </div>
            <Button
              onClick={handleLearningTree}
              disabled={ltLoading || !ltTopic.trim()}
              variant="outline"
              size="sm"
            >
              {ltLoading ? <span className="animate-spin mr-2">⏳</span> : <TreePine className="h-4 w-4 mr-2" />}
              <BilingualText text="Konu Ağacı Üret" />
            </Button>
            {ltError && <p className="text-sm text-red-600">{ltError}</p>}
            {ltResult && (
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm">{ltResult.subtopics.length} alt konu</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveLearningTree} disabled={ltSaving}>
                    {ltSaving ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    <BilingualText text="Firestore'a Kaydet" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setLtResult(null); setLtTopic(''); }}>
                    <BilingualText text="İptal" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 3) Çalışma Planı Üret */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <BilingualText text="Çalışma Planı Üret – Generate Study Plan" />
            </h4>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={spTopic}
                onChange={(e) => setSpTopic(e.target.value)}
                placeholder={language === 'tr' ? 'Konu' : 'Topic'}
                className="px-3 py-2 border rounded-lg flex-1 min-w-[140px]"
              />
              <input
                type="number"
                min={1}
                max={24}
                value={spHours}
                onChange={(e) => setSpHours(Number(e.target.value) || 8)}
                className="px-3 py-2 border rounded-lg w-20"
                title={language === 'tr' ? 'Tahmini saat' : 'Est. hours'}
              />
              <select
                value={spLevel}
                onChange={(e) => setSpLevel(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="kolay">kolay</option>
                <option value="orta">orta</option>
                <option value="ileri">ileri</option>
              </select>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={spDaily}
                onChange={(e) => setSpDaily(Number(e.target.value) || 2)}
                className="px-3 py-2 border rounded-lg w-24"
                title={language === 'tr' ? 'Günlük saat' : 'Daily hours'}
              />
            </div>
            <Button
              onClick={handleStudyPlan}
              disabled={spLoading || !spTopic.trim()}
              variant="outline"
              size="sm"
            >
              {spLoading ? <span className="animate-spin mr-2">⏳</span> : <Calendar className="h-4 w-4 mr-2" />}
              <BilingualText text="Çalışma Planı Üret" />
            </Button>
            {spError && <p className="text-sm text-red-600">{spError}</p>}
            {spResult && (
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm">{spResult.totalDays} gün, {spResult.dailyPlan.length} günlük plan</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveStudyPlan} disabled={spSaving}>
                    {spSaving ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    <BilingualText text="Firestore'a Kaydet" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSpResult(null); setSpTopic(''); }}>
                    <BilingualText text="İptal" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
