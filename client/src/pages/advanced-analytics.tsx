import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ComposedChart
} from "recharts";
import { 
  Loader2, 
  Calendar, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  Activity,
  Brain,
  Target,
  Zap,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Star,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  Download,
  Share,
  Calendar as CalendarIcon,
  MoreVertical
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

// Use the same DateRange type as the component
type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

// Enhanced Analytics Data Types
interface AdvancedAnalytics {
  userProgress: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalLessons: number;
    completedLessons: number;
    totalStudyTime: number;
    averageSessionTime: number;
    currentStreak: number;
    longestStreak: number;
    weeklyGoalProgress: number;
  };
  engagementMetrics: {
    dailyActiveUsers: Array<{ date: string; count: number }>;
    sessionDuration: Array<{ date: string; avgDuration: number; sessions: number }>;
    activityHeatmap: Array<{ hour: number; day: string; intensity: number }>;
    deviceUsage: Array<{ device: string; percentage: number; sessions: number }>;
    featureUsage: Array<{ feature: string; usage: number; growth: number }>;
  };
  learningInsights: {
    strengthAreas: Array<{ subject: string; score: number; trend: 'up' | 'down' | 'stable' }>;
    weakAreas: Array<{ subject: string; score: number; improvementNeeded: number }>;
    learningVelocity: { current: number; target: number; improvement: number };
    adaptiveRecommendations: Array<{ type: string; title: string; priority: 'high' | 'medium' | 'low'; reason: string }>;
    skillProgression: Array<{ skill: string; level: number; progress: number; nextMilestone: string }>;
  };
  performanceAnalytics: {
    assessmentScores: Array<{ date: string; score: number; subject: string; difficulty: string }>;
    improvementTrends: Array<{ metric: string; current: number; previous: number; change: number }>;
    predictionInsights: Array<{ prediction: string; confidence: number; timeframe: string; factors: string[] }>;
    comparativeAnalysis: { userPercentile: number; peerAverage: number; topPerformers: number };
  };
  courseAnalytics: {
    popularCourses: Array<{ title: string; enrollments: number; completionRate: number; rating: number; growth: number }>;
    difficultyAnalysis: Array<{ course: string; perceivedDifficulty: number; actualDifficulty: number; dropoffRate: number }>;
    contentEffectiveness: Array<{ content: string; engagementScore: number; learningOutcome: number; userFeedback: number }>;
    pathAnalysis: Array<{ path: string; successRate: number; avgCompletionTime: number; satisfaction: number }>;
  };
  realTimeMetrics: {
    currentActiveUsers: number;
    todayStats: { sessions: number; completions: number; newSignups: number };
    liveActivity: Array<{ userId: number; action: string; timestamp: string; resource: string }>;
    systemHealth: { responseTime: number; uptime: number; errorRate: number };
  };
}

const COLORS = {
  primary: "#0088FE",
  secondary: "#00C49F", 
  tertiary: "#FFBB28",
  quaternary: "#FF8042",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899"
};

const MotionCard = motion(Card);

export default function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Advanced Analytics Query
  const { data: analytics, isLoading, refetch } = useQuery<AdvancedAnalytics>({
    queryKey: ["/api/analytics/advanced", { 
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
      timeFilter
    }],
    enabled: Boolean(dateRange.from && dateRange.to),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  // Permission check
  if (user?.role !== "admin" && user?.role !== "instructor" && user?.role !== "student") {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">
          {language === 'tr' ? 'Gelişmiş Analiz Panosu' : 'Advanced Analytics Dashboard'}
        </h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>
            {language === 'tr' 
              ? 'Analiz panosuna erişim yetkiniz bulunmamaktadır.'
              : 'You do not have access to the analytics dashboard.'}
          </p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: language === 'tr' ? 'Veriler Güncellendi' : 'Data Refreshed',
      description: language === 'tr' 
        ? 'Analitik veriler başarıyla güncellendi.'
        : 'Analytics data has been successfully refreshed.',
    });
  };

  const exportData = () => {
    // Export functionality would be implemented here
    toast({
      title: language === 'tr' ? 'Veri Dışa Aktarılıyor' : 'Exporting Data',
      description: language === 'tr' 
        ? 'Analitik verileri CSV formatında dışa aktarılıyor...'
        : 'Exporting analytics data to CSV format...',
    });
  };

  const getTranslation = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'overview': { tr: 'Genel Bakış', en: 'Overview' },
      'engagement': { tr: 'Katılım', en: 'Engagement' },
      'learning': { tr: 'Öğrenme', en: 'Learning' },
      'performance': { tr: 'Performans', en: 'Performance' },
      'courses': { tr: 'Kurslar', en: 'Courses' },
      'realtime': { tr: 'Canlı Veriler', en: 'Real-time' },
      'insights': { tr: 'İçgörüler', en: 'Insights' },
      'predictions': { tr: 'Tahminler', en: 'Predictions' },
      'totalCourses': { tr: 'Toplam Kurslar', en: 'Total Courses' },
      'completedCourses': { tr: 'Tamamlanan Kurslar', en: 'Completed Courses' },
      'inProgress': { tr: 'Devam Eden', en: 'In Progress' },
      'studyTime': { tr: 'Çalışma Süresi', en: 'Study Time' },
      'currentStreak': { tr: 'Mevcut Seri', en: 'Current Streak' },
      'weeklyGoal': { tr: 'Haftalık Hedef', en: 'Weekly Goal' },
      'activeUsers': { tr: 'Aktif Kullanıcılar', en: 'Active Users' },
      'sessionDuration': { tr: 'Oturum Süresi', en: 'Session Duration' },
      'deviceUsage': { tr: 'Cihaz Kullanımı', en: 'Device Usage' },
      'strengthAreas': { tr: 'Güçlü Alanlar', en: 'Strength Areas' },
      'weakAreas': { tr: 'Gelişim Alanları', en: 'Areas for Improvement' },
      'learningVelocity': { tr: 'Öğrenme Hızı', en: 'Learning Velocity' },
      'skillProgression': { tr: 'Beceri Gelişimi', en: 'Skill Progression' },
      'assessmentScores': { tr: 'Değerlendirme Puanları', en: 'Assessment Scores' },
      'improvementTrends': { tr: 'Gelişim Trendleri', en: 'Improvement Trends' },
      'popularCourses': { tr: 'Popüler Kurslar', en: 'Popular Courses' },
      'contentEffectiveness': { tr: 'İçerik Etkinliği', en: 'Content Effectiveness' },
      'liveActivity': { tr: 'Canlı Aktivite', en: 'Live Activity' },
      'systemHealth': { tr: 'Sistem Sağlığı', en: 'System Health' },
      'recommendations': { tr: 'Öneriler', en: 'Recommendations' },
      'aiInsights': { tr: 'AI İçgörüleri', en: 'AI Insights' },
      'day': { tr: 'Gün', en: 'Day' },
      'week': { tr: 'Hafta', en: 'Week' },
      'month': { tr: 'Ay', en: 'Month' },
      'quarter': { tr: 'Çeyrek', en: 'Quarter' },
      'refresh': { tr: 'Yenile', en: 'Refresh' },
      'export': { tr: 'Dışa Aktar', en: 'Export' },
      'share': { tr: 'Paylaş', en: 'Share' },
      'filter': { tr: 'Filtrele', en: 'Filter' },
      'loading': { tr: 'Yükleniyor...', en: 'Loading...' },
      'noData': { tr: 'Veri bulunamadı', en: 'No data available' },
      'lastUpdated': { tr: 'Son güncelleme', en: 'Last updated' },
      'minutes': { tr: 'dakika', en: 'minutes' },
      'hours': { tr: 'saat', en: 'hours' },
      'days': { tr: 'gün', en: 'days' },
      'improvement': { tr: 'iyileşme', en: 'improvement' },
      'decline': { tr: 'düşüş', en: 'decline' },
      'stable': { tr: 'sabit', en: 'stable' },
      'high': { tr: 'Yüksek', en: 'High' },
      'medium': { tr: 'Orta', en: 'Medium' },
      'low': { tr: 'Düşük', en: 'Low' },
    };
    
    return translations[key]?.[language] || key;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              {getTranslation('loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {getTranslation('insights')} & {getTranslation('predictions')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'tr' 
              ? 'Gelişmiş öğrenme analizleri ve AI destekli içgörüler'
              : 'Advanced learning analytics and AI-powered insights'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <div className="flex bg-muted/50 rounded-lg p-1">
            {(['day', 'week', 'month', 'quarter'] as const).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className="text-xs"
              >
                {getTranslation(filter)}
              </Button>
            ))}
          </div>

          {/* Date Range Picker */}
          <DatePickerWithRange 
            date={dateRange} 
            setDate={(date: DateRange) => setDateRange(date)}
          />

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {getTranslation('refresh')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {getTranslation('export')}
          </Button>
        </div>
      </motion.div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{getTranslation('overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{getTranslation('engagement')}</span>
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">{getTranslation('learning')}</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{getTranslation('performance')}</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{getTranslation('courses')}</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">{getTranslation('realtime')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {/* Key Metrics Cards */}
            <MotionCard
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {getTranslation('totalCourses')}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {analytics?.userProgress.totalCourses || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {analytics?.userProgress.completedCourses || 0} {getTranslation('completedCourses').toLowerCase()}
                </div>
              </CardContent>
            </MotionCard>

            <MotionCard
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                  {getTranslation('studyTime')}
                </CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {Math.round((analytics?.userProgress.totalStudyTime || 0) / 60)}h
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  {Math.round(analytics?.userProgress.averageSessionTime || 0)} {getTranslation('minutes')} avg
                </div>
              </CardContent>
            </MotionCard>

            <MotionCard
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {getTranslation('currentStreak')}
                </CardTitle>
                <Award className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {analytics?.userProgress.currentStreak || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  {getTranslation('days')}
                </div>
              </CardContent>
            </MotionCard>

            <MotionCard
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  {getTranslation('weeklyGoal')}
                </CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analytics?.userProgress.weeklyGoalProgress || 0}%
                </div>
                <Progress 
                  value={analytics?.userProgress.weeklyGoalProgress || 0} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </MotionCard>
          </motion.div>

          {/* Weekly Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  {language === 'tr' ? 'Haftalık İlerleme' : 'Weekly Progress'}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Son 7 günlük aktivite ve ilerleme' : 'Activity and progress over the last 7 days'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics?.engagementMetrics.dailyActiveUsers || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      fill={COLORS.primary} 
                      fillOpacity={0.3}
                      stroke={COLORS.primary}
                      name={language === 'tr' ? 'Günlük Aktivite' : 'Daily Activity'}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Session Duration Chart */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>{getTranslation('sessionDuration')}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Oturum süreleri ve aktivite trendleri' : 'Session duration and activity trends'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.engagementMetrics.sessionDuration || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="avgDuration" 
                      stroke={COLORS.secondary} 
                      fill={COLORS.secondary}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Usage */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>{getTranslation('deviceUsage')}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Cihaz türlerine göre kullanım dağılımı' : 'Usage distribution by device type'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.engagementMetrics.deviceUsage || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="percentage"
                      label
                    >
                      {(analytics?.engagementMetrics.deviceUsage || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Strength Areas */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {getTranslation('strengthAreas')}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'En güçlü olduğunuz konular' : 'Your strongest subject areas'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.learningInsights.strengthAreas || []).map((area, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{area.subject}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={area.score} className="w-20 h-2" />
                        <span className="text-sm font-medium">{area.score}%</span>
                        {area.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                        {area.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                        {area.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Velocity */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  {getTranslation('learningVelocity')}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Öğrenme hızınız ve hedef karşılaştırması' : 'Your learning speed vs target'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {analytics?.learningInsights.learningVelocity.current || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'tr' ? 'Mevcut Hız' : 'Current Velocity'}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={analytics?.learningInsights.learningVelocity.current || 0} 
                      className="h-4"
                    />
                    <div 
                      className="absolute top-0 w-1 h-4 bg-red-500 rounded"
                      style={{ 
                        left: `${analytics?.learningInsights.learningVelocity.target || 0}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>{language === 'tr' ? 'Başlangıç' : 'Start'}</span>
                    <span className="text-red-500">
                      {language === 'tr' ? 'Hedef' : 'Target'}: {analytics?.learningInsights.learningVelocity.target || 0}%
                    </span>
                    <span>{language === 'tr' ? 'Hedef' : 'Goal'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  {getTranslation('aiInsights')}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Yapay zeka destekli öğrenme önerileri' : 'AI-powered learning recommendations'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(analytics?.learningInsights.adaptiveRecommendations || []).map((rec, index) => (
                    <MotionCard
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 border-l-4 ${
                        rec.priority === 'high' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
                        rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                        'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                            {getTranslation(rec.priority)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                        <Badge variant="outline" className="text-xs">
                          {rec.type}
                        </Badge>
                      </div>
                    </MotionCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            {/* Assessment Scores Chart */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>{getTranslation('assessmentScores')}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Değerlendirme puanları ve gelişim trendi' : 'Assessment scores and improvement trends'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={analytics?.performanceAnalytics.assessmentScores || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Scatter dataKey="score" fill={COLORS.primary} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Improvement Trends */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>{getTranslation('improvementTrends')}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Farklı metriklerdeki gelişim oranları' : 'Improvement rates across different metrics'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.performanceAnalytics.improvementTrends || []).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <h4 className="font-semibold">{trend.metric}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{language === 'tr' ? 'Önceki' : 'Previous'}: {trend.previous}</span>
                          <span>→</span>
                          <span>{language === 'tr' ? 'Şimdiki' : 'Current'}: {trend.current}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={trend.change > 0 ? 'default' : trend.change < 0 ? 'destructive' : 'secondary'}>
                          {trend.change > 0 ? '+' : ''}{trend.change}%
                        </Badge>
                        {trend.change > 0 && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                        {trend.change < 0 && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                        {trend.change === 0 && <Minus className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            {/* Popular Courses */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>{getTranslation('popularCourses')}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'En popüler kurslar ve tamamlanma oranları' : 'Most popular courses and completion rates'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.courseAnalytics.popularCourses || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enrollments" fill={COLORS.primary} name={language === 'tr' ? 'Kayıtlar' : 'Enrollments'} />
                    <Bar dataKey="completionRate" fill={COLORS.secondary} name={language === 'tr' ? 'Tamamlanma %' : 'Completion %'} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Content Effectiveness */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>{getTranslation('contentEffectiveness')}</CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'İçerik etkinliği ve öğrenci geri bildirimleri' : 'Content effectiveness and student feedback'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.courseAnalytics.contentEffectiveness || []).map((content, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{content.content}</span>
                        <Badge variant="outline">{content.userFeedback}/5</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">{language === 'tr' ? 'Katılım' : 'Engagement'}</div>
                          <Progress value={content.engagementScore} className="h-2" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{language === 'tr' ? 'Öğrenme' : 'Learning'}</div>
                          <Progress value={content.learningOutcome} className="h-2" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{language === 'tr' ? 'Geri Bildirim' : 'Feedback'}</div>
                          <Progress value={(content.userFeedback / 5) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Live Metrics */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                  {language === 'tr' ? 'Canlı İstatistikler' : 'Live Statistics'}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Gerçek zamanlı platform metrikleri' : 'Real-time platform metrics'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <span className="font-medium">{getTranslation('activeUsers')}</span>
                    <span className="text-2xl font-bold text-green-600">
                      {analytics?.realTimeMetrics.currentActiveUsers || 0}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="text-lg font-bold text-blue-600">
                        {analytics?.realTimeMetrics.todayStats.sessions || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'tr' ? 'Oturumlar' : 'Sessions'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                      <div className="text-lg font-bold text-purple-600">
                        {analytics?.realTimeMetrics.todayStats.completions || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'tr' ? 'Tamamlama' : 'Completions'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div className="text-lg font-bold text-orange-600">
                        {analytics?.realTimeMetrics.todayStats.newSignups || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'tr' ? 'Yeni Kayıt' : 'New Signups'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {getTranslation('systemHealth')}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Sistem performansı ve sağlık durumu' : 'System performance and health status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{language === 'tr' ? 'Yanıt Süresi' : 'Response Time'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{analytics?.realTimeMetrics.systemHealth.responseTime || 0}ms</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>{language === 'tr' ? 'Çalışma Süresi' : 'Uptime'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{analytics?.realTimeMetrics.systemHealth.uptime || 0}%</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>{language === 'tr' ? 'Hata Oranı' : 'Error Rate'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{analytics?.realTimeMetrics.systemHealth.errorRate || 0}%</span>
                      {(analytics?.realTimeMetrics.systemHealth.errorRate || 0) < 5 ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> :
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  {getTranslation('liveActivity')}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Platform üzerindeki canlı kullanıcı aktiviteleri' : 'Live user activities on the platform'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(analytics?.realTimeMetrics.liveActivity || []).map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-xs text-muted-foreground">{activity.resource}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'HH:mm:ss')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}