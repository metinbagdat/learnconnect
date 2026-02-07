import React, { useEffect, useMemo, useState } from 'react';
import type { StudentProfile, StudyPlan, Subject } from '@/types/curriculum';
import { apiRequest } from '@/lib/queryClient';
import { getTYTCurriculum } from '@/services/curriculumService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

const demoCurriculum: Array<Pick<Subject, 'id' | 'title' | 'totalTopics' | 'estimatedHours'>> = [
  {
    id: 'mathematics',
    title: 'Matematik',
    totalTopics: 25,
    estimatedHours: 120
  },
  {
    id: 'turkish',
    title: 'Türkçe',
    totalTopics: 20,
    estimatedHours: 80
  },
  {
    id: 'science',
    title: 'Fen Bilimleri',
    totalTopics: 35,
    estimatedHours: 100
  },
  {
    id: 'social',
    title: 'Sosyal Bilimler',
    totalTopics: 30,
    estimatedHours: 90
  }
];

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function AIPlanGenerator() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<Subject[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: 'Ahmet Yılmaz',
    targetExam: 'TYT',
    dailyStudyHours: 4,
    targetDays: 120,
    weakSubjects: ['mathematics', 'science'],
    studyStyle: 'mixed',
    currentLevel: 'intermediate'
  });

  useEffect(() => {
    let isMounted = true;

    const loadCurriculum = async () => {
      setCurriculumLoading(true);
      setCurriculumError(null);
      try {
        const data = await getTYTCurriculum();
        if (isMounted) {
          setCurriculum(data);
        }
      } catch (error) {
        console.error('Failed to load curriculum:', error);
        if (isMounted) {
          setCurriculumError('Müfredat verileri yüklenemedi, demo veri kullanılacak.');
        }
      } finally {
        if (isMounted) {
          setCurriculumLoading(false);
        }
      }
    };

    loadCurriculum();
    return () => {
      isMounted = false;
    };
  }, []);

  const curriculumPayload = useMemo(() => {
    const source = curriculum.length > 0 ? curriculum : demoCurriculum;
    return source.map(({ id, title, totalTopics, estimatedHours }) => ({
      id,
      title,
      totalTopics,
      estimatedHours
    }));
  }, [curriculum]);

  const weeklyTargetHours = useMemo(() => {
    return (studentProfile.dailyStudyHours || 0) * 7;
  }, [studentProfile.dailyStudyHours]);

  const maxSummaryHours = useMemo(() => {
    if (!plan?.monthlySummary?.length) return 0;
    return Math.max(...plan.monthlySummary.map((item) => item.weeklyHours || 0), 1);
  }, [plan]);

  const updateProfile = (
    field: keyof StudentProfile,
    value: StudentProfile[keyof StudentProfile]
  ) => {
    setStudentProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePlan = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await apiRequest('POST', '/api/ai-plan', {
        studentProfile,
        curriculum: curriculumPayload,
        preferences: {
          includeWeekends: true,
          revisionDays: 7,
          examSimulation: true
        }
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data?.plan) {
        throw new Error('Plan oluşturulamadı.');
      }

      setPlan(data.plan);

      if (data.plan && data.success) {
        try {
          await saveWeeklyPlanToFirestore(data.plan);
        } catch (saveError) {
          console.warn('Plan Firestore\'a kaydedilemedi:', saveError);
        }
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setApiError(error instanceof Error ? error.message : 'Plan oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  async function saveWeeklyPlanToFirestore(planToSave: StudyPlan) {
    const { db, auth, collections } = await import('@/lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');

    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn('User not authenticated, skipping Firestore save');
      return;
    }

    const planId = planToSave.id || `plan_${Date.now()}`;
    const weeklyPlanRef = doc(db, collections.studyPlans, userId, 'weekly_plans', planId);

    await setDoc(
      weeklyPlanRef,
      {
        ...planToSave,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    if (planToSave.weeklyPlan && Array.isArray(planToSave.weeklyPlan)) {
      const tasksToCreate = [];

      for (const day of planToSave.weeklyPlan) {
        if (day.subjects && Array.isArray(day.subjects)) {
          for (const subject of day.subjects) {
            if (subject.topics && Array.isArray(subject.topics)) {
              for (const topic of subject.topics) {
                tasksToCreate.push({
                  title: `${subject.subject}: ${topic.name || 'Konu'}`,
                  description: topic.difficulty || 'Orta',
                  estimatedDuration: topic.estimatedTime || 45,
                  date: day.date,
                  subject: subject.subject,
                  topicId: topic.id,
                  priority: 'medium',
                  isCompleted: false
                });
              }
            }
          }
        }
      }

      if (tasksToCreate.length > 0) {
        try {
          const tasksResponse = await fetch('/api/tyt/tasks/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: tasksToCreate })
          });

          if (tasksResponse.ok) {
            console.log(`✅ ${tasksToCreate.length} görev TYT Tasks'e eklendi`);
          } else {
            console.warn('TYT Tasks batch create failed:', await tasksResponse.text());
          }
        } catch (taskError) {
          console.warn('TYT Tasks batch create error:', taskError);
        }
      }
    }

    console.log('✅ Haftalık plan Firestore\'a kaydedildi:', planId);
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Çalışma Planı Oluşturucu
        </CardTitle>
        <CardDescription>
          Öğrenci profiliniz ve TYT müfredatına göre haftalık plan üretir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-gray-800">Öğrenci Profili</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{curriculumPayload.length} ders</Badge>
              {curriculumLoading && <Badge variant="outline">Yükleniyor</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="student-name">İsim</Label>
              <Input
                id="student-name"
                value={studentProfile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="daily-hours">Günlük Çalışma Saati</Label>
              <select
                id="daily-hours"
                value={studentProfile.dailyStudyHours}
                onChange={(e) => updateProfile('dailyStudyHours', Number(e.target.value))}
                className={selectClassName}
              >
                <option value={2}>2 saat</option>
                <option value={3}>3 saat</option>
                <option value={4}>4 saat</option>
                <option value={5}>5 saat</option>
                <option value={6}>6+ saat</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="target-days">Hedef Gün Sayısı</Label>
              <Input
                id="target-days"
                type="number"
                min={30}
                max={365}
                value={studentProfile.targetDays}
                onChange={(e) => updateProfile('targetDays', Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="current-level">Mevcut Seviye</Label>
              <select
                id="current-level"
                value={studentProfile.currentLevel}
                onChange={(e) =>
                  updateProfile('currentLevel', e.target.value as StudentProfile['currentLevel'])
                }
                className={selectClassName}
              >
                <option value="beginner">Başlangıç</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </div>
          </div>

          {curriculumError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{curriculumError}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={generatePlan}
            disabled={loading || curriculumLoading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI Plan Oluşturuluyor...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI ile Kişiselleştirilmiş Plan Oluştur
              </span>
            )}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Müfredat ağacına ve profilinize göre kişiselleştirilmiş plan.
          </p>
          {apiError && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{apiError}</span>
            </div>
          )}
        </div>

        {plan && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle>Oluşturulan Plan</CardTitle>
                  <Badge variant="outline">{plan.id}</Badge>
                </div>
                <CardDescription>
                  Hedef sınav: {plan.targetExam} • Günlük {plan.dailyHours} saat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-2xl font-bold text-blue-700">{plan.totalDays}</div>
                    <div className="text-xs text-gray-500">Toplam Gün</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-2xl font-bold text-green-700">{plan.totalHours}</div>
                    <div className="text-xs text-gray-500">Toplam Saat</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-2xl font-bold text-purple-700">{plan.dailyHours}</div>
                    <div className="text-xs text-gray-500">Günlük Saat</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-2xl font-bold text-yellow-700">{weeklyTargetHours}</div>
                    <div className="text-xs text-gray-500">Haftalık Saat</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Haftalık Plan</CardTitle>
                <CardDescription>7 gün için çalışma dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                {plan.weeklyPlan && plan.weeklyPlan.length > 0 ? (
                  <div className="space-y-4">
                    {plan.weeklyPlan.map((day, index) => (
                      <div
                        key={`${day.day}-${day.date}-${index}`}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">{day.day}</div>
                            <div className="text-xs text-gray-500">{day.date}</div>
                          </div>
                          <Badge variant="secondary">{day.totalHours} saat</Badge>
                        </div>
                        <Progress
                          value={
                            plan.dailyHours ? Math.min(100, (day.totalHours / plan.dailyHours) * 100) : 0
                          }
                          className="mt-2"
                        />
                        <div className="mt-3 space-y-3">
                          {day.subjects?.map((subject, subjectIndex) => (
                            <div key={`${day.day}-${subject.subject}-${subjectIndex}`} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{subject.subject}</span>
                                <span className="text-xs text-gray-500">{subject.hours} saat</span>
                              </div>
                              {subject.topics?.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {subject.topics.slice(0, 4).map((topic) => (
                                    <Badge key={topic.id} variant="outline" className="text-xs">
                                      {topic.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Haftalık plan oluşturulamadı.</div>
                )}
              </CardContent>
            </Card>

            {plan.monthlySummary && plan.monthlySummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Aylık Özet</CardTitle>
                  <CardDescription>Haftalık ders yükü ve öncelikler</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.monthlySummary.map((summary) => (
                      <div key={summary.subject} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{summary.subject}</span>
                          <Badge
                            variant="secondary"
                            className={
                              summary.priority === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : summary.priority === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }
                          >
                            {summary.priority}
                          </Badge>
                        </div>
                        <Progress
                          value={maxSummaryHours ? (summary.weeklyHours / maxSummaryHours) * 100 : 0}
                        />
                        <div className="text-xs text-gray-500">
                          Haftalık {summary.weeklyHours} saat • {summary.completionWeeks} hafta
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {plan.recommendations && plan.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Önerileri</CardTitle>
                  <CardDescription>Odak alanları ve kişisel ipuçları</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.recommendations.map((rec, index) => (
                      <li
                        key={`${rec.type}-${index}`}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                      >
                        <Badge variant="outline">{rec.type}</Badge>
                        <div>
                          <div className="font-medium text-gray-800">{rec.message}</div>
                          <div className="text-sm text-gray-500">{rec.reason}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
