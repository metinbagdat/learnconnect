import { useState } from 'react';

export default function AIStudyPlanTester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('tyt-matematik');

  const templates = [
    { id: 'tyt-matematik', name: 'TYT Matematik Full Müfredat', icon: '🧮', type: 'curriculum' },
    { id: 'tyt-turkce', name: 'TYT Türkçe Full Müfredat', icon: '📝', type: 'curriculum' },
    { id: 'ayt-matematik', name: 'AYT Matematik Full Müfredat', icon: '📐', type: 'curriculum' },
    { id: 'study-plan', name: 'Kişisel Çalışma Planı', icon: '📅', type: 'plan' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (template.type === 'curriculum') {
        // Simulate AI curriculum generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setResult({
          type: 'curriculum',
          data: {
            message: 'Müfredat başarıyla oluşturuldu!',
            subjects: [
              {
                title: `${template.name}`,
                topics: ['Temel Kavramlar', 'İleri Konular', 'Problemler'],
                estimatedHours: 120
              }
            ],
            note: 'Gerçek AI entegrasyonu için OpenAI API key gereklidir.'
          }
        });
      } else {
        // Simulate study plan generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setResult({
          type: 'plan',
          data: {
            message: 'Çalışma planı oluşturuldu!',
            plan: {
              weeklyHours: 40,
              dailyHours: 6,
              totalWeeks: 20,
              subjects: ['Matematik', 'Türkçe', 'Fen', 'Sosyal']
            }
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        type: 'error',
        data: { message: 'Bir hata oluştu!' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">🤖 AI Araçları & Test</h2>
        <p className="text-gray-600">AI müfredat üretici ve çalışma planı oluşturucu</p>
      </div>

      {/* Template Selector */}
      <div>
        <label className="block text-sm font-medium mb-3">Şablon Seçin</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 border-2 rounded-lg text-left transition ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <p className="font-bold">{template.name}</p>
                  <p className="text-sm text-gray-600">
                    {template.type === 'curriculum' ? 'Müfredat Üret' : 'Plan Üret'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              AI Üretiyor...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>AI ile Üret</span>
            </span>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-6 border-2 rounded-xl ${
          result.type === 'error' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <h3 className="text-lg font-bold mb-3">
            {result.type === 'error' ? '❌ Hata' : '✅ Sonuç'}
          </h3>
          
          <div className="space-y-3">
            <p className="font-medium">{result.data.message}</p>
            
            {result.type === 'curriculum' && result.data.subjects && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <h4 className="font-bold mb-2">Oluşturulan Dersler:</h4>
                {result.data.subjects.map((subject, index) => (
                  <div key={index} className="mb-3 p-3 bg-blue-50 rounded">
                    <p className="font-bold">{subject.title}</p>
                    <p className="text-sm text-gray-600">
                      {subject.topics.length} konu - {subject.estimatedHours} saat
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {subject.topics.join(', ')}
                    </p>
                  </div>
                ))}
                <p className="text-sm text-gray-500 mt-3">{result.data.note}</p>
              </div>
            )}
            
            {result.type === 'plan' && result.data.plan && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <h4 className="font-bold mb-2">Plan Detayları:</h4>
                <ul className="space-y-2 text-sm">
                  <li>📅 <strong>Toplam Süre:</strong> {result.data.plan.totalWeeks} hafta</li>
                  <li>⏱️ <strong>Haftalık:</strong> {result.data.plan.weeklyHours} saat</li>
                  <li>📝 <strong>Günlük:</strong> {result.data.plan.dailyHours} saat</li>
                  <li>📚 <strong>Dersler:</strong> {result.data.plan.subjects.join(', ')}</li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold mb-2">ℹ️ Bilgi</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Bu simüle edilmiş bir AI test aracıdır</li>
          <li>• Gerçek AI entegrasyonu için <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> gereklidir</li>
          <li>• <code className="bg-blue-100 px-1 rounded">api/generate-curriculum.js</code> dosyasında API entegrasyonu yapılabilir</li>
          <li>• Üretilen müfredat Firestore'a otomatik kaydedilebilir</li>
        </ul>
      </div>
    </div>
  );
}
