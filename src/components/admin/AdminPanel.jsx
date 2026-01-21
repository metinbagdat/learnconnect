import { useState } from 'react';
import CurriculumManager from './CurriculumManager';
import UserManager from './UserManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import AIStudyPlanTester from './AIStudyPlanTester';

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('curriculum');

  const tabs = [
    { id: 'curriculum', name: 'Müfredat', icon: '📚' },
    { id: 'users', name: 'Kullanıcılar', icon: '👥' },
    { id: 'analytics', name: 'Analitikler', icon: '📊' },
    { id: 'ai', name: 'AI Araçları', icon: '🤖' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'curriculum' && <CurriculumManager />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'ai' && <AIStudyPlanTester />}
      </div>
    </div>
  );
}
