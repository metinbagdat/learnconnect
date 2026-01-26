import React, { useState, useEffect } from 'react';
import { db, collections, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface SubjectProgress {
  subject: string;
  progress: number;
  completedTopics: number;
  totalTopics: number;
}

export default function ProgressChart() {
  const [progressData, setProgressData] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-600'];

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        // Fallback to demo data
        setProgressData([
          { subject: 'Matematik', progress: 75, completedTopics: 15, totalTopics: 20 },
          { subject: 'Türkçe', progress: 65, completedTopics: 13, totalTopics: 20 },
          { subject: 'Fizik', progress: 55, completedTopics: 11, totalTopics: 20 }
        ]);
        setLoading(false);
        return;
      }

      // Load from user_progress collection
      const progressRef = collection(db, collections.userProgress);
      const q = query(progressRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      // Group by subject
      const subjectMap = new Map<string, { completed: number; total: number }>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.completed && data.subjectId) {
          const subject = data.subjectId;
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, { completed: 0, total: 0 });
          }
          const current = subjectMap.get(subject)!;
          current.completed++;
          current.total++;
        } else if (data.subjectId) {
          const subject = data.subjectId;
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, { completed: 0, total: 0 });
          }
          subjectMap.get(subject)!.total++;
        }
      });

      // Convert to array
      const progress: SubjectProgress[] = [];
      subjectMap.forEach((stats, subject) => {
        progress.push({
          subject,
          progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          completedTopics: stats.completed,
          totalTopics: stats.total
        });
      });

      // If no data, use demo
      if (progress.length === 0) {
        progress.push(
          { subject: 'Matematik', progress: 0, completedTopics: 0, totalTopics: 0 },
          { subject: 'Türkçe', progress: 0, completedTopics: 0, totalTopics: 0 }
        );
      }

      setProgressData(progress);
    } catch (error) {
      console.error('Error loading progress:', error);
      // Fallback to demo data
      setProgressData([
        { subject: 'Matematik', progress: 75, completedTopics: 15, totalTopics: 20 },
        { subject: 'Türkçe', progress: 65, completedTopics: 13, totalTopics: 20 }
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ders Bazında İlerleme</h3>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const averageProgress = progressData.length > 0
    ? Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length)
    : 0;
  const weakestSubject = progressData.length > 0
    ? progressData.reduce((min, item) => item.progress < min.progress ? item : min, progressData[0])
    : null;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ders Bazında İlerleme</h3>
      
      <div className="space-y-4">
        {progressData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{item.subject}</span>
              <span className="text-gray-600 font-medium">
                {item.progress}% ({item.completedTopics}/{item.totalTopics})
              </span>
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
      
      {weakestSubject && weakestSubject.progress < 70 && (
        <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <div className="text-yellow-600 mr-2">💡</div>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Öneri:</p>
              <p className="text-yellow-700">
                {weakestSubject.subject} dersine daha fazla zaman ayırmalısın (%{weakestSubject.progress}).
              </p>
            </div>
          </div>
        </div>
      )}
      
      {progressData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Ortalama İlerleme</span>
            <span className="text-lg font-bold text-gray-800">%{averageProgress}</span>
          </div>
        </div>
      )}
    </div>
  );
}
