import React, { useState, useEffect } from 'react';
import { getCurriculumTree } from '@/services/curriculumService';
import type { CurriculumTree } from '@/types/curriculum';
import { BilingualText } from '@/components/ui/bilingual-text';

export default function CurriculumTree() {
  const [curriculum, setCurriculum] = useState<CurriculumTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCurriculum();
  }, []);

  async function loadCurriculum() {
    try {
      const data = await getCurriculumTree();
      setCurriculum(data);
      
      // İlk dersi genişlet
      if (data.length > 0) {
        setExpandedSubjects({ [data[0].id]: true });
      }
    } catch (error) {
      console.error('Failed to load curriculum:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Müfredat yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">TYT Müfredat Ağacı</h2>
          <p className="text-gray-600">Dersler, konular ve alt konular</p>
        </div>
        <div className="text-sm text-gray-500">
          {curriculum.length} ders, {curriculum.reduce((sum, s) => sum + (s.topics?.length || 0), 0)} konu
        </div>
      </div>

      <div className="space-y-4">
        {curriculum.map((subject) => (
          <div key={subject.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Subject Header */}
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleSubject(subject.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{subject.icon || '📘'}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{subject.title}</h3>
                  <p className="text-sm text-gray-600">{subject.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">{subject.totalTopics || 0} konu</div>
                  <div className="text-xs text-gray-500">{subject.estimatedHours || 0} saat</div>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSubjects[subject.id] ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Topics (if expanded) */}
            {expandedSubjects[subject.id] && subject.topics && (
              <div className="p-4 bg-white border-t">
                <div className="space-y-3">
                  {subject.topics.map((topic) => (
                    <div key={topic.id} className="border-l-2 border-blue-200 pl-4">
                      {/* Topic Header */}
                      <div 
                        className="flex items-center justify-between py-2 cursor-pointer"
                        onClick={() => toggleTopic(topic.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">•</span>
                          <h4 className="font-medium text-gray-800">{topic.name || topic.title}</h4>
                          {topic.difficulty && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              topic.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              topic.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {topic.difficulty === 'easy' ? 'Kolay' :
                               topic.difficulty === 'medium' ? 'Orta' : 'Zor'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{topic.estimatedTime || 45} dk</span>
                          <svg 
                            className={`w-4 h-4 text-gray-400 transform transition-transform ${expandedTopics[topic.id] ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Subtopics (if expanded) */}
                      {expandedTopics[topic.id] && topic.subtopics && topic.subtopics.length > 0 && (
                        <div className="ml-6 mt-2 space-y-2">
                          {topic.subtopics.map((subtopic) => (
                            <div key={subtopic.id} className="flex items-center space-x-2 py-1">
                              <span className="text-gray-400 text-sm">›</span>
                              <span className="text-sm text-gray-700">{subtopic.name || subtopic.title}</span>
                              {subtopic.completed && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Tamamlandı
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No subtopics message */}
                      {expandedTopics[topic.id] && (!topic.subtopics || topic.subtopics.length === 0) && (
                        <div className="ml-6 mt-2 text-sm text-gray-500 italic">
                          Alt konu bulunmuyor
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{curriculum.length}</div>
            <div className="text-sm text-blue-600">Ders</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {curriculum.reduce((sum, s) => sum + (s.topics?.length || 0), 0)}
            </div>
            <div className="text-sm text-green-600">Ana Konu</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {curriculum.reduce((sum, s) => sum + 
                (s.topics?.reduce((tSum, t) => tSum + (t.subtopics?.length || 0), 0) || 0), 0)}
            </div>
            <div className="text-sm text-purple-600">Alt Konu</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">
              {curriculum.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)}s
            </div>
            <div className="text-sm text-yellow-600">Tahmini Süre</div>
          </div>
        </div>
      </div>
    </div>
  );
}
