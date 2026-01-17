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
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {today}
        </span>
      </div>
      
      <div className="space-y-3">
        {weeklyPlan.map((day, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              day.day.toLowerCase() === today.toLowerCase() 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="font-medium">{day.day}</div>
              <div className="text-sm text-gray-600">{day.hours} saat</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {day.subjects.join(', ')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Toplam Haftalık Saat:</span>
          <span className="font-semibold">23 saat</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Tamamlanan:</span>
          <span className="text-green-600 font-semibold">8 saat</span>
        </div>
      </div>
    </div>
  )
}
