import React from 'react'

export default function Dashboard({ user }) {
  const stats = [
    { label: 'Toplam Çalışma Saati', value: '48h', change: '+12%' },
    { label: 'Tamamlanan Konular', value: '24', change: '+8' },
    { label: 'Ortalama Başarı', value: '78%', change: '+5%' },
    { label: 'Sınava kalan gün', value: '142', sub: 'Bu hafta 7 gün çalışıldı' }
  ]

  const recentActivities = [
    { subject: 'Matematik', topic: 'Türev', time: '2 saat önce', status: 'completed' },
    { subject: 'Türkçe', topic: 'Paragraf Soruları', time: '4 saat önce', status: 'in-progress' },
    { subject: 'Fizik', topic: 'Optik', time: '1 gün önce', status: 'completed' },
    { subject: 'Tarih', topic: 'İnkılap Tarihi', time: '2 gün önce', status: 'pending' }
  ]

  return (
    <div className="space-y-6">
      {/* Hoş Geldin Mesajı */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Hoş geldin, {user?.name || 'Öğrenci'}! 👋
        </h2>
        <p className="text-gray-600">
          Bugün {user?.profile?.weeklyStudyHours || 20} saatlik çalışma planın hazır. 
          {user?.profile?.targetExam === 'TYT' ? ' TYT' : ' AYT'} hedefine bir adım daha yaklaşıyorsun!
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            {stat.change && <div className="text-xs text-green-600 mt-2">{stat.change}</div>}
            {stat.sub && <div className="text-xs text-blue-600 mt-2">{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* Son Aktiviteler */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Son Aktiviteler</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{activity.subject}</div>
                <div className="text-sm text-gray-600">{activity.topic}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{activity.time}</span>
                <span className={`badge ${
                  activity.status === 'completed' ? 'badge-success' :
                  activity.status === 'in-progress' ? 'badge-warning' : 'badge-info'
                }`}>
                  {activity.status === 'completed' ? 'Tamamlandı' :
                   activity.status === 'in-progress' ? 'Devam Ediyor' : 'Bekliyor'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Hızlı Aksiyonlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-left" title="Yeni çalışma oturumu başlat">
            <span className="block text-xs text-white/80">Oturum</span>
            Yeni Çalışma Oturumu Başlat
          </button>
          <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-left" title="Test çöz">
            <span className="block text-xs text-gray-500 mt-1">Test</span>
            Test Çöz
          </button>
          <button className="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-left" title="İlerleme">
            <span className="block text-xs text-purple-500 mt-1">İstatistik</span>
            İlerlemeyi Görüntüle
          </button>
          <button className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-left" title="Plan güncelle">
            <span className="block text-xs text-green-600 mt-1">Plan</span>
            Planı Güncelle
          </button>
        </div>
      </div>
    </div>
  )
}
