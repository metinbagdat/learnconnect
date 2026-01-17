import React from 'react'

export default function ProgressChart() {
  const progressData = [
    { subject: 'Matematik', progress: 85, target: 100 },
    { subject: 'Türkçe', progress: 75, target: 90 },
    { subject: 'Fizik', progress: 60, target: 85 },
    { subject: 'Kimya', progress: 70, target: 80 },
    { subject: 'Biyoloji', progress: 65, target: 80 },
    { subject: 'Tarih', progress: 80, target: 85 }
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ders Bazında İlerleme</h3>
      
      <div className="space-y-4">
        {progressData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{item.subject}</span>
              <span className="text-gray-600">{item.progress}% / {item.target}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${item.progress}%` }}
              ></div>
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
