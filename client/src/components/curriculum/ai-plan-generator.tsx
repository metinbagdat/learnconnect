import React, { useState } from 'react';
import type { StudentProfile, StudyPlan } from '@/types/curriculum';
import { apiRequest } from '@/lib/queryClient';

export default function AIPlanGenerator() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: 'Ahmet Yılmaz',
    targetExam: 'TYT',
    dailyStudyHours: 4,
    targetDays: 120,
    weakSubjects: ['mathematics', 'science'],
    studyStyle: 'mixed',
    currentLevel: 'intermediate'
  });

  const demoCurriculum = [
    {
      id: 'mathematics',
      title: 'Matematik',
      totalTopics: 25,
      estimatedHours: 120
    },
    {
      id: 'turkish',
      title: 'Türkçe',
      totalTopics: 20,
      estimatedHours: 80
    },
    {
      id: 'science',
      title: 'Fen Bilimleri',
      totalTopics: 35,
      estimatedHours: 100
    },
    {
      id: 'social',
      title: 'Sosyal Bilimler',
      totalTopics: 30,
      estimatedHours: 90
    }
  ];

  const generatePlan = async () => {
    setLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/ai-plan', {
        studentProfile,
        curriculum: demoCurriculum,
        preferences: {
          includeWeekends: true,
          revisionDays: 7,
          examSimulation: true
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPlan(data.plan);
      
      // Haftalık planı Firestore'a kaydet
      if (data.plan && data.success) {
        try {
          await saveWeeklyPlanToFirestore(data.plan);
        } catch (saveError) {
          console.warn('Plan Firestore\'a kaydedilemedi:', saveError);
          // Hata olsa bile plan gösterilmeye devam eder
        }
      }
      
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Plan oluşturulurken hata: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Haftalık planı Firestore'a kaydet ve TYT Tasks'e dönüştür
  async function saveWeeklyPlanToFirestore(plan: StudyPlan) {
    const { db, auth, collections } = await import('@/lib/firebase');
    const { collection, addDoc, doc, setDoc } = await import('firebase/firestore');
    
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn('User not authenticated, skipping Firestore save');
      return;
    }
    
    // Firestore'a kaydet: study_plans/{userId}/weekly_plans/{planId}
    const planId = plan.id || `plan_${Date.now()}`;
    const weeklyPlanRef = doc(db, collections.studyPlans, userId, 'weekly_plans', planId);
    
    await setDoc(weeklyPlanRef, {
      ...plan,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // TYT Tasks'e dönüştür: weeklyPlan → daily_tasks
    if (plan.weeklyPlan && Array.isArray(plan.weeklyPlan)) {
      const tasksToCreate = [];
      
      for (const day of plan.weeklyPlan) {
        if (day.subjects && Array.isArray(day.subjects)) {
          for (const subject of day.subjects) {
            if (subject.topics && Array.isArray(subject.topics)) {
              for (const topic of subject.topics) {
                tasksToCreate.push({
                  title: `${subject.subject}: ${topic.name || 'Konu'}`,
                  description: topic.difficulty || 'Orta',
                  estimatedDuration: topic.estimatedTime || 45,
                  date: day.date,
                  subject: subject.subject,
                  topicId: topic.id,
                  priority: 'medium',
                  isCompleted: false
                });
              }
            }
          }
        }
      }
      
      // TYT Tasks API'ye gönder
      if (tasksToCreate.length > 0) {
        try {
          const tasksResponse = await fetch('/api/tyt/tasks/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: tasksToCreate })
          });
          
          if (tasksResponse.ok) {
            console.log(`✅ ${tasksToCreate.length} görev TYT Tasks'e eklendi`);
          } else {
            console.warn('TYT Tasks batch create failed:', await tasksResponse.text());
          }
        } catch (taskError) {
          console.warn('TYT Tasks batch create error:', taskError);
        }
      }
    }
    
    console.log('✅ Haftalık plan Firestore\'a kaydedildi:', planId);
  }

  const updateProfile = (field: keyof StudentProfile, value: string | number | string[] | undefined) => {
    setStudentProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">AI Çalışma Planı Oluşturucu</h2>
      
      {/* Student Profile Form */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-3">Öğrenci Profili</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
            <input
              type="text"
              value={studentProfile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Günlük Çalışma Saati</label>
            <select
              value={studentProfile.dailyStudyHours}
              onChange={(e) => updateProfile('dailyStudyHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={2}>2 saat</option>
              <option value={3}>3 saat</option>
              <option value={4}>4 saat</option>
              <option value={5}>5 saat</option>
              <option value={6}>6+ saat</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Gün Sayısı</label>
            <input
              type="number"
              value={studentProfile.targetDays}
              onChange={(e) => updateProfile('targetDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="30"
              max="365"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Seviye</label>
            <select
              value={studentProfile.currentLevel}
              onChange={(e) => updateProfile('currentLevel', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">Başlangıç</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İleri</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generatePlan}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI Plan Oluşturuluyor...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-2">🤖</span>
              AI ile Kişiselleştirilmiş Plan Oluştur
            </span>
          )}
        </button>
        <p className="text-sm text-gray-500 text-center mt-2">
          Müfredat ağacına ve profilinize göre kişiselleştirilmiş plan
        </p>
      </div>

      {/* Generated Plan */}
      {plan && (
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Oluşturulan Plan</h3>
            <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
              {plan.id}
            </span>
          </div>
          
          {/* Plan Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{plan.totalDays}</div>
              <div className="text-sm text-blue-600">Toplam Gün</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{plan.totalHours}</div>
              <div className="text-sm text-green-600">Toplam Saat</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{plan.dailyHours}/gün</div>
              <div className="text-sm text-purple-600">Günlük Hedef</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{plan.targetExam}</div>
              <div className="text-sm text-yellow-600">Sınav Hedefi</div>
            </div>
          </div>
          
          {/* Weekly Plan Preview */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3">Haftalık Plan Önizleme</h4>
            <div className="space-y-3">
              {plan.weeklyPlan?.slice(0, 3).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{day.day}</div>
                    <div className="text-sm text-gray-600">{day.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{day.totalHours} saat</div>
                    <div className="text-sm text-gray-600">{day.subjects.length} ders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recommendations */}
          {plan.recommendations && plan.recommendations.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">AI Önerileri</h4>
              <ul className="space-y-2">
                {plan.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">💡</span>
                    <div>
                      <div className="font-medium">{rec.message}</div>
                      <div className="text-sm text-gray-600">{rec.reason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Planı PDF Olarak İndir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
