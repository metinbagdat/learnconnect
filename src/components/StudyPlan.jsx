import React from 'react'

export default function StudyPlan() {
  const weeklyPlan = [
    { day: 'Pazartesi', subjects: ['Matematik', 'Fizik'], hours: 4 },
    { day: 'Salı', subjects: ['Türkçe', 'Tarih'], hours: 3 },
    { day: 'Çarşamba', subjects: ['Kimya', 'Biyoloji'], hours: 4 },
    { day: 'Perşembe', subjects: ['Matematik', 'Coğrafya'], hours: 3 },
    { day: 'Cuma', subjects: ['Edebiyat', 'Felsefe'], hours: 3 },
    { day: 'Cumartesi', subjects: ['Genel Tekrar', 'Deneme'], hours: 5 },
    { day: 'Pazar', subjects: ['Dinlenme', 'Planlama'], hours: 1 }
  ]

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long' })

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Haftalık Çalışma Planı</h3>
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full" aria-label="Bugün">
          {today}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">Gün</th>
              <th className="text-left py-2 font-semibold text-gray-700">Saat</th>
              <th className="text-left py-2 font-semibold text-gray-700">Dersler / Aktivite</th>
            </tr>
          </thead>
          <tbody>
            {weeklyPlan.map((day, index) => (
              <tr 
                key={index} 
                className={`border-b border-gray-100 ${
                  day.day.toLowerCase() === today.toLowerCase()
                    ? 'bg-blue-50'
                    : ''
                }`}
              >
                <td className="py-2 font-medium">{day.day}</td>
                <td className="py-2 text-gray-600">{day.hours} saat</td>
                <td className="py-2 text-gray-600">{day.subjects.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 pt-4 border-t space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Toplam Haftalık Saat:</span>
          <span className="font-semibold">23 saat</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tamamlanan (bu hafta):</span>
          <span className="text-green-600 font-semibold">8 saat</span>
        </div>
      </div>
    </div>
  )
}
