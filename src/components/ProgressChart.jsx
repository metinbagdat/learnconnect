import React from 'react'

export default function ProgressChart() {
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-600']
  const progressData = [
    { subject: 'Matematik', progress: 75 },
    { subject: 'Türkçe', progress: 65 },
    { subject: 'Fizik', progress: 55 },
    { subject: 'Kimya', progress: 70 },
    { subject: 'Biyoloji', progress: 60 },
    { subject: 'Tarih', progress: 90 }
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ders Bazında İlerleme</h3>
      
      <div className="space-y-4">
        {progressData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{item.subject}</span>
              <span className="text-gray-600 font-medium">{item.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`${colors[index % colors.length]} h-2.5 rounded-full transition-all`}
                style={{ width: `${item.progress}%` }}
                role="progressbar"
                aria-valuenow={item.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
        <div className="flex items-start">
          <div className="text-yellow-600 mr-2">💡</div>
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Öneri:</p>
            <p className="text-yellow-700">Fizik dersine daha fazla zaman ayırmalısın.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
