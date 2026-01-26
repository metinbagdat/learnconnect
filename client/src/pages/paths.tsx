import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Clock, CheckCircle2, ArrowRight, TrendingUp } from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';
import { getAllPaths, getUserProgress, startPath, completeStep, type LearningPath, type UserPathProgress } from '@/services/learningPathsService';

export default function LearningPaths() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserPathProgress>>({});
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if viewing a specific path
  const pathId = location.split('/paths/')[1]?.split('?')[0];

  // Fetch all learning paths
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const fetchedPaths = await getAllPaths();
        setPaths(fetchedPaths);
      } catch (error) {
        console.error('Error fetching paths:', error);
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  // Fetch user progress for all paths
  useEffect(() => {
    if (!user?.username && !user?.id) return;

    const fetchProgress = async () => {
      try {
        const userId = String(user.id || user.username);
        const progressMap = await getUserProgress(userId);
        setUserProgress(progressMap);
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
  }, [user, paths]);

  // Load specific path if pathId in URL
  useEffect(() => {
    if (pathId && paths.length > 0) {
      const path = paths.find(p => p.id === pathId);
      if (path) {
        setSelectedPath(path);
      }
    } else {
      setSelectedPath(null);
    }
  }, [pathId, paths]);

  const handleStartPath = async (pathId: string) => {
    if (!user?.username && !user?.id) return;

    try {
      const userId = String(user.id || user.username);
      await startPath(userId, pathId);
      
      // Refresh progress
      const updatedProgress = await getUserProgress(userId);
      setUserProgress(updatedProgress);
      
      // Navigate to path detail
      setLocation(`/paths/${pathId}`);
    } catch (error) {
      console.error('Error starting path:', error);
      alert('Yol başlatılırken hata oluştu');
    }
  };

  const handleCompleteStep = async (pathId: string, stepId: string) => {
    if (!user?.username && !user?.id) return;

    try {
      const userId = String(user.id || user.username);
      const path = paths.find(p => p.id === pathId);

      if (!path) return;

      await completeStep(userId, pathId, stepId, path.steps.length);

      // Refresh progress
      const updatedProgress = await getUserProgress(userId);
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error completing step:', error);
      alert('Adım tamamlanırken hata oluştu');
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <MainNavbar />
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Path Detail View
  if (selectedPath) {
    const progress = userProgress[selectedPath.id];
    const completedSteps = progress?.completedStepIds || [];
    const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);

    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <MainNavbar />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
            <button
              onClick={() => setLocation('/paths')}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center"
            >
              ← Tüm Yollar
            </button>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedPath.title}</h1>
                  <p className="text-gray-600 mb-4">{selectedPath.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedPath.estimatedDays} gün
                    </span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {selectedPath.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {progress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">İlerleme</span>
                    <span className="text-sm font-bold text-blue-600">{progress.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${progress.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Steps List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Adımlar</h2>
              {selectedPath.steps && selectedPath.steps.length > 0 ? (
                selectedPath.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                      isStepCompleted(step.id)
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isStepCompleted(step.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isStepCompleted(step.id) ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <span className="font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                          {step.description && (
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {step.estimatedMinutes} dk
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                              {step.type === 'lesson' ? 'Ders' : step.type === 'practice' ? 'Pratik' : step.type === 'quiz' ? 'Quiz' : 'Proje'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!isStepCompleted(step.id) && (
                        <button
                          onClick={() => handleCompleteStep(selectedPath.id, step.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Tamamla
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Bu yol için henüz adım tanımlanmamış</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  // Path List View
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <MainNavbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Öğrenme Yolları</h1>
            <p className="text-gray-600">
              Hedeflerinize ulaşmak için yapılandırılmış öğrenme yollarını keşfedin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.length > 0 ? (
              paths.map((path) => {
                const progress = userProgress[path.id];
                return (
                  <div
                    key={path.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/paths/${path.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{path.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {path.estimatedDays} gün
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {path.category}
                      </span>
                    </div>

                    {progress && progress.progressPercent > 0 ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">İlerleme</span>
                          <span className="text-xs font-medium text-blue-600">{progress.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${progress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <span className="text-xs text-gray-500">Henüz başlanmadı</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (progress) {
                          setLocation(`/paths/${path.id}`);
                        } else {
                          handleStartPath(path.id);
                        }
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {progress ? (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          <span>Devam Et</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          <span>Başla</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz öğrenme yolu yok</h3>
                <p className="text-gray-600 mb-6">
                  İlk öğrenme yolu yakında eklenecek. Admin panelinden veya seed script ile oluşturabilirsiniz.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Not:</strong> Öğrenme yollarını oluşturmak için:
                  </p>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Firebase Console → Firestore → learningPaths koleksiyonuna manuel ekleme</li>
                    <li>Admin Panel → AI ile Müfredat Oluştur</li>
                    <li>Seed script kullanma (scripts/seed-tyt-mathematics-path.js)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
