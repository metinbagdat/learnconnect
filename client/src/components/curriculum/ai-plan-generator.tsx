import React, { useEffect, useState } from 'react';
import type { StudentProfile, StudyPlan, Subject } from '@/types/curriculum';
import { apiRequest } from '@/lib/queryClient';
import { getTYTCurriculum } from '@/services/curriculumService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export default function AIPlanGenerator() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<Subject[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: '',
    targetExam: 'TYT',
    dailyStudyHours: 4,
    targetDays: 120,
    currentLevel: 'intermediate'
  });

  useEffect(() => {
    loadCurriculum();
  }, []);

  async function loadCurriculum() {
    setCurriculumLoading(true);
    setCurriculumError(null);

    try {
      const data = await getTYTCurriculum();
      setCurriculum(data);
    } catch (error) {
      console.error('Error loading curriculum:', error);
      setCurriculumError('Müfredat yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setCurriculumLoading(false);
    }
  }

  const generatePlan = async () => {
    if (!studentProfile.name?.trim()) {
      setError('Lütfen isim alanını doldurun.');
      return;
    }

    if (curriculumLoading) {
      setError('Müfredat yükleniyor. Lütfen kısa süre sonra tekrar deneyin.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/ai-plan', {
        studentProfile,
        curriculum,
        preferences: {
          includeWeekends: true,
          revisionDays: 7
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPlan(data.plan);
      
      // Haftalık planı Firestore'a kaydet
      if (data.plan && data.success) {
        try {
          await saveWeeklyPlanToFirestore(data.plan);
        } catch (saveError) {
          console.warn('Plan Firestore\'a kaydedilemedi:', saveError);
          // Hata olsa bile plan gösterilmeye devam eder
        }
      }
      
    } catch (error) {
      console.error('Error generating plan:', error);
      setError(error instanceof Error ? error.message : 'Plan oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Haftalık planı Firestore'a kaydet ve TYT Tasks'e dönüştür
  async function saveWeeklyPlanToFirestore(plan: StudyPlan) {
    const { db, auth, collections, isFirebaseConfigured } = await import('@/lib/firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    
    if (!isFirebaseConfigured) {
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn('User not authenticated, skipping Firestore save');
      return;
    }
    
    // Firestore'a kaydet: study_plans/{userId}/weekly_plans/{planId}
    const planId = plan.id || `plan_${Date.now()}`;
    const weeklyPlanRef = doc(db, collections.studyPlans, userId, 'weekly_plans', planId);
    
    await setDoc(weeklyPlanRef, {
      ...plan,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // TYT Tasks'e dönüştür: weeklyPlan → daily_tasks
    if (plan.weeklyPlan && Array.isArray(plan.weeklyPlan)) {
      const tasksToCreate = [];
      
      for (const day of plan.weeklyPlan) {
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
      
      // TYT Tasks API'ye gönder
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

  const updateProfile = (field: keyof StudentProfile, value: string | number | string[] | undefined) => {
    setStudentProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const weeklyHoursPlanned = plan
    ? plan.weeklyPlan.reduce((sum, day) => sum + (day.totalHours || 0), 0)
    : 0;
  const weeklyTargetHours = plan ? plan.dailyHours * 7 : 0;
  const weeklyProgress = weeklyTargetHours > 0 ? Math.round((weeklyHoursPlanned / weeklyTargetHours) * 100) : 0;
  const selectClassName =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <CardTitle>AI Çalışma Planı Oluşturucu</CardTitle>
        <CardDescription>
          Müfredat ağacına ve öğrenci profilinize göre kişiselleştirilmiş plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="border border-blue-100 bg-blue-50 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-base text-blue-900">Öğrenci Profili</CardTitle>
              <div className="flex flex-wrap gap-2">
                {curriculumLoading && <Badge variant="secondary">Müfredat yükleniyor</Badge>}
                {!curriculumLoading && !curriculumError && (
                  <Badge variant="secondary">{curriculum.length} ders yüklendi</Badge>
                )}
                {curriculumError && <Badge variant="secondary">{curriculumError}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">İsim</Label>
                <Input
                  id="student-name"
                  type="text"
                  value={studentProfile.name}
                  onChange={(e) => updateProfile('name', e.target.value)}
                  placeholder="Örn. Ayşe Demir"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-hours">Günlük Çalışma Saati</Label>
                <select
                  id="daily-hours"
                  value={studentProfile.dailyStudyHours}
                  onChange={(e) => updateProfile('dailyStudyHours', parseInt(e.target.value, 10))}
                  className={selectClassName}
                >
                  <option value={2}>2 saat</option>
                  <option value={3}>3 saat</option>
                  <option value={4}>4 saat</option>
                  <option value={5}>5 saat</option>
                  <option value={6}>6+ saat</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-days">Hedef Gün Sayısı</Label>
                <Input
                  id="target-days"
                  type="number"
                  value={studentProfile.targetDays}
                  onChange={(e) => updateProfile('targetDays', parseInt(e.target.value, 10))}
                  min={30}
                  max={365}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-level">Mevcut Seviye</Label>
                <select
                  id="current-level"
                  value={studentProfile.currentLevel}
                  onChange={(e) => updateProfile('currentLevel', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                  className={selectClassName}
                >
                  <option value="beginner">Başlangıç</option>
                  <option value="intermediate">Orta</option>
                  <option value="advanced">İleri</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={generatePlan}
            disabled={loading || curriculumLoading}
            className="w-full h-11"
          >
            {loading ? 'AI Plan Oluşturuluyor...' : 'AI ile Kişiselleştirilmiş Plan Oluştur'}
          </Button>
          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}
        </div>

        {plan && (
          <Card className="border border-green-100 bg-green-50/40 shadow-none">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Oluşturulan Plan</CardTitle>
                <CardDescription>{plan.studentName} için haftalık plan</CardDescription>
              </div>
              <Badge variant="secondary">{plan.id}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-xl font-bold text-blue-700">{plan.totalDays}</div>
                  <div className="text-xs text-gray-500">Toplam Gün</div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-xl font-bold text-green-700">{plan.totalHours}</div>
                  <div className="text-xs text-gray-500">Toplam Saat</div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-xl font-bold text-purple-700">{plan.dailyHours}/gün</div>
                  <div className="text-xs text-gray-500">Günlük Hedef</div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-xl font-bold text-yellow-700">{plan.targetExam}</div>
                  <div className="text-xs text-gray-500">Sınav Hedefi</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Haftalık planlanan süre</span>
                  <span>{weeklyHoursPlanned}/{weeklyTargetHours} saat</span>
                </div>
                <Progress value={weeklyProgress} />
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Haftalık Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.weeklyPlan?.map((day, index) => {
                    const dayProgress = plan.dailyHours
                      ? Math.min(100, Math.round((day.totalHours / plan.dailyHours) * 100))
                      : 0;

                    return (
                      <div key={index} className="rounded-lg border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{day.day}</div>
                            <div className="text-xs text-gray-500">{day.date}</div>
                          </div>
                          <Badge variant="secondary">{day.totalHours} saat</Badge>
                        </div>
                        <Progress value={dayProgress} className="mt-2 h-2" />
                        <div className="mt-2 text-xs text-gray-500">
                          {day.subjects.length} ders
                        </div>
                        {day.subjects.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            {day.subjects.map((subject) => subject.subject).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {plan.monthlySummary && plan.monthlySummary.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Özet İstatistikler</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.monthlySummary.slice(0, 4).map((summary, index) => (
                      <div key={index} className="rounded-lg border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{summary.subject}</div>
                          <Badge variant="secondary">{summary.priority}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Haftalık {summary.weeklyHours} saat • {summary.completionWeeks} hafta
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.recommendations && plan.recommendations.length > 0 && (
                <div className="rounded-lg border bg-white p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">AI Önerileri</h4>
                  <ul className="space-y-2">
                    {plan.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Badge variant="secondary">{rec.type}</Badge>
                        <div>
                          <div className="font-medium">{rec.message}</div>
                          <div className="text-sm text-gray-500">{rec.reason}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-center">
                <Button variant="outline">Planı PDF Olarak İndir</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
