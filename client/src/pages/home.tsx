import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { Subject } from '@/types/curriculum';
import { getTYTCurriculum } from '@/services/curriculumService';
import LiveStatsSection from '@/components/home/live-stats-section';
import { Calendar, ChevronRight, Sparkles, Target, Timer } from 'lucide-react';

type ExamType = 'TYT' | 'AYT' | 'LGS';

type SubjectPreview = {
  id: string;
  title: string;
  color: string;
  estimatedHours?: number;
  totalTopics?: number;
};

const examOptions: Array<{ id: ExamType; title: string; description: string }> = [
  { id: 'TYT', title: 'TYT', description: 'Temel yeterlilik, güçlü temel ve deneme odaklı.' },
  { id: 'AYT', title: 'AYT', description: 'Alan dersleri, konu derinliği ve net optimizasyonu.' },
  { id: 'LGS', title: 'LGS', description: 'Sekizinci sınıf odaklı, düzenli tekrar ve hız.' }
];

const subjectCatalog: Record<ExamType, SubjectPreview[]> = {
  TYT: [
    { id: 'math', title: 'Matematik', color: 'bg-blue-100 text-blue-700', estimatedHours: 120, totalTopics: 25 },
    { id: 'turkish', title: 'Türkçe', color: 'bg-emerald-100 text-emerald-700', estimatedHours: 80, totalTopics: 20 },
    { id: 'science', title: 'Fen Bilimleri', color: 'bg-purple-100 text-purple-700', estimatedHours: 100, totalTopics: 35 },
    { id: 'social', title: 'Sosyal Bilimler', color: 'bg-amber-100 text-amber-700', estimatedHours: 90, totalTopics: 30 }
  ],
  AYT: [
    { id: 'math-2', title: 'Matematik-2', color: 'bg-blue-100 text-blue-700', estimatedHours: 140, totalTopics: 30 },
    { id: 'physics', title: 'Fizik', color: 'bg-rose-100 text-rose-700', estimatedHours: 90, totalTopics: 22 },
    { id: 'chemistry', title: 'Kimya', color: 'bg-lime-100 text-lime-700', estimatedHours: 80, totalTopics: 20 },
    { id: 'biology', title: 'Biyoloji', color: 'bg-emerald-100 text-emerald-700', estimatedHours: 85, totalTopics: 24 },
    { id: 'literature', title: 'Edebiyat', color: 'bg-amber-100 text-amber-700', estimatedHours: 70, totalTopics: 18 }
  ],
  LGS: [
    { id: 'math', title: 'Matematik', color: 'bg-blue-100 text-blue-700', estimatedHours: 90, totalTopics: 20 },
    { id: 'turkish', title: 'Türkçe', color: 'bg-emerald-100 text-emerald-700', estimatedHours: 70, totalTopics: 18 },
    { id: 'science', title: 'Fen Bilimleri', color: 'bg-purple-100 text-purple-700', estimatedHours: 75, totalTopics: 20 },
    { id: 'history', title: 'İnkılap Tarihi', color: 'bg-amber-100 text-amber-700', estimatedHours: 55, totalTopics: 14 },
    { id: 'english', title: 'İngilizce', color: 'bg-sky-100 text-sky-700', estimatedHours: 50, totalTopics: 12 }
  ]
};

const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const colorPalette = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700'
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const plannerRef = useRef<HTMLDivElement | null>(null);
  const [examType, setExamType] = useState<ExamType>('TYT');
  const [dailyHours, setDailyHours] = useState(4);
  const [targetDays, setTargetDays] = useState(120);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [studentName, setStudentName] = useState('');
  const [weakSubjects, setWeakSubjects] = useState<string[]>(['math']);
  const [tytCurriculum, setTytCurriculum] = useState<Subject[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [examDate, setExamDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 4);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    let isMounted = true;

    const loadCurriculum = async () => {
      setCurriculumLoading(true);
      setCurriculumError(null);

      try {
        const data = await getTYTCurriculum();
        if (isMounted) setTytCurriculum(data);
      } catch (error) {
        console.error('Failed to load TYT curriculum:', error);
        if (isMounted) setCurriculumError('Müfredat yüklenemedi');
      } finally {
        if (isMounted) setCurriculumLoading(false);
      }
    };

    loadCurriculum();
    return () => {
      isMounted = false;
    };
  }, []);


  const tytSubjectsFromService = useMemo<SubjectPreview[]>(() => {
    if (tytCurriculum.length === 0) return [];
    return tytCurriculum.map((subject, index) => ({
      id: subject.id,
      title: subject.title,
      estimatedHours: subject.estimatedHours,
      totalTopics: subject.totalTopics,
      color: colorPalette[index % colorPalette.length]
    }));
  }, [tytCurriculum]);

  const subjects = useMemo<SubjectPreview[]>(() => {
    if (examType === 'TYT' && tytSubjectsFromService.length > 0) {
      return tytSubjectsFromService;
    }
    return subjectCatalog[examType];
  }, [examType, tytSubjectsFromService]);

  useEffect(() => {
    setWeakSubjects((prev) => {
      const valid = prev.filter((id) => subjects.some((subject) => subject.id === id));
      if (valid.length > 0) return valid;
      return subjects.length > 0 ? [subjects[0].id] : [];
    });
  }, [subjects]);

  const curriculumStats = useMemo(() => {
    const totalTopics = subjects.reduce((sum, subject) => sum + (subject.totalTopics || 0), 0);
    const totalHours = subjects.reduce((sum, subject) => sum + (subject.estimatedHours || 0), 0);
    return { totalTopics, totalHours };
  }, [subjects]);

  const daysUntilExam = useMemo(() => {
    if (!examDate) return 0;
    const target = new Date(examDate);
    const today = new Date();
    const diff = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [examDate]);

  const distribution = useMemo(() => {
    const weeklyHours = dailyHours * 7;
    const weights = subjects.map((subject) => ({
      ...subject,
      weight: Math.max(1, (subject.estimatedHours || 60) / 60) * (weakSubjects.includes(subject.id) ? 1.8 : 1)
    }));
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

    return weights.map((item) => ({
      ...item,
      weeklyHours: Math.max(1, Math.round((weeklyHours * item.weight) / totalWeight))
    }));
  }, [dailyHours, subjects, weakSubjects]);

  const weeklyPlan = useMemo(() => {
    const buckets = distribution.map((item) => ({ ...item, remaining: item.weeklyHours }));

    return dayNames.map((day) => {
      let remaining = dailyHours;
      const allocations: Array<{ subject: string; hours: number }> = [];

      for (const bucket of buckets) {
        if (remaining <= 0) break;
        if (bucket.remaining <= 0) continue;
        const hours = Math.min(2, remaining, bucket.remaining);
        bucket.remaining -= hours;
        remaining -= hours;
        allocations.push({ subject: bucket.title, hours });
      }

      return {
        day,
        subjects: allocations,
        totalHours: dailyHours - remaining
      };
    });
  }, [dailyHours, distribution]);

  const recommendations = useMemo(() => {
    const tips: Array<{ title: string; description: string }> = [];

    if (dailyHours < 3) {
      tips.push({
        title: 'Süreyi artırın',
        description: 'Günlük çalışma sürenizi 3+ saat yaparak hızlanabilirsiniz.'
      });
    }

    if (weakSubjects.length === 0) {
      tips.push({
        title: 'Zayıf ders ekleyin',
        description: 'Zayıf derslerinizi işaretleyerek planınızı daha dengeli hale getirin.'
      });
    }

    if (targetDays < 90) {
      tips.push({
        title: 'Yoğun tempo',
        description: 'Hedef gün sayısı düşük, tekrar günlerini daha sık planlayın.'
      });
    }

    if (tips.length === 0) {
      tips.push({
        title: 'Düzenli tekrar',
        description: 'Haftada 1 deneme + 1 tekrar günü sürdürülebilir ilerleme sağlar.'
      });
    }

    return tips;
  }, [dailyHours, targetDays, weakSubjects]);

  const scrollToPlanner = () => {
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleWeakSubject = (subjectId: string) => {
    setWeakSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((item) => item !== subjectId) : [...prev, subjectId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white text-gray-900 relative overflow-hidden">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">LearnConnect</div>
            <div className="text-xs text-gray-500">AI destekli sınav hazırlığı</div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation('/login')}>
              Giriş Yap
            </Button>
            <Button onClick={() => setLocation('/register')}>Ücretsiz Başla</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-16 relative">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute top-40 -left-20 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl" />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit bg-white/70">
              <Sparkles className="h-4 w-4 mr-2" />
              Yeni: AI destekli planlayıcı
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Öğrenciler için{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                kişiselleştirilmiş
              </span>{' '}
              sınav planı
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              LearnConnect; TYT, AYT ve LGS hazırlığını tek panelde yönetmeniz için akıllı planlar,
              müfredat takibi ve motivasyon araçları sunar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={scrollToPlanner}>
                Planı Deneyin
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation('/register')}>
                Hemen Başla
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
                <Target className="h-4 w-4 text-blue-600" /> 3 adımda kişisel plan
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
                <Calendar className="h-4 w-4 text-purple-600" /> Haftalık otomatik dağılım
              </div>
            </div>
          </div>

          <Card className="shadow-lg border-gray-100 bg-white/90">
            <CardHeader>
              <CardTitle>Plan Özet Kartı</CardTitle>
              <CardDescription>Gerçek müfredat verileriyle anlık güncellenir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-sm text-gray-500">Hedef Sınav</div>
                  <div className="text-lg font-semibold">{examType}</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-sm text-gray-500">Günlük Süre</div>
                  <div className="text-lg font-semibold">{dailyHours} saat</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-sm text-gray-500">Hedef Gün</div>
                  <div className="text-lg font-semibold">{targetDays} gün</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-sm text-gray-500">Seviye</div>
                  <div className="text-lg font-semibold">
                    {level === 'beginner' ? 'Başlangıç' : level === 'intermediate' ? 'Orta' : 'İleri'}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Haftalık toplam süre</span>
                  <span>{dailyHours * 7} saat</span>
                </div>
                <Progress value={Math.min(100, (dailyHours * 7) / 40 * 100)} />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Önerilen tempo</span>
                <span className="font-medium text-blue-600">Dengeli</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {curriculumLoading && <Badge variant="secondary">Müfredat yükleniyor</Badge>}
                {!curriculumLoading && (
                  <>
                    <Badge variant="secondary">{curriculumStats.totalTopics || 0} konu</Badge>
                    <Badge variant="secondary">{curriculumStats.totalHours || 0} saat</Badge>
                  </>
                )}
                {curriculumError && <Badge variant="secondary">{curriculumError}</Badge>}
              </div>
            </CardContent>
          </Card>
        </section>

        <section ref={plannerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-gray-100">
            <CardHeader>
              <CardTitle>Planınızı Kurgulayın</CardTitle>
              <CardDescription>Hedeflerinizi seçin, plan anında şekillensin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Hedef Sınav</Label>
                <div className="grid grid-cols-1 gap-2">
                  {examOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setExamType(option.id)}
                      className={`rounded-lg border px-3 py-2 text-left transition ${
                        examType === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="font-semibold">{option.title}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Günlük Çalışma Saati</Label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={dailyHours}
                  onChange={(event) => setDailyHours(Number(event.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="text-sm text-gray-600">{dailyHours} saat / gün</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-days">Hedef Gün Sayısı</Label>
                <Input
                  id="target-days"
                  type="number"
                  min={30}
                  max={365}
                  value={targetDays}
                  onChange={(event) => setTargetDays(Number(event.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Seviye</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setLevel(item)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                        level === item ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      {item === 'beginner' ? 'Başlangıç' : item === 'intermediate' ? 'Orta' : 'İleri'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Öğrenci Adı (opsiyonel)</Label>
                <Input
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Örn. Zeynep"
                />
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle>Haftalık Ders Dağılımı</CardTitle>
                <CardDescription>Seçtiğiniz zayıf derslere göre ağırlıklandırılır.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => toggleWeakSubject(subject.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        weakSubjects.includes(subject.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-blue-200'
                      }`}
                    >
                      {subject.title} {weakSubjects.includes(subject.id) ? '• zayıf' : ''}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {distribution.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{item.title}</div>
                        <Badge className={item.color}>{item.weeklyHours} saat</Badge>
                      </div>
                      <Progress value={Math.min(100, (item.weeklyHours / (dailyHours * 7)) * 100)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle>Örnek Haftalık Plan</CardTitle>
                <CardDescription>AI önerisi ile planlanmış 7 gün.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyPlan.map((day) => (
                  <div key={day.day} className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{day.day}</div>
                      <Badge variant="secondary">{day.totalHours} saat</Badge>
                    </div>
                    {day.subjects.length === 0 ? (
                      <div className="text-sm text-gray-500">Dinlenme / tekrar</div>
                    ) : (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {day.subjects.map((item) => (
                          <li key={`${day.day}-${item.subject}`} className="flex items-center justify-between">
                            <span>{item.subject}</span>
                            <span className="font-medium">{item.hours} sa</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-gray-100 lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle>Canlı Müfredat Önizlemesi</CardTitle>
                  <CardDescription>
                    {examType === 'TYT' && tytSubjectsFromService.length > 0
                      ? 'Firestore verisiyle güncellenen TYT özeti.'
                      : 'Seçtiğiniz sınava göre örnek müfredat görünümü.'}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {examType} • {curriculumStats.totalTopics || 0} konu
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <div key={subject.id} className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{subject.title}</div>
                      <Badge className={subject.color}>
                        {subject.estimatedHours || 0} saat
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {subject.totalTopics || 0} konu • {weakSubjects.includes(subject.id) ? 'Zayıf alan' : 'Dengeli'}
                    </div>
                    <Progress
                      value={Math.min(100, ((subject.estimatedHours || 0) / Math.max(1, curriculumStats.totalHours)) * 100)}
                    />
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-semibold">Öneri: Haftalık deneme ritmi</div>
                  <p className="text-sm text-gray-500">
                    Haftada {examType === 'LGS' ? '1' : '2'} deneme ile net artışını hızlandır.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setLocation('/register')}>
                  Deneme Programı Oluştur <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>Sınav Takvimi</CardTitle>
              <CardDescription>Kalan süreye göre tempo önerisi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Kalan gün</div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-blue-600">
                    <Timer className="h-4 w-4" /> {daysUntilExam} gün
                  </div>
                </div>
                <Progress value={Math.min(100, (daysUntilExam / Math.max(1, targetDays)) * 100)} className="mt-3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-date">Sınav Tarihi</Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                />
              </div>
              <div className="rounded-lg border bg-white p-4 text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Önerilen tekrar günü</span>
                  <span className="font-semibold">Her {examType === 'LGS' ? '5' : '7'} günde 1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Haftalık hedef</span>
                  <span className="font-semibold">{dailyHours * 7} saat</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => setLocation('/register')}>
                Takvimi Kaydet
              </Button>
            </CardContent>
          </Card>
        </section>

        <LiveStatsSection
          context="home"
          showRoutine
          routineTargetLabel={examType === 'LGS' ? '1 deneme' : '2 deneme'}
          routineProgress={examType === 'LGS' ? 40 : 60}
          routineCtaHref="/register"
        />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>AI Önerileri</CardTitle>
              <CardDescription>Planınızı iyileştiren akıllı ipuçları.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((tip, index) => (
                <div key={index} className="rounded-lg border bg-white p-3">
                  <div className="font-semibold text-sm">{tip.title}</div>
                  <p className="text-xs text-gray-500 mt-1">{tip.description}</p>
                </div>
              ))}
              <Button className="w-full mt-3" onClick={() => setLocation('/register')}>
                Planı Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-100 lg:col-span-2">
            <CardHeader>
              <CardTitle>Başarı Haritası</CardTitle>
              <CardDescription>Hedefinizi netleştirin, süreci takip edin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Günlük hedef', value: `${dailyHours} saat` },
                  { label: 'Toplam süre', value: `${dailyHours * targetDays} saat` },
                  { label: 'Plan başlangıcı', value: 'Bugün' }
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border bg-white p-4">
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="text-lg font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-semibold">Hedef {examType} netleri</div>
                  <p className="text-sm text-gray-500">Gelişim takip paneliyle net artışını gör.</p>
                </div>
                <Button variant="outline" onClick={() => setLocation('/login')}>
                  Paneli Gör <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-500">
          <span>© 2026 LearnConnect</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation('/login')} className="hover:text-gray-700">
              Giriş
            </button>
            <button onClick={() => setLocation('/register')} className="hover:text-gray-700">
              Kayıt
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
