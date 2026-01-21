import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BilingualText } from '@/components/ui/bilingual-text';
import { BarChart3, TrendingUp, Users, BookOpen, Clock, Award } from 'lucide-react';

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalSubjects: number;
  totalTopics: number;
  totalStudyHours: number;
  avgStudyHoursPerUser: number;
  topSubjects: Array<{ subject: string; hours: number }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState<'tyt' | 'ayt' | 'yks'>('tyt');

  useEffect(() => {
    loadAnalytics();
  }, [examType]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      // Kullanıcı istatistikleri
      let totalUsers = 0;
      let activeUsers = 0;
      let totalStudyHours = 0;

      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data());
        
        totalUsers = users.length;
        activeUsers = users.filter(u => u.isActive).length;
        totalStudyHours = users.reduce((sum, u) => sum + (u.totalStudyHours || u.studyHours || 0), 0);
      } catch (error) {
        console.log('Users collection not found yet:', error);
      }
      
      // Müfredat istatistikleri
      let totalSubjects = 0;
      let totalTopics = 0;

      try {
        const subjectsSnapshot = await getDocs(collection(db, `curriculum/${examType}/subjects`));
        const subjects = subjectsSnapshot.docs;
        totalSubjects = subjects.length;
        
        for (const subjectDoc of subjects) {
          try {
            const topicsSnapshot = await getDocs(
              collection(db, `curriculum/${examType}/subjects/${subjectDoc.id}/topics`)
            );
            totalTopics += topicsSnapshot.size;
          } catch (error) {
            console.log('Topics not found for subject:', subjectDoc.id);
          }
        }
      } catch (error) {
        console.log('Curriculum collection not found yet:', error);
      }
      
      setAnalytics({
        totalUsers,
        activeUsers,
        totalSubjects,
        totalTopics,
        totalStudyHours,
        avgStudyHoursPerUser: totalUsers > 0 ? totalStudyHours / totalUsers : 0,
        topSubjects: [] // İleride eklenebilir
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <BilingualText text="Platform Analitikleri – Platform Analytics" />
            </CardTitle>
            
            {/* Exam Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setExamType('tyt')}
                className={`px-3 py-1 text-sm rounded-md ${
                  examType === 'tyt' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                }`}
              >
                TYT
              </button>
              <button
                onClick={() => setExamType('ayt')}
                className={`px-3 py-1 text-sm rounded-md ${
                  examType === 'ayt' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                }`}
              >
                AYT
              </button>
              <button
                onClick={() => setExamType('yks')}
                className={`px-3 py-1 text-sm rounded-md ${
                  examType === 'yks' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                }`}
              >
                YKS
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Toplam Kullanıcı
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.totalUsers}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {analytics.activeUsers} aktif
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Toplam Ders
                </span>
              </div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {analytics.totalSubjects}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                {analytics.totalTopics} konu
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Toplam Çalışma
                </span>
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {Math.round(analytics.totalStudyHours)}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                saat
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Ortalama / Kullanıcı
                </span>
              </div>
              <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {Math.round(analytics.avgStudyHoursPerUser)}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                saat
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <span className="text-sm font-medium text-pink-900 dark:text-pink-100">
                  Aktif Oran
                </span>
              </div>
              <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                {analytics.totalUsers > 0 
                  ? Math.round((analytics.activeUsers / analytics.totalUsers) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-pink-700 dark:text-pink-300 mt-1">
                kullanıcı
              </div>
            </div>
          </div>

          {/* Growth Indicators */}
          <div className="border-t dark:border-slate-700 pt-6">
            <h3 className="font-semibold mb-4">
              <BilingualText text="Büyüme Göstergeleri – Growth Indicators" />
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Kullanıcı Aktivasyonu
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ 
                        width: `${analytics.totalUsers > 0 
                          ? (analytics.activeUsers / analytics.totalUsers) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {analytics.totalUsers > 0 
                      ? Math.round((analytics.activeUsers / analytics.totalUsers) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Müfredat Oluşturma
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ 
                        width: `${analytics.totalSubjects > 0 ? Math.min((analytics.totalSubjects / 10) * 100, 100) : 0}%` 
                      }} 
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {analytics.totalSubjects} / 10
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Konu Eksiksizliği
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ 
                        width: `${analytics.totalTopics > 0 ? Math.min((analytics.totalTopics / 50) * 100, 100) : 0}%` 
                      }} 
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {analytics.totalTopics} konu
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📊 Hızlı Öngörüler
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              {analytics.totalSubjects === 0 && (
                <li>• Henüz müfredat eklenmemiş. AI ile hızlıca oluşturabilirsiniz.</li>
              )}
              {analytics.totalSubjects > 0 && analytics.totalTopics === 0 && (
                <li>• Dersler mevcut ancak konular eklenmemiş. Konu eklemeye başlayın.</li>
              )}
              {analytics.totalUsers === 0 && (
                <li>• Henüz kullanıcı kaydı yok. Platform lansmanı için hazırsınız!</li>
              )}
              {analytics.totalUsers > 0 && analytics.activeUsers === 0 && (
                <li>• Kullanıcılar var ancak hiçbiri aktif değil. Aktivasyon e-postaları gönderin.</li>
              )}
              {analytics.totalSubjects >= 4 && analytics.totalTopics >= 20 && (
                <li>✅ Müfredat iyi durumda! {analytics.totalSubjects} ders ve {analytics.totalTopics} konu mevcut.</li>
              )}
              {analytics.activeUsers > 0 && analytics.avgStudyHoursPerUser > 10 && (
                <li>✅ Kullanıcı bağlılığı yüksek! Ortalama {Math.round(analytics.avgStudyHoursPerUser)} saat çalışma.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
