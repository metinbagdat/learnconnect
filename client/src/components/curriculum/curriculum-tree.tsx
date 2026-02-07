import React, { useEffect, useMemo, useState } from 'react';
import { getCurriculumTree, saveUserProgress } from '@/services/curriculumService';
import type { CurriculumTree } from '@/types/curriculum';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

const difficultyLabels: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor'
};

const difficultyStyles: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

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

  async function loadCurriculum() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurriculumTree();
      setCurriculum(data);

      if (data.length > 0) {
        setExpandedSubjects({ [data[0].id]: true });
      }
    } catch (loadError) {
      console.error('Failed to load curriculum:', loadError);
      setError('Müfredat yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

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
    } catch (progressError) {
      console.error('Error loading user progress:', progressError);
    }
  }

  const stats = useMemo(() => {
    const subjectCount = curriculum.length;
    const topicCount = curriculum.reduce((sum, subject) => sum + (subject.topics?.length || 0), 0);
    const subtopicCount = curriculum.reduce(
      (sum, subject) =>
        sum + (subject.topics?.reduce((tSum, topic) => tSum + (topic.subtopics?.length || 0), 0) || 0),
      0
    );
    const totalHours = curriculum.reduce((sum, subject) => sum + (subject.estimatedHours || 0), 0);

    return {
      subjectCount,
      topicCount,
      subtopicCount,
      totalHours
    };
  }, [curriculum]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const getSubjectProgress = (subject: CurriculumTree) => {
    const totalTopics = subject.topics?.length || 0;
    if (totalTopics === 0) return 0;
    const completed = subject.topics?.filter((topic) =>
      completedTopics.has(`${subject.id}_${topic.id}`)
    ).length || 0;
    return Math.round((completed / totalTopics) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Müfredat yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={loadCurriculum} variant="outline">
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-xl">TYT Müfredat Ağacı</CardTitle>
          <CardDescription>Dersler, konular ve alt konuların hiyerarşisi</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{stats.subjectCount} ders</Badge>
          <Badge variant="outline">{stats.topicCount} konu</Badge>
          <Badge variant="outline">{stats.subtopicCount} alt konu</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {curriculum.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            Müfredat verisi bulunamadı.
          </div>
        )}

        {curriculum.map((subject) => {
          const subjectProgress = getSubjectProgress(subject);
          const subjectTopics = subject.topics || [];
          const subtopicCount =
            subjectTopics.reduce((sum, topic) => sum + (topic.subtopics?.length || 0), 0) || 0;

          return (
            <Card key={subject.id} className="border border-gray-200">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => toggleSubject(subject.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon || '📘'}</span>
                    <div>
                      <CardTitle className="text-base">{subject.title}</CardTitle>
                      <CardDescription>{subject.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {subject.totalTopics || subjectTopics.length} konu
                    </Badge>
                    <Badge variant="outline">{subject.estimatedHours || 0} saat</Badge>
                    {expandedSubjects[subject.id] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </button>

              {expandedSubjects[subject.id] && (
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>İlerleme</span>
                      <span>{subjectProgress}%</span>
                    </div>
                    <Progress value={subjectProgress} />
                  </div>

                  <div className="space-y-3">
                    {subjectTopics.map((topic) => {
                      const isCompleted = completedTopics.has(`${subject.id}_${topic.id}`);
                      const subtopics = topic.subtopics || [];

                      return (
                        <div key={topic.id} className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              className="flex items-center gap-2 text-left"
                              onClick={() => toggleTopic(topic.id)}
                            >
                              <span className="text-blue-600">•</span>
                              <span className="font-medium text-gray-800">
                                {topic.name || topic.title}
                              </span>
                            </button>
                            <div className="flex items-center gap-2">
                              {topic.difficulty && (
                                <Badge
                                  variant="secondary"
                                  className={difficultyStyles[topic.difficulty] || ''}
                                >
                                  {difficultyLabels[topic.difficulty] || topic.difficulty}
                                </Badge>
                              )}
                              <Badge variant="outline">{topic.estimatedTime || 45} dk</Badge>
                              {expandedTopics[topic.id] ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTopicToggle(subject.id, topic.id)}
                              disabled={saving[`${subject.id}_${topic.id}`]}
                              className="gap-2"
                            >
                              <CheckCircle2
                                className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}
                              />
                              <span className={isCompleted ? 'text-green-700 line-through' : ''}>
                                {isCompleted ? 'Tamamlandı' : 'Tamamla'}
                              </span>
                            </Button>
                            <Badge variant="outline">{subtopics.length} alt konu</Badge>
                          </div>

                          {expandedTopics[topic.id] && (
                            <div className="mt-3 space-y-2">
                              {subtopics.length > 0 ? (
                                subtopics.map((subtopic) => (
                                  <div key={subtopic.id} className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400">›</span>
                                    <span className="text-gray-700">
                                      {subtopic.name || subtopic.title}
                                    </span>
                                    {subtopic.completed && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Tamamlandı
                                      </Badge>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500 italic">Alt konu bulunmuyor</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <div className="text-lg font-semibold text-gray-800">{subjectTopics.length}</div>
                      <div>Ana Konu</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <div className="text-lg font-semibold text-gray-800">{subtopicCount}</div>
                      <div>Alt Konu</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.subjectCount}</div>
            <div className="text-sm text-gray-600">Ders</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.topicCount}</div>
            <div className="text-sm text-gray-600">Ana Konu</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.subtopicCount}</div>
            <div className="text-sm text-gray-600">Alt Konu</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.totalHours} saat</div>
            <div className="text-sm text-gray-600">Tahmini Süre</div>
          </div>
        </div>
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
    setSaving((prev) => ({ ...prev, [key]: true }));

    try {
      const userId = String(user.id || user.username);
      const result = await saveUserProgress(userId, subjectId, topicId, {
        completed: !isCompleted,
        completedAt: !isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });

      if (result.success) {
        if (!isCompleted) {
          setCompletedTopics((prev) => new Set([...prev, key]));
        } else {
          setCompletedTopics((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      } else {
        alert('İlerleme kaydedilemedi: ' + (result.error || 'Bilinmeyen hata'));
      }
    } catch (toggleError) {
      console.error('Error toggling topic:', toggleError);
      alert('İlerleme kaydedilemedi');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  }
}
import React, { useEffect, useMemo, useState } from 'react';
import { getCurriculumTree, saveUserProgress } from '@/services/curriculumService';
import type { CurriculumTree as CurriculumTreeType, Topic } from '@/types/curriculum';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Circle, Loader2 } from 'lucide-react';

export default function CurriculumTree() {
  const { user } = useAuth();
  const [curriculum, setCurriculum] = useState<CurriculumTreeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCurriculum();
    loadUserProgress();
  }, [user]);

  const stats = useMemo(() => {
    const totalTopics = curriculum.reduce((sum, subject) => sum + (subject.topics?.length || 0), 0);
    const totalSubtopics = curriculum.reduce(
      (sum, subject) =>
        sum + (subject.topics?.reduce((topicSum, topic) => topicSum + (topic.subtopics?.length || 0), 0) || 0),
      0
    );
    const totalHours = curriculum.reduce((sum, subject) => sum + (subject.estimatedHours || 0), 0);
    return {
      subjectCount: curriculum.length,
      totalTopics,
      totalSubtopics,
      totalHours
    };
  }, [curriculum]);

  function getSubjectProgress(subject: CurriculumTreeType) {
    const topics = subject.topics || [];
    if (topics.length === 0) return 0;
    const completed = topics.filter((topic) => completedTopics.has(`${subject.id}_${topic.id}`)).length;
    return Math.round((completed / topics.length) * 100);
  }

  function getDifficultyBadge(topic: Topic) {
    if (!topic.difficulty) return null;
    const label = topic.difficulty === 'easy' ? 'Kolay' : topic.difficulty === 'medium' ? 'Orta' : 'Zor';
    const className =
      topic.difficulty === 'easy'
        ? 'bg-green-100 text-green-800'
        : topic.difficulty === 'medium'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800';
    return (
      <Badge variant="secondary" className={className}>
        {label}
      </Badge>
    );
  }

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

      if (data.length > 0) {
        setExpandedSubjects({ [data[0].id]: true });
      }
    } catch (error) {
      console.error('Failed to load curriculum:', error);
      setError('Müfredat yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  async function handleTopicToggle(subjectId: string, topicId: string) {
    if (!user?.id && !user?.username) {
      alert('İlerleme kaydetmek için giriş yapın');
      return;
    }

    const key = `${subjectId}_${topicId}`;
    const isCompleted = completedTopics.has(key);
    setSaving((prev) => ({ ...prev, [key]: true }));

    try {
      const userId = String(user.id || user.username);
      const result = await saveUserProgress(userId, subjectId, topicId, {
        completed: !isCompleted,
        completedAt: !isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });

      if (result.success) {
        if (!isCompleted) {
          setCompletedTopics((prev) => new Set([...prev, key]));
        } else {
          setCompletedTopics((prev) => {
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
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span>Müfredat yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center text-center gap-3 text-gray-600">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p>{error}</p>
            <Button variant="outline" onClick={loadCurriculum}>
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>TYT Müfredat Ağacı</CardTitle>
          <CardDescription>Dersler, konular ve alt konular</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{stats.subjectCount} ders</Badge>
          <Badge variant="outline">{stats.totalTopics} konu</Badge>
          <Badge variant="outline">{stats.totalSubtopics} alt konu</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {curriculum.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">
            Müfredat verisi bulunamadı.
          </div>
        )}

        {curriculum.map((subject) => {
          const subjectProgress = getSubjectProgress(subject);
          return (
            <Card key={subject.id} className="border border-gray-200">
              <button
                type="button"
                onClick={() => toggleSubject(subject.id)}
                className="w-full text-left"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon || '📘'}</span>
                    <div>
                      <CardTitle className="text-base">{subject.title}</CardTitle>
                      <CardDescription>{subject.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{subject.totalTopics || subject.topics?.length || 0} konu</Badge>
                    <Badge variant="outline">{subject.estimatedHours || 0} saat</Badge>
                    {expandedSubjects[subject.id] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </button>

              {expandedSubjects[subject.id] && (
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>İlerleme</span>
                      <span>{subjectProgress}%</span>
                    </div>
                    <Progress value={subjectProgress} />
                  </div>

                  <div className="space-y-3">
                    {subject.topics?.map((topic) => {
                      const topicKey = `${subject.id}_${topic.id}`;
                      const isCompleted = completedTopics.has(topicKey);
                      return (
                        <div key={topic.id} className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleTopic(topic.id)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600">•</span>
                                <span className="font-medium text-gray-800">{topic.name || topic.title}</span>
                              </div>
                            </button>
                            <div className="flex items-center gap-2">
                              {getDifficultyBadge(topic)}
                              <Badge variant="outline">{topic.estimatedTime || 45} dk</Badge>
                              {expandedTopics[topic.id] ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTopicToggle(subject.id, topic.id)}
                              disabled={saving[topicKey]}
                              className="gap-2"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={isCompleted ? 'text-green-700 line-through' : ''}>
                                {isCompleted ? 'Tamamlandı' : 'Tamamla'}
                              </span>
                            </Button>
                            <Badge variant="secondary">{topic.subtopics?.length || 0} alt konu</Badge>
                          </div>

                          {expandedTopics[topic.id] && (
                            <div className="mt-3 space-y-2">
                              {topic.subtopics && topic.subtopics.length > 0 ? (
                                topic.subtopics.map((subtopic) => (
                                  <div key={subtopic.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <span className="text-gray-400">›</span>
                                    <span>{subtopic.name || subtopic.title}</span>
                                    {subtopic.completed && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Tamamlandı
                                      </Badge>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500 italic">Alt konu bulunmuyor</div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.subjectCount}</div>
            <div className="text-sm text-gray-600">Ders</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.totalTopics}</div>
            <div className="text-sm text-gray-600">Ana Konu</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.totalSubtopics}</div>
            <div className="text-sm text-gray-600">Alt Konu</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.totalHours}s</div>
            <div className="text-sm text-gray-600">Tahmini Süre</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
