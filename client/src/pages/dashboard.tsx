import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Clock, Flame, Target, BookOpen, Plus, TrendingUp, Award } from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';
import { StatCard } from '@/components/dashboard/stat-card';
import LiveStatsSection from '@/components/home/live-stats-section';
import { getUserId } from '@/lib/user-utils';
import type { Note } from '@/services/notesService';
import type { StudyStat } from '@/services/studyStatsService';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  progress?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStat | null>(null);
  const [activePaths, setActivePaths] = useState<LearningPath[]>([]);
  const [suggestedPath, setSuggestedPath] = useState<LearningPath | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteTags, setQuickNoteTags] = useState('');

  // Fetch recent notes
  useEffect(() => {
    if (!user?.username && !user?.id) return;

    const fetchNotes = async () => {
      try {
        const userId = getUserId(user);
        const { getUserNotes } = await import('@/services/notesService');
        const notes = await getUserNotes(userId, 5);
        setRecentNotes(notes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [user]);

  // Fetch study stats via studyStatsService
  useEffect(() => {
    if (!user?.id && !user?.username) return;

    const fetchStats = async () => {
      try {
        const userId = getUserId(user);
        const { getTodayStats } = await import('@/services/studyStatsService');
        const stat = await getTodayStats(userId);
        setStudyStats(stat);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStudyStats(null);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch active learning paths
  useEffect(() => {
    if (!user?.username && !user?.id) return;

    const fetchPaths = async () => {
      try {
        const userId = getUserId(user);
        const { getAllPaths, getUserProgress } = await import('@/services/learningPathsService');
        
        const [paths, progress] = await Promise.all([
          getAllPaths(),
          getUserProgress(userId),
        ]);

        // Get paths with progress > 0, or suggested paths (TYT Math) when none active
        const active = paths
          .filter(path => progress[path.id] && progress[path.id].progressPercent > 0)
          .map(path => ({
            id: path.id,
            title: path.title,
            description: path.description,
            category: path.category,
            progress: progress[path.id].progressPercent,
          }))
          .slice(0, 3); // Show max 3 active paths

        setActivePaths(active);

        // Suggested path when none active (TYT Math)
        if (active.length === 0) {
          const tytPath = paths.find(p => p.id === 'tyt-matematik-30-gun' || p.category === 'TYT');
          setSuggestedPath(tytPath ? { id: tytPath.id, title: tytPath.title, description: tytPath.description, category: tytPath.category } : null);
        } else {
          setSuggestedPath(null);
        }
      } catch (error) {
        console.error('Error fetching active paths:', error);
      }
    };

    fetchPaths();
  }, [user]);

  const handleQuickNote = async () => {
    if (!quickNoteText.trim() || (!user?.username && !user?.id)) return;

    try {
      const userId = getUserId(user);
      const { createNote, getUserNotes } = await import('@/services/notesService');
      
      const tags = (quickNoteTags || '').split(',').map(t => t.trim()).filter(t => t.length > 0);
      const title = quickNoteText.substring(0, 50) || 'Yeni Not';

      await createNote(userId, title, quickNoteText, tags);

      setQuickNoteText('');
      setQuickNoteTags('');
      
      // Refresh notes
      const notes = await getUserNotes(userId, 5);
      setRecentNotes(notes);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const todayMinutes = studyStats?.minutes || 0;
  const streak = studyStats?.streakCount || 0;
  const todayGoal = 60;
  const progressPct = Math.min((todayMinutes / todayGoal) * 100, 100);

  // Dinamik hedef: aktif yol varsa onu, yoksa önerilen yol
  const dynamicGoal = activePaths[0]
    ? `${activePaths[0].title} – Devam et`
    : suggestedPath
      ? `${suggestedPath.title} – Başla`
      : "Öğrenme yoluna başla";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <MainNavbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Merhaba, {user?.displayName || user?.username}! 👋
            </h1>
            <p className="text-gray-600">
              Bugünkü hedefin: <span className="font-semibold text-blue-600">{dynamicGoal}</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Bugün Çalışılan"
              value={`${todayMinutes} dk`}
              description={`Hedef: ${todayGoal} dk`}
              icon={Clock}
              progress={progressPct}
            />
            <StatCard
              title="Seri"
              value={`🔥 ${streak}`}
              description="gün üst üste çalıştın"
              icon={Flame}
            />
            <StatCard
              title="Aktif Yollar"
              value={activePaths.length}
              description="öğrenme yolunda ilerliyorsun"
              icon={Target}
            />
          </div>

          <LiveStatsSection context="dashboard" variant="minimal" showRoutine={false} refreshMs={20000} scope="all" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Active Paths */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Learning Paths */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Devam Eden Öğrenme Yolları</h2>
                  <button
                    onClick={() => setLocation('/paths')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Tümünü Gör →
                  </button>
                </div>
                <div className="space-y-4">
                  {activePaths.length > 0 ? (
                    activePaths.map((path) => (
                      <div
                        key={path.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setLocation(`/paths/${path.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{path.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{path.description}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                            {path.category}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">İlerleme</span>
                            <span className="text-sm font-medium text-gray-900">{path.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${path.progress}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/paths/${path.id}`);
                          }}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                          Devam Et <TrendingUp className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    ))
                  ) : suggestedPath ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Henüz aktif öğrenme yolun yok</p>
                      <p className="text-sm mt-2 text-gray-600">Önerilen: {suggestedPath.title}</p>
                      <div className="flex gap-3 justify-center mt-4">
                        <button
                          onClick={() => setLocation(`/paths/${suggestedPath.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Başla
                        </button>
                        <button
                          onClick={() => setLocation('/paths')}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Tüm Yollar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Henüz aktif öğrenme yolun yok</p>
                      <button
                        onClick={() => setLocation('/paths')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Yol Keşfet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Recent Notes + Quick Add */}
            <div className="space-y-6">
              {/* Quick Note Add */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hızlı Not Ekle</h2>
                <textarea
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Bugün ne öğrendin?"
                  className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                <input
                  type="text"
                  value={quickNoteTags}
                  onChange={(e) => setQuickNoteTags(e.target.value)}
                  placeholder="#tyt #matematik (virgülle ayır)"
                  className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleQuickNote}
                  disabled={!quickNoteText.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Not Ekle</span>
                </button>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hızlı Erişim</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setLocation('/certificates')}
                    className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition-colors"
                  >
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-gray-900">Sertifikalarım</span>
                  </button>
                </div>
              </div>

              {/* Recent Notes */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Son Notlarım</h2>
                  <button
                    onClick={() => setLocation('/notebook')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Tümünü Gör →
                  </button>
                </div>
                <div className="space-y-3">
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => setLocation(`/notebook?note=${note.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 line-clamp-1 flex-1">{note.title}</h3>
                          {note.relatedPathId && (
                            <span className="shrink-0 px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">
                              Yol
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {note.tags?.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="mb-3">Henüz notun yok</p>
                      <button
                        onClick={() => setLocation('/notebook')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        İlk Notunu Oluştur
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
