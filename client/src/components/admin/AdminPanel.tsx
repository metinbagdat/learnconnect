import { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BilingualText } from '@/components/ui/bilingual-text';
import ModernNavigation from '@/components/layout/modern-navigation';
import CurriculumManager from './CurriculumManager';
import CurriculumControlCenter from './curriculum-control/CurriculumControlCenter';
import AICurriculumGenerator from './AICurriculumGenerator';
import UserManager from './UserManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import AIStudyPlanTester from './AIStudyPlanTester';
import { BookOpen, Users, BarChart3, Brain } from 'lucide-react';

export default function AdminPanel() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('curriculum');

  if (location === '/admin/curriculum') {
    return <CurriculumControlCenter />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ModernNavigation 
        pageTitle="Admin Dashboard" 
        currentPage="admin" 
      />
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              <BilingualText 
                text="LearnConnect Admin Dashboard – LearnConnect Admin Dashboard"
              />
            </h1>
            <p className="text-muted-foreground">
              <BilingualText 
                text="Müfredat ve kullanıcı yönetimi – Curriculum and user management"
              />
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="curriculum" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <BilingualText text="Müfredat – Curriculum" />
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <BilingualText text="Kullanıcılar – Users" />
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <BilingualText text="Analitikler – Analytics" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <BilingualText text="AI Asistan – AI Assistant" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="space-y-6">
              <CurriculumManager />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UserManager />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <AICurriculumGenerator />
              <AIStudyPlanTester />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
