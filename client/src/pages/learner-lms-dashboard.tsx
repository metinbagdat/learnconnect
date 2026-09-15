/**
 * LMS Phase 1–2 — Öğrenci dashboard
 * Veri: Firebase learningPaths + studyStats; Neon API görevler + duyurular
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Bell,
  BookOpen,
  CalendarClock,
  Flame,
  Lightbulb,
  PlayCircle,
  Target,
} from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { getUserId } from '@/lib/user-utils';
import type { StudyStat } from '@/services/studyStatsService';
import type { LmsAnnouncement, LmsLearnerTask } from '@/services/lmsLearnerApi';
import {
  createPersonalLearnerTask,
  fetchAnnouncements,
  fetchLearnerTasks,
  patchLearnerTaskStatus,
} from '@/services/lmsLearnerApi';

interface PathRow {
  id: string;
  title: string;
  category: string;
  progress: number;
}

const DEMO_TASKS = [
  { id: 'demo-1', title: 'TYT Matematik — Haftalık deneme', dueLabel: 'Yarın 10:00', type: 'sınav' },
  { id: 'demo-2', title: 'Geometri ödevi (üçgenler)', dueLabel: '3 gün içinde', type: 'ödev' },
  { id: 'demo-3', title: 'Fizik tekrar videosu', dueLabel: 'Bu hafta', type: 'içerik' },
];

function formatDueLabel(dueAt: string | null): string {
  if (!dueAt) return 'Tarih belirtilmedi';
  try {
    return new Date(dueAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export default function LearnerLmsDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [paths, setPaths] = useState<PathRow[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [lmsTasks, setLmsTasks] = useState<LmsLearnerTask[]>([]);
  const [tasksSource, setTasksSource] = useState<string | undefined>();
  const [announcements, setAnnouncements] = useState<LmsAnnouncement[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [taskBusyId, setTaskBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id && !user?.username) return;

    const run = async () => {
      try {
        const userId = getUserId(user);
        const [lpMod, ssMod, lms, ann] = await Promise.all([
          import('@/services/learningPathsService'),
          import('@/services/studyStatsService'),
          fetchLearnerTasks().catch(() => ({ tasks: [] as LmsLearnerTask[], source: 'error' as const })),
          fetchAnnouncements().catch(() => ({
            announcements: [] as LmsAnnouncement[],
            source: 'error' as const,
          })),
        ]);
        const { getAllPaths, getUserProgress } = lpMod;
        const { getTodayStats } = ssMod;
        const [allPaths, progress, stats] = await Promise.all([
          getAllPaths(),
          getUserProgress(userId),
          getTodayStats(userId),
        ]);
        setStudyStats(stats);
        setLmsTasks(lms.tasks);
        setTasksSource(lms.source);
        setAnnouncements(ann.announcements);

        const rows: PathRow[] = allPaths.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          progress: progress[p.id]?.progressPercent ?? 0,
        }));
        setPaths(rows);
      } catch (e) {
        console.error('LearnerLMS load', e);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user]);

  const showDemoTasks = lmsTasks.length === 0 && tasksSource === 'no_database';

  const sortedApiTasks = useMemo(() => {
    const pending = lmsTasks.filter((t) => t.status !== 'done');
    const done = lmsTasks.filter((t) => t.status === 'done');
    return [...pending, ...done].slice(0, 50);
  }, [lmsTasks]);

  const handleToggleTask = async (task: LmsLearnerTask) => {
    if (tasksSource !== 'neon') return;
    const next = task.status === 'done' ? 'pending' : 'done';
    setTaskBusyId(task.id);
    try {
      await patchLearnerTaskStatus(task.id, next);
      setLmsTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: next } : t))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTaskBusyId(null);
    }
  };

  const handleAddPersonalTask = async () => {
    const title = newTaskTitle.trim();
    if (!title || tasksSource !== 'neon') return;
    setSavingTask(true);
    try {
      const task = await createPersonalLearnerTask({
        title,
        taskType: 'ödev',
        dueAt: newTaskDue ? new Date(newTaskDue).toISOString() : null,
      });
      setLmsTasks((prev) => [task, ...prev]);
      setNewTaskTitle('');
      setNewTaskDue('');
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTask(false);
    }
  };

  const primaryPath = useMemo(() => {
    const active = paths.filter((p) => p.progress > 0).sort((a, b) => b.progress - a.progress);
    return active[0] ?? paths[0] ?? null;
  }, [paths]);

  const globalAvg = useMemo(() => {
    if (paths.length === 0) return 0;
    const sum = paths.reduce((a, p) => a + p.progress, 0);
    return Math.round(sum / paths.length);
  }, [paths]);

  const tytProgress = useMemo(() => {
    const tyt = paths.find((p) => p.category === 'TYT' || p.title.toLowerCase().includes('tyt'));
    return tyt?.progress ?? primaryPath?.progress ?? 0;
  }, [paths, primaryPath]);

  const aiHint = useMemo(() => {
    const low = paths.filter((p) => p.progress > 0 && p.progress < 35).sort((a, b) => a.progress - b.progress)[0];
    if (low) {
      return {
        title: 'Zayıf alan tespiti',
        body: `${low.title} ilerlemen düşük (%${low.progress}). 15 dk mini tekrar + 5 soru önerilir.`,
      };
    }
    if (primaryPath && primaryPath.progress < 60) {
      return {
        title: 'Devam önerisi',
        body: `${primaryPath.title} üzerinde çalışmaya devam et; bir sonraki adıma geçmeye yakınsın.`,
      };
    }
    return {
      title: 'Harika gidiyorsun',
      body: 'Bugün zorlandığın bir konuya kısa bir tekrar veya deneme sınavı ekleyebilirsin.',
    };
  }, [paths, primaryPath]);

  const weekFocus = useMemo(() => {
    const titles = paths.filter((p) => p.progress > 0).map((p) => p.title);
    if (titles.length === 0) return 'Bu hafta bir öğrenme yoluna başla veya TYT Matematik ile devam et.';
    return `Odak: ${titles.slice(0, 2).join(' · ')}`;
  }, [paths]);

  const resumePathId = useMemo(() => {
    if (typeof window === 'undefined') return primaryPath?.id;
    const last = localStorage.getItem('lastLearningPathId');
    if (last && paths.some((p) => p.id === last)) return last;
    return primaryPath?.id ?? paths[0]?.id;
  }, [paths, primaryPath]);

  const streak = studyStats?.streakCount ?? 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30">
        <MainNavbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <header className="mb-8">
            <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide">LMS · Öğrenci</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Merhaba{user?.displayName ? `, ${user.displayName}` : ''} 👋
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Odak, ilerleme, görevler ve duyurular — Phase 2 (Neon görevleri + duyurular).
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Duyurular */}
              {announcements.length > 0 && (
                <section className="lg:col-span-12 rounded-2xl bg-white border border-sky-100 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-sky-600" />
                    Duyurular
                  </h2>
                  <ul className="space-y-3">
                    {announcements.slice(0, 5).map((a) => (
                      <li key={a.id} className="rounded-xl border border-gray-100 px-4 py-3 bg-sky-50/50">
                        <p className="font-medium text-gray-900">{a.title}</p>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{a.body}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(a.publishedAt).toLocaleString('tr-TR')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 1 — Current focus (wide) */}
              <section className="lg:col-span-8 rounded-2xl bg-white border border-indigo-100 shadow-sm p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">Bu haftanın odağı</h2>
                    <p className="text-gray-700 mt-2 leading-relaxed">{weekFocus}</p>
                    {primaryPath && (
                      <p className="text-sm text-indigo-600 mt-2 font-medium">
                        Aktif: {primaryPath.title} — %{primaryPath.progress}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* 6 — Streak */}
              <section className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                  <Flame className="w-6 h-6" />
                  Seri
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{streak}</p>
                <p className="text-sm text-gray-600 mt-1">gün üst üste çalışma (bugünkü istatistik)</p>
              </section>

              {/* 2 — Global progress */}
              <section className="lg:col-span-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  Genel ilerleme
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">TYT / ana yol</span>
                      <span className="font-medium text-gray-900">{tytProgress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all"
                        style={{ width: `${Math.min(tytProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Genel program (ortalama)</span>
                      <span className="font-medium text-gray-900">{globalAvg}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                        style={{ width: `${Math.min(globalAvg, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3 — Task tracker */}
              <section className="lg:col-span-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <CalendarClock className="w-5 h-5 text-blue-600" />
                  Görev takibi
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  {showDemoTasks
                    ? 'Örnek liste (DATABASE_URL yok veya migration henüz yok).'
                    : tasksSource === 'neon'
                      ? 'Öğretmen ataması veya kendi eklediğin görevler (Neon).'
                      : tasksSource === 'error'
                        ? 'Görev API’sine ulaşılamadı; aşağıdaki kontrolleri deploy sonrası tekrar dene.'
                        : 'Sunucu görev listesi.'}
                </p>

                {showDemoTasks ? (
                  <ul className="space-y-3">
                    {DEMO_TASKS.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{t.type}</p>
                        </div>
                        <span className="text-xs text-blue-600 whitespace-nowrap">{t.dueLabel}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <ul className="space-y-3">
                      {sortedApiTasks.length === 0 ? (
                        <li className="text-sm text-gray-600 py-2">Henüz görev yok. Aşağıdan ekleyebilirsin.</li>
                      ) : (
                        sortedApiTasks.map((t) => (
                          <li
                            key={t.id}
                            className={`flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 ${
                              t.status === 'done' ? 'opacity-70' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={t.status === 'done'}
                              disabled={taskBusyId === t.id}
                              onChange={() => handleToggleTask(t)}
                              aria-label={t.status === 'done' ? 'Görevi aç' : 'Tamamlandı işaretle'}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium text-gray-900 ${
                                  t.status === 'done' ? 'line-through' : ''
                                }`}
                              >
                                {t.title}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {t.taskType}
                                {t.assignedByUserId != null ? ' · öğretmen' : ' · kişisel'}
                              </p>
                            </div>
                            <span className="text-xs text-blue-600 whitespace-nowrap">
                              {formatDueLabel(t.dueAt)}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>

                    {tasksSource === 'neon' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <p className="text-xs font-medium text-gray-700">Kişisel görev ekle</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Başlık"
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          />
                          <input
                            type="datetime-local"
                            value={newTaskDue}
                            onChange={(e) => setNewTaskDue(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={savingTask || !newTaskTitle.trim()}
                            onClick={() => void handleAddPersonalTask()}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2"
                          >
                            {savingTask ? '…' : 'Ekle'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* 4 — AI / öneri */}
              <section className="lg:col-span-6 rounded-2xl border border-violet-100 shadow-sm p-6 bg-gradient-to-br from-white to-violet-50/50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Akıllı öneri
                </h2>
                <p className="text-sm font-medium text-violet-800">{aiHint.title}</p>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{aiHint.body}</p>
              </section>

              {/* 5 — Quick resume */}
              <section className="lg:col-span-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-6 flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <PlayCircle className="w-6 h-6 text-indigo-600" />
                  Kaldığın yerden devam
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Son bıraktığın öğrenme yoluna git — retention için tek tık.
                </p>
                <button
                  type="button"
                  disabled={!resumePathId}
                  onClick={() => resumePathId && setLocation(`/paths/${resumePathId}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3 px-4 transition"
                >
                  <PlayCircle className="w-5 h-5" />
                  {resumePathId ? 'Derse dön' : 'Öğrenme yolu seç'}
                </button>
              </section>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
