import React, { useEffect, useState } from 'react';
import { getCurriculumTree, saveUserProgress } from '@/services/curriculumService';
import type { CurriculumTree } from '@/types/curriculum';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle2, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function CurriculumTree() {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<CurriculumTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCurriculum();
  }, []);

  useEffect(() => {
    loadUserProgress();
  }, [user]);

  async function loadUserProgress() {
    if (!user?.id && !user?.username) return;
    
    try {
      const { db, collections } = await import('@/lib/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const userId = String(user.id || user.username);
      const progressRef = collection(db, collections.userProgress);
      const q = query(progressRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const completed = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.completed && data.topicId) {
          completed.add(`${data.subjectId}_${data.topicId}`);
        }
      });
      
      setCompletedTopics(completed);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  }

  async function loadCurriculum() {
    setLoading(true);
    setError(null);

    try {
      const data = await getCurriculumTree();
      setCurriculum(data);
      
      // İlk dersi genişlet
      if (data.length > 0) {
        setExpandedSubjects((prev) => (Object.keys(prev).length ? prev : { [data[0].id]: true }));
      }
    } catch (error) {
      console.error('Failed to load curriculum:', error);
      setError('Müfredat yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const toggleTopic = (subjectId: string, topicId: string) => {
    const key = `${subjectId}_${topicId}`;
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Müfredat yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={loadCurriculum}>Tekrar Dene</Button>
        </CardContent>
      </Card>
    );
  }

  const subjectCount = curriculum.length;
  const topicCount = curriculum.reduce((sum, subject) => sum + (subject.topics?.length || 0), 0);
  const subtopicCount = curriculum.reduce(
    (sum, subject) => sum + (subject.topics?.reduce((tSum, t) => tSum + (t.subtopics?.length || 0), 0) || 0),
    0
  );
  const completedCount = curriculum.reduce(
    (sum, subject) =>
      sum + (subject.topics?.filter((topic) => completedTopics.has(`${subject.id}_${topic.id}`)).length || 0),
    0
  );
  const overallProgress = topicCount > 0 ? Math.round((completedCount / topicCount) * 100) : 0;

  return (
    <Card className="border-gray-100">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="text-xl">TYT Müfredat Ağacı</CardTitle>
          <CardDescription>Dersler, konular ve alt konular</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{subjectCount} ders</Badge>
          <Badge variant="secondary">{topicCount} konu</Badge>
          <Badge variant="secondary">{subtopicCount} alt konu</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Genel ilerleme</span>
            <span>{completedCount}/{topicCount} konu</span>
          </div>
          <Progress value={overallProgress} />
        </div>

        {curriculum.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Müfredat verisi bulunamadı.
          </div>
        ) : (
          <div className="space-y-4">
            {curriculum.map((subject) => {
              const subjectTopicCount = subject.topics?.length || 0;
              const subjectCompletedCount = subject.topics?.filter((topic) =>
                completedTopics.has(`${subject.id}_${topic.id}`)
              ).length || 0;
              const subjectProgress = subjectTopicCount > 0
                ? Math.round((subjectCompletedCount / subjectTopicCount) * 100)
                : 0;

              return (
                <Card key={subject.id} className="border border-gray-200 shadow-none">
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleSubject(subject.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{subject.icon || '📘'}</span>
                        <div>
                          <CardTitle className="text-base">{subject.title}</CardTitle>
                          <CardDescription>{subject.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{subjectTopicCount} konu</Badge>
                        <Badge variant="secondary">{subject.estimatedHours || 0} saat</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {expandedSubjects[subject.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>İlerleme</span>
                        <span>{subjectCompletedCount}/{subjectTopicCount}</span>
                      </div>
                      <Progress value={subjectProgress} className="h-2" />
                    </div>
                  </CardHeader>

                  {expandedSubjects[subject.id] && subject.topics && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {subject.topics.map((topic) => {
                          const topicKey = `${subject.id}_${topic.id}`;
                          const isCompleted = completedTopics.has(topicKey);
                          const difficultyLabel =
                            topic.difficulty === 'easy' ? 'Kolay' :
                            topic.difficulty === 'medium' ? 'Orta' :
                            topic.difficulty === 'hard' ? 'Zor' : undefined;

                          return (
                            <div key={topic.id} className="border-l-2 border-blue-100 pl-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => toggleTopic(subject.id, topic.id)}
                                    >
                                      {expandedTopics[topicKey] ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <h4 className="font-medium text-gray-800">{topic.name || topic.title}</h4>
                                    {difficultyLabel && (
                                      <Badge
                                        variant="secondary"
                                        className={
                                          topic.difficulty === 'easy'
                                            ? 'bg-green-100 text-green-800'
                                            : topic.difficulty === 'medium'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }
                                      >
                                        {difficultyLabel}
                                      </Badge>
                                    )}
                                    <Badge variant="outline">{topic.estimatedTime || 45} dk</Badge>
                                  </div>
                                  <div className="ml-8 text-xs text-gray-500">
                                    {topic.subtopics?.length || 0} alt konu
                                  </div>
                                </div>

                                <Button
                                  onClick={() => handleTopicToggle(subject.id, topic.id)}
                                  disabled={saving[topicKey]}
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start gap-2"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-400" />
                                  )}
                                  <span className={isCompleted ? 'text-green-700 line-through' : ''}>
                                    {isCompleted ? 'Tamamlandı' : 'Tamamla'}
                                  </span>
                                </Button>
                              </div>

                              {expandedTopics[topicKey] && (
                                <div className="ml-8 mt-3 space-y-2">
                                  {topic.subtopics && topic.subtopics.length > 0 ? (
                                    topic.subtopics.map((subtopic) => (
                                      <div key={subtopic.id} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="text-gray-400 text-xs">›</span>
                                        <span>{subtopic.name || subtopic.title}</span>
                                        {subtopic.completed && (
                                          <Badge variant="secondary">Tamamlandı</Badge>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-500 italic">
                                      Alt konu bulunmuyor
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  async function handleTopicToggle(subjectId: string, topicId: string) {
    if (!user?.id && !user?.username) {
      alert('İlerleme kaydetmek için giriş yapın');
      return;
    }
    
    const key = `${subjectId}_${topicId}`;
    const isCompleted = completedTopics.has(key);
    setSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const userId = String(user.id || user.username);
      const result = await saveUserProgress(userId, subjectId, topicId, {
        completed: !isCompleted,
        completedAt: !isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      
      if (result.success) {
        if (!isCompleted) {
          setCompletedTopics(prev => new Set([...prev, key]));
        } else {
          setCompletedTopics(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      } else {
        alert('İlerleme kaydedilemedi: ' + (result.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error toggling topic:', error);
      alert('İlerleme kaydedilemedi');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  }
}
