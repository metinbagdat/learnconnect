import { useState, useEffect } from 'react';
import { db, collection, getDocs } from '@/lib/firebase';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSubjects: 0,
    totalTopics: 0,
    totalStudyHours: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [examType]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Load curriculum
      const curriculumSnapshot = await getDocs(collection(db, 'curriculum'));
      const subjects = curriculumSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Filter by exam type if needed
      const filteredSubjects = examType === 'all' 
        ? subjects 
        : subjects.filter(s => s.examType === examType);

      // Calculate total topics
      const totalTopics = filteredSubjects.reduce((sum, subject) => 
        sum + (subject.topics?.length || 0), 0
      );

      // Calculate recent signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentSignups = users.filter(u => 
        u.createdAt?.toDate() > weekAgo
      ).length;

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive !== false).length,
        totalSubjects: filteredSubjects.length,
        totalTopics,
        totalStudyHours: users.reduce((sum, u) => sum + (u.totalStudyHours || 0), 0),
        recentSignups
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: '👥', color: 'blue' },
    { label: 'Aktif Kullanıcı', value: stats.activeUsers, icon: '✅', color: 'green' },
    { label: 'Toplam Ders', value: stats.totalSubjects, icon: '📚', color: 'purple' },
    { label: 'Toplam Konu', value: stats.totalTopics, icon: '📖', color: 'orange' },
    { label: 'Çalışma Saati', value: Math.round(stats.totalStudyHours), icon: '⏱️', color: 'red' },
    { label: 'Son 7 Gün Kayıt', value: stats.recentSignups, icon: '🆕', color: 'pink' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    pink: 'bg-pink-50 border-pink-200 text-pink-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📊 Analitikler & İstatistikler</h2>
          <p className="text-gray-600">Platform metrikleri ve performans göstergeleri</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Yenile
        </button>
      </div>

      {/* Exam Type Filter */}
      <div className="flex gap-2">
        {['all', 'TYT', 'AYT', 'YKS'].map((type) => (
          <button
            key={type}
            onClick={() => setExamType(type)}
            className={`px-4 py-2 rounded-lg font-medium ${
              examType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? '🌍 Tümü' : type}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={`p-6 border-2 rounded-xl ${colorClasses[card.color]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl">{card.icon}</span>
                <span className="text-3xl font-bold">{card.value}</span>
              </div>
              <p className="text-sm font-medium">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Growth Indicators */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">📈 Büyüme Göstergeleri</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              +{stats.recentSignups}
            </p>
            <p className="text-sm text-gray-600 mt-1">Son 7 Gün Kayıt</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.activeUsers > 0 
                ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
                : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Aktif Kullanıcı Oranı</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalUsers > 0 
                ? Math.round(stats.totalStudyHours / stats.totalUsers) 
                : 0}h
            </p>
            <p className="text-sm text-gray-600 mt-1">Ortalama Çalışma</p>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="font-bold mb-3">ℹ️ Hızlı Bilgiler</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-gray-600">Platform Sağlığı:</span>
            <span className="font-medium text-green-600">✅ Çalışıyor</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">Toplam İçerik:</span>
            <span className="font-medium">{stats.totalSubjects} ders, {stats.totalTopics} konu</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">Kullanıcı Durumu:</span>
            <span className="font-medium">{stats.activeUsers} aktif / {stats.totalUsers} toplam</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
