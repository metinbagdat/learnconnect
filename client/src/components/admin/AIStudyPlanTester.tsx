import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BilingualText } from '@/components/ui/bilingual-text';
import { Brain, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function AIStudyPlanTester() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  async function generateTestPlan() {
    setLoading(true);
    setError('');
    setPlan(null);
    
    try {
      const response = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfile: {
            name: 'Test Öğrenci',
            targetExam: 'TYT',
            dailyStudyHours: 4,
            targetDays: 120,
            weakSubjects: ['matematik'],
            studyStyle: 'visual',
            currentLevel: 'intermediate'
          },
          curriculum: [
            { id: 'mat', title: 'Matematik', estimatedHours: 80, totalTopics: 15 },
            { id: 'tur', title: 'Türkçe', estimatedHours: 60, totalTopics: 12 },
            { id: 'fen', title: 'Fen Bilimleri', estimatedHours: 50, totalTopics: 10 },
            { id: 'sos', title: 'Sosyal Bilimler', estimatedHours: 40, totalTopics: 8 }
          ],
          preferences: {
            focusWeakAreas: true,
            includeRevisions: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.plan) {
        setPlan(data.plan);
      } else {
        setError('Plan oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
      console.error('AI Plan Error:', err);
      setError(err instanceof Error ? err.message : 'Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <BilingualText text="AI Çalışma Planı Test – AI Study Plan Test" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Test Parametreleri
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Öğrenci: Test Öğrenci</li>
            <li>• Hedef: TYT (120 gün)</li>
            <li>• Günlük: 4 saat çalışma</li>
            <li>• Zayıf Alan: Matematik</li>
            <li>• Öğrenme Stili: Görsel</li>
          </ul>
        </div>

        <Button 
          onClick={generateTestPlan} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <BilingualText text="Plan Oluşturuluyor... – Generating Plan..." />
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              <BilingualText text="Test Planı Oluştur – Generate Test Plan" />
            </>
          )}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              ❌ {error}
            </p>
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            {/* Plan Summary */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  ✅ Plan Başarıyla Oluşturuldu
                </h4>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                >
                  {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-green-700 dark:text-green-300">Öğrenci</div>
                  <div className="font-semibold text-green-900 dark:text-green-100">
                    {plan.studentName}
                  </div>
                </div>
                <div>
                  <div className="text-green-700 dark:text-green-300">Toplam Gün</div>
                  <div className="font-semibold text-green-900 dark:text-green-100">
                    {plan.totalDays} gün
                  </div>
                </div>
                <div>
                  <div className="text-green-700 dark:text-green-300">Günlük Saat</div>
                  <div className="font-semibold text-green-900 dark:text-green-100">
                    {plan.dailyHours} saat
                  </div>
                </div>
                <div>
                  <div className="text-green-700 dark:text-green-300">Toplam Saat</div>
                  <div className="font-semibold text-green-900 dark:text-green-100">
                    {plan.totalHours} saat
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Plan Preview */}
            {expanded && plan.weeklyPlan && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 font-medium border-b dark:border-slate-700">
                  Haftalık Plan Önizlemesi
                </div>
                <div className="divide-y dark:divide-slate-700 max-h-64 overflow-y-auto">
                  {plan.weeklyPlan.slice(0, 7).map((day: any, index: number) => (
                    <div key={index} className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">
                          {day.day} - {day.date}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {day.totalHours} saat
                        </span>
                      </div>
                      <div className="space-y-1">
                        {day.subjects?.map((subject: any, subIdx: number) => (
                          <div key={subIdx} className="text-xs text-gray-600 dark:text-gray-400 ml-3">
                            • {subject.subject} ({subject.hours}s)
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Summary */}
            {expanded && plan.monthlySummary && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 font-medium border-b dark:border-slate-700">
                  Aylık Özet
                </div>
                <div className="p-4 space-y-2">
                  {plan.monthlySummary.map((subject: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{subject.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400">
                          {subject.weeklyHours}s/hafta
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          subject.priority === 'HIGH' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        }`}>
                          {subject.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {expanded && plan.recommendations && plan.recommendations.length > 0 && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  💡 AI Önerileri
                </h4>
                <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                  {plan.recommendations.map((rec: any, index: number) => (
                    <li key={index}>
                      • <strong>{rec.message}</strong> - {rec.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full JSON (Collapsed by default) */}
            <details className="border rounded-lg dark:border-slate-700">
              <summary className="px-4 py-2 bg-gray-50 dark:bg-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 font-medium">
                Tam JSON Görüntüle
              </summary>
              <div className="p-4 bg-gray-900 rounded-b-lg overflow-auto max-h-96">
                <pre className="text-xs text-green-400">
                  {JSON.stringify(plan, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
