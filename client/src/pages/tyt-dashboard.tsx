import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  FileText,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
  User,
  Brain,
  Trophy,
  Flame,
  Users,
  PlayCircle,
  PlusCircle
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { StatCard } from "@/components/dashboard/stat-card";
import ModernNavigation from "@/components/layout/modern-navigation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BilingualText } from "@/components/ui/bilingual-text";
import PageWrapper from "@/components/layout/page-wrapper";
import CurriculumTree from "@/components/curriculum/curriculum-tree";
import AIPlanGenerator from "@/components/curriculum/ai-plan-generator";
import type { TytStudentProfile, TytSubject, TytTrialExam, DailyStudyTask } from "@/types/tyt";
import { getLocalDateString } from "@/lib/date-utils";

// Study Stats Interface (not in shared schema yet)
interface TytStudyStats {
  totalStudyTime: number;
  completedTasks: number;
  averageNetScore: number;
  subjectProgress: Array<{ subject: string; progress: number; timeSpent: number }>;
  streaks: Array<{ type: string; current: number; longest: number }>;
}

export default function TytDashboard() {
  const { language, t } = useLanguage();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Determine active tab and creation mode based on current route
  const getTabFromRoute = () => {
    if (location === '/tyt/tasks/new') return 'tasks';
    if (location === '/tyt/trials/new') return 'trials';
    if (location === '/tyt/profile-setup') return 'overview';
    return 'overview';
  };
  
  const isCreationMode = location === '/tyt/tasks/new' || location === '/tyt/trials/new';
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'trials' | 'tasks' | 'curriculum' | 'ai-plan'>(getTabFromRoute());
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getTabFromRoute());
  }, [location]);

  // Fetch TYT Profile
  const { data: tytProfile, isLoading: profileLoading } = useQuery<TytStudentProfile | null>({
    queryKey: ['/api/tyt/profile'],
    queryFn: async () => {
      const response = await fetch('/api/tyt/profile');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch TYT profile');
      return response.json();
    }
  });

  // Fetch TYT Subjects
  const { data: tytSubjects = [] } = useQuery<TytSubject[]>({
    queryKey: ['/api/tyt/subjects'],
    queryFn: async () => {
      const response = await fetch('/api/tyt/subjects');
      if (!response.ok) throw new Error('Failed to fetch TYT subjects');
      return response.json();
    }
  });

  // Fetch Recent Trial Exams
  const { data: recentTrials = [] } = useQuery<TytTrialExam[]>({
    queryKey: ['/api/tyt/trials'],
    queryFn: async () => {
      const response = await fetch('/api/tyt/trials');
      if (!response.ok) throw new Error('Failed to fetch trial exams');
      return response.json();
    },
    enabled: !!tytProfile
  });

  // Fetch Today's Tasks
  const { data: todayTasks = [] } = useQuery<DailyStudyTask[]>({
    queryKey: ['/api/tyt/tasks', { date: getLocalDateString() }],
    queryFn: async () => {
      const today = getLocalDateString();
      const response = await fetch(`/api/tyt/tasks?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch daily tasks');
      return response.json();
    },
    enabled: !!tytProfile
  });

  // Fetch TYT Study Stats
  const { data: studyStats } = useQuery<TytStudyStats>({
    queryKey: ['/api/tyt/stats', { timeframe: 'weekly' }],
    queryFn: async () => {
      const response = await fetch('/api/tyt/stats?timeframe=weekly');
      if (!response.ok) throw new Error('Failed to fetch study stats');
      return response.json();
    },
    enabled: !!tytProfile
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, actualDuration }: { taskId: number; actualDuration?: number }) => {
      return apiRequest('POST', `/api/tyt/tasks/${taskId}/complete`, { actualDuration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tyt/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tyt/stats'] });
      toast({
        title: language === 'tr' ? 'Görev Tamamlandı' : 'Task Completed',
        description: language === 'tr' ? 'Tebrikler! Görevinizi başarıyla tamamladınız.' : 'Congratulations! You have successfully completed the task.'
      });
    }
  });

  const handleCompleteTask = (taskId: number) => {
    completeTaskMutation.mutate({ taskId });
  };

  // If no profile exists, show setup prompt
  if (!profileLoading && !tytProfile) {
    return (
      <PageWrapper 
        currentPage={language === 'tr' ? 'TYT Öğrenci Paneli' : 'TYT Student Dashboard'}
        showBackButton={true}
        backUrl="/"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                <BilingualText 
                  text="TYT Öğrenci Panelinize Hoş Geldiniz – Welcome to Your TYT Student Dashboard" 
                />
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                <BilingualText 
                  text="TYT sınavına hazırlık sürecinizi organize etmek ve ilerlemenizi takip etmek için önce öğrenci profilinizi oluşturun. – Create your student profile first to organize your TYT exam preparation process and track your progress." 
                />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              <Card className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">
                  <BilingualText text="Ders Takibi – Subject Tracking" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <BilingualText text="Konularınızı organize edin – Organize your topics" />
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">
                  <BilingualText text="Deneme Takibi – Trial Tracking" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <BilingualText text="Net skorlarınızı izleyin – Track your net scores" />
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">
                  <BilingualText text="Günlük Görevler – Daily Tasks" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <BilingualText text="Çalışma planınızı takip edin – Follow your study plan" />
                </p>
              </Card>
            </div>

            <div className="space-x-4">
              <Button 
                size="lg" 
                onClick={() => setLocation('/tyt/profile-setup')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <User className="h-5 w-5 mr-2" />
                <BilingualText text="Profil Oluştur – Create Profile" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLocation('/study-planner')}
              >
                <BilingualText text="Genel Planlayıcı – General Planner" />
              </Button>
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  const completedTasksToday = todayTasks.filter(task => task.isCompleted).length;
  const totalTasksToday = todayTasks.length;
  const completionRate = totalTasksToday > 0 ? (completedTasksToday / totalTasksToday) * 100 : 0;

  const lastTrialScore = recentTrials.length > 0 ? recentTrials[0].netScore : 0;
  const studyStreak = studyStats?.streaks.find(s => s.type === 'daily')?.current || 0;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <ModernNavigation 
          pageTitle={language === 'tr' ? 'TYT Öğrenci Paneli' : 'TYT Student Dashboard'} 
          currentPage="tytDashboard" 
        />
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <BilingualText 
                text={`Merhaba, ${user?.displayName}! – Hello, ${user?.displayName}!`} 
              />
            </h1>
            <p className="text-muted-foreground">
              <BilingualText 
                text="TYT sınavına hazırlığınızı burada takip edin – Track your TYT exam preparation here" 
              />
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/tyt/profile-setup')}>
              <Settings className="h-4 w-4 mr-2" />
              <BilingualText text="Profil – Profile" />
            </Button>
            <Button onClick={() => setLocation('/tyt/tasks/new')}>
              <Plus className="h-4 w-4 mr-2" />
              <BilingualText text="Yeni Görev – New Task" />
            </Button>
          </div>
        </motion.div>

        {/* Key Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            icon={Target}
            title={language === 'tr' ? 'Hedef TYT Puanı' : 'Target TYT Score'}
            value={tytProfile?.targetTytScore || 0}
            color="primary"
          />
          
          <StatCard
            icon={BarChart3}
            title={language === 'tr' ? 'Son Deneme Neti' : 'Last Trial Net'}
            value={lastTrialScore}
            color="success"
          />
          
          <StatCard
            icon={CheckCircle2}
            title={language === 'tr' ? 'Bugünkü Görevler' : 'Today\'s Tasks'}
            value={`${completedTasksToday}/${totalTasksToday}`}
            color="warning"
          />
          
          <StatCard
            icon={Flame}
            title={language === 'tr' ? 'Çalışma Serisi' : 'Study Streak'}
            value={`${studyStreak} ${language === 'tr' ? 'gün' : 'days'}`}
            color="secondary"
          />
        </motion.div>

        {/* Creation Mode Banner */}
        {isCreationMode && (
          <motion.div
            className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {location === '/tyt/tasks/new' && (
                    <BilingualText text="Yeni Görev Ekleme Modu – New Task Creation Mode" />
                  )}
                  {location === '/tyt/trials/new' && (
                    <BilingualText text="Yeni Deneme Sınavı Ekleme Modu – New Trial Exam Creation Mode" />
                  )}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <BilingualText text="İlgili sekmeye yönlendirildiniz – You've been directed to the relevant tab" />
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <BilingualText text="Özet – Overview" />
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <BilingualText text="Dersler – Subjects" />
              </TabsTrigger>
              <TabsTrigger value="trials" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <BilingualText text="Denemeler – Trials" />
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <BilingualText text="Görevler – Tasks" />
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <BilingualText text="Müfredat – Curriculum" />
              </TabsTrigger>
              <TabsTrigger value="ai-plan" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <BilingualText text="AI Plan – AI Plan" />
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Welcome Section with Clear Metrics */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <BilingualText 
                          text={`Hoş geldin, ${user?.displayName || 'Öğrenci'}! 👋 – Welcome, ${user?.displayName || 'Student'}! 👋`} 
                        />
                      </CardTitle>
                      <CardDescription className="text-base">
                        <BilingualText 
                          text="Bugün için hazırlanmış çalışma planın seni hedefine yaklaştırıyor. – Today's prepared study plan brings you closer to your goal." 
                        />
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {tytProfile?.targetExamDate 
                              ? Math.ceil((new Date(tytProfile.targetExamDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                              : 142}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <BilingualText text="Sınava Kalan Gün – Days Until Exam" />
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {studyStreak}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <BilingualText text="Bu Hafta Çalışılan Gün – Days Studied This Week" />
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Math.round((studyStats?.totalStudyTime || 0) / 60)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <BilingualText text="Toplam Çalışma Saati – Total Study Hours" />
                            <span className="text-green-600 dark:text-green-400 ml-1">+12%</span>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {studyStats?.completedTasks || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <BilingualText text="Tamamlanan Konular – Completed Topics" />
                            <span className="text-green-600 dark:text-green-400 ml-1">+8</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Progress Overview */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            <BilingualText text="Haftalık İlerleme – Weekly Progress" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span>
                                <BilingualText text="Çalışma Süresi – Study Time" />
                              </span>
                              <span className="font-semibold">
                                {Math.round((studyStats?.totalStudyTime || 0) / 60)} {language === 'tr' ? 'saat' : 'hours'}
                              </span>
                            </div>
                            <Progress value={Math.min((studyStats?.totalStudyTime || 0) / 60 / 40 * 100, 100)} />
                            
                            <div className="flex items-center justify-between">
                              <span>
                                <BilingualText text="Tamamlanan Görev – Completed Tasks" />
                              </span>
                              <span className="font-semibold">{studyStats?.completedTasks || 0}</span>
                            </div>
                            <Progress value={Math.min((studyStats?.completedTasks || 0) / 50 * 100, 100)} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          <BilingualText text="Hızlı İşlemler – Quick Actions" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button 
                          className="w-full justify-start" 
                          variant="ghost"
                          onClick={() => setLocation('/tyt/trials/new')}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <BilingualText text="Deneme Sınavı Ekle – Add Trial Exam" />
                        </Button>
                        
                        <Button 
                          className="w-full justify-start" 
                          variant="ghost"
                          onClick={() => setLocation('/tyt/subjects')}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          <BilingualText text="Konu Takibi – Topic Tracking" />
                        </Button>
                        
                        <Button 
                          className="w-full justify-start" 
                          variant="ghost"
                          onClick={() => setLocation('/tyt/analytics')}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          <BilingualText text="Detaylı Analiz – Detailed Analytics" />
                        </Button>
                        
                        <Button 
                          className="w-full justify-start" 
                          variant="ghost"
                          onClick={() => setLocation('/tyt/study-groups')}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          <BilingualText text="Çalışma Grupları – Study Groups" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Study Plan Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <BilingualText text="Haftalık Çalışma Planı – Weekly Study Plan" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700">
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                                <BilingualText text="Gün – Day" />
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                                <BilingualText text="Süre – Duration" />
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                                <BilingualText text="Dersler / Aktivite – Subjects / Activity" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { day: language === 'tr' ? 'Pazartesi' : 'Monday', hours: 4, subjects: language === 'tr' ? 'Matematik, Fizik' : 'Mathematics, Physics' },
                              { day: language === 'tr' ? 'Salı' : 'Tuesday', hours: 3, subjects: language === 'tr' ? 'Türkçe, Tarih' : 'Turkish, History' },
                              { day: language === 'tr' ? 'Çarşamba' : 'Wednesday', hours: 4, subjects: language === 'tr' ? 'Kimya, Biyoloji' : 'Chemistry, Biology' },
                              { day: language === 'tr' ? 'Perşembe' : 'Thursday', hours: 4, subjects: language === 'tr' ? 'Matematik, Coğrafya' : 'Mathematics, Geography' },
                              { day: language === 'tr' ? 'Cuma' : 'Friday', hours: 3, subjects: language === 'tr' ? 'Edebiyat, Felsefe' : 'Literature, Philosophy' },
                              { day: language === 'tr' ? 'Cumartesi' : 'Saturday', hours: 5, subjects: language === 'tr' ? 'Genel Tekrar, Deneme' : 'General Review, Practice Test' },
                              { day: language === 'tr' ? 'Pazar' : 'Sunday', hours: 1, subjects: language === 'tr' ? 'Dinlenme, Planlama' : 'Rest, Planning' },
                            ].map((plan, index) => (
                              <tr 
                                key={index} 
                                className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">{plan.day}</td>
                                <td className="py-3 px-4">{plan.hours} {language === 'tr' ? 'saat' : 'hours'}</td>
                                <td className="py-3 px-4">{plan.subjects}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <span>
                          <BilingualText text="Toplam Haftalık Süre – Total Weekly Duration" />: <strong className="text-gray-900 dark:text-white">23 {language === 'tr' ? 'saat' : 'hours'}</strong>
                        </span>
                        <span>
                          <BilingualText text="Tamamlanan (bu hafta) – Completed (this week)" />: <strong className="text-green-600 dark:text-green-400">8 {language === 'tr' ? 'saat' : 'hours'}</strong>
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subject-Based Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <BilingualText text="Ders Bazında İlerleme – Subject-Based Progress" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {tytSubjects.slice(0, 4).map((subject) => {
                          const progress = studyStats?.subjectProgress?.find(p => p.subject === subject.displayName)?.progress || 0;
                          return (
                            <div key={subject.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{subject.displayName}</span>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round((studyStats?.subjectProgress?.find(p => p.subject === subject.displayName)?.timeSpent || 0) / 60)} {language === 'tr' ? 'saat çalışıldı' : 'hours studied'}
                              </div>
                            </div>
                          );
                        })}
                        {tytSubjects.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>
                              <BilingualText text="Henüz ders verisi yok – No subject data yet" />
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Today's Tasks */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <BilingualText text="Bugünün Görevleri – Today's Tasks" />
                      </CardTitle>
                      <Badge variant="secondary">
                        {completedTasksToday}/{totalTasksToday} 
                        <BilingualText text=" tamamlandı –  completed" />
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {totalTasksToday === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>
                            <BilingualText 
                              text="Bugün için planlanmış görev yok – No tasks scheduled for today" 
                            />
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setLocation('/tyt/tasks/new')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            <BilingualText text="Görev Ekle – Add Task" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {todayTasks.slice(0, 3).map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                task.isCompleted 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={task.isCompleted || completeTaskMutation.isPending}
                                onClick={() => handleCompleteTask(task.id)}
                                className="p-0 h-auto"
                              >
                                <CheckCircle2 
                                  className={`h-5 w-5 ${
                                    task.isCompleted 
                                      ? 'text-green-600' 
                                      : 'text-gray-400 hover:text-green-600'
                                  }`} 
                                />
                              </Button>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${task.isCompleted ? 'line-through text-green-700' : ''}`}>
                                  {task.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {task.estimatedDuration} {language === 'tr' ? 'dakika' : 'minutes'} • {task.taskType}
                                </p>
                              </div>
                              
                              <Badge 
                                variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {language === 'tr' 
                                  ? task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'
                                  : task.priority
                                }
                              </Badge>
                            </motion.div>
                          ))}
                          
                          {todayTasks.length > 3 && (
                            <Button 
                              variant="outline" 
                              className="w-full mt-4"
                              onClick={() => setActiveTab('tasks')}
                            >
                              <BilingualText 
                                text={`${todayTasks.length - 3} görev daha görüntüle`} 
                                en={`View ${todayTasks.length - 3} more tasks`} 
                              />
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Subjects Tab */}
                <TabsContent value="subjects" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      <BilingualText text="TYT Dersleri – TYT Subjects" />
                    </h2>
                    <Button onClick={() => setLocation('/tyt/subjects')}>
                      <BilingualText text="Detaya Git – View Details" />
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tytSubjects.map((subject, index) => (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{subject.displayName}</CardTitle>
                              <Badge variant="secondary">{subject.questionCount} soru</Badge>
                            </div>
                            <CardDescription>{subject.code}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>
                                  <BilingualText text="İlerleme – Progress" />
                                </span>
                                <span className="font-medium">
                                  {studyStats?.subjectProgress?.find(p => p.subject === subject.displayName)?.progress || 0}%
                                </span>
                              </div>
                              <Progress 
                                value={studyStats?.subjectProgress?.find(p => p.subject === subject.displayName)?.progress || 0} 
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground">
                                {Math.round((studyStats?.subjectProgress?.find(p => p.subject === subject.displayName)?.timeSpent || 0) / 60)} saat çalışıldı
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Trials Tab */}
                <TabsContent value="trials" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      <BilingualText text="Deneme Sınavları – Trial Exams" />
                    </h2>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setLocation('/tyt/trials')}>
                        <BilingualText text="Tümünü Gör – View All" />
                      </Button>
                      <Button onClick={() => setLocation('/tyt/trials/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        <BilingualText text="Yeni Deneme – New Trial" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentTrials.slice(0, 4).map((trial, index) => (
                      <motion.div
                        key={trial.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{trial.examType}</CardTitle>
                                <CardDescription>
                                  {new Date(trial.examDate).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="text-lg font-semibold">
                                {trial.netScore} net
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                              <div>
                                <p className="text-2xl font-bold text-green-600">{trial.correctAnswers}</p>
                                <p className="text-muted-foreground">
                                  <BilingualText text="Doğru – Correct" />
                                </p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-red-600">{trial.wrongAnswers}</p>
                                <p className="text-muted-foreground">
                                  <BilingualText text="Yanlış – Wrong" />
                                </p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-600">{trial.emptyAnswers}</p>
                                <p className="text-muted-foreground">
                                  <BilingualText text="Boş – Empty" />
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {recentTrials.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          <BilingualText text="Henüz deneme sınavı yok – No trial exams yet" />
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          <BilingualText 
                            text="İlk deneme sınavınızı ekleyerek ilerlemenizi takip etmeye başlayın – Add your first trial exam to start tracking your progress" 
                          />
                        </p>
                        <Button onClick={() => setLocation('/tyt/trials/new')}>
                          <Plus className="h-4 w-4 mr-2" />
                          <BilingualText text="İlk Denemeni Ekle – Add Your First Trial" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      <BilingualText text="Günlük Görevler – Daily Tasks" />
                    </h2>
                    <Button onClick={() => setLocation('/tyt/tasks/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      <BilingualText text="Görev Ekle – Add Task" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {todayTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={task.isCompleted ? 'opacity-75' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={task.isCompleted || completeTaskMutation.isPending}
                                onClick={() => handleCompleteTask(task.id)}
                                className="p-0 h-auto"
                              >
                                <CheckCircle2 
                                  className={`h-6 w-6 ${
                                    task.isCompleted 
                                      ? 'text-green-600' 
                                      : 'text-gray-400 hover:text-green-600'
                                  }`} 
                                />
                              </Button>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-semibold ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                  </h3>
                                  <Badge 
                                    variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {language === 'tr' 
                                      ? task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'
                                      : task.priority
                                    }
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.estimatedDuration} {language === 'tr' ? 'dakika' : 'minutes'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {task.taskType}
                                  </div>
                                  {task.scheduledTime && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {task.scheduledTime}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {task.isCompleted && task.completedAt && (
                                <div className="text-right text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1 mb-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <BilingualText text="Tamamlandı – Completed" />
                                  </div>
                                  <div>
                                    {new Date(task.completedAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {todayTasks.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          <BilingualText text="Bugün için görev yok – No tasks for today" />
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          <BilingualText 
                            text="Çalışma planınızı oluşturmak için görev ekleyin – Add tasks to create your study plan" 
                          />
                        </p>
                        <Button onClick={() => setLocation('/tyt/tasks/new')}>
                          <Plus className="h-4 w-4 mr-2" />
                          <BilingualText text="İlk Görevini Ekle – Add Your First Task" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Curriculum Tab */}
                <TabsContent value="curriculum" className="space-y-6">
                  <CurriculumTree />
                </TabsContent>

                {/* AI Plan Tab */}
                <TabsContent value="ai-plan" className="space-y-6">
                  <AIPlanGenerator />
                </TabsContent>

              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
      </div>
      </div>
    </AuthGuard>
  );
}