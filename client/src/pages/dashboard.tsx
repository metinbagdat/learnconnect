import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useSkillChallenge } from "@/hooks/use-skill-challenge";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatCard } from "@/components/dashboard/stat-card";
import { CourseCard } from "@/components/ui/course-card";
import { EnhancedAIAssistant } from "@/components/ui/enhanced-ai-assistant";
import { AssignmentList } from "@/components/ui/assignment-list";
import { CourseRecommendations } from "@/components/ui/course-recommendations";
import { UserInterests } from "@/components/ui/user-interests";
import { UserLevelCard } from "@/components/challenges/user-level-card";
import { TodoList } from "@/components/ui/todo-list";
import { InteractiveProgressBar } from "@/components/gamification/interactive-progress-bar";
import { PlayfulLearningAnimations, FloatingMascot, AchievementCelebration as AchievementCelebrationComponent, LearningMascot, AchievementCelebration as AchievementType } from "@/components/animations/playful-learning-animations";
import { AnimatedProgressBubbles, ProgressBubbleData } from "@/components/progress/animated-progress-bubbles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useGamificationTracker } from "@/hooks/use-gamification-tracker";
import { ApiError } from "@/components/error-states/api-error";
import { EmptyState } from "@/components/error-states/empty-state";
import { DashboardCardSkeleton } from "@/components/loading-states/enhanced-skeleton";
import { LoadingSpinner } from "@/components/loading-states/loading-spinner";
import { Book, CheckCircle, FileText, Award, Search, Zap, Trophy, Target, Flame, Users, UserCheck, Clock, TrendingUp, Calendar, Sparkles, Star, Crown, Rocket } from "lucide-react";
import { Course, UserCourse, Assignment } from "@shared/schema";
import { useState, useEffect, useMemo } from "react";
import PageWrapper from "@/components/layout/page-wrapper";

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { triggerSkillChallenge } = useSkillChallenge();
  const { showXpGain, celebrateLevelUp, checkAndUnlockAchievements } = useGamificationTracker();
  const [, navigate] = useLocation();
  
  // Playful animations state
  const [mascot, setMascot] = useState<LearningMascot>(() => ({
    id: 'dashboard-buddy',
    name: 'Learning Buddy',
    mood: 'happy',
    position: { x: typeof window !== 'undefined' ? window.innerWidth - 200 : 200, y: typeof window !== 'undefined' ? window.innerHeight - 200 : 200 },
    size: 'medium',
    animation: 'float'
  }));
  
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<AchievementType | null>(null);
  // Removed progressBubbles state - now using computed progressBubblesData directly
  
  const { data: userCourses = [], isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useQuery<(UserCourse & { course: Course })[]>({
    queryKey: ["/api/user/courses"],
    enabled: !!user, // Only run this query if user is logged in
    refetchOnMount: true,
    retry: 3,
  });
  
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useQuery<(Assignment & { course: Course })[]>({
    queryKey: ["/api/assignments"],
    enabled: !!user, // Only run this query if user is logged in
    refetchOnMount: true,
    retry: 3,
  });

  const { data: userSummary } = useQuery<any>({
    queryKey: ["/api/user/summary"],
    enabled: !!user,
  });

  // Fetch user level for gamification
  const { data: userLevel = {} } = useQuery<any>({
    queryKey: ["/api/user/level"],
    enabled: !!user,
  });

  // Fetch user's assigned mentor
  const { data: userMentor } = useQuery<any>({
    queryKey: ["/api/user/mentor"],
    enabled: !!user,
  });

  // Fetch user's study programs
  const { data: studyPrograms = [] } = useQuery<any[]>({
    queryKey: ["/api/user/study-programs"],
    enabled: !!user,
  });

  // Fetch weekly study statistics
  const { data: weeklyStats = {} } = useQuery<any>({
    queryKey: ["/api/user/study-stats/weekly"],
    enabled: !!user,
  });

  // Fetch recent study sessions
  const { data: recentSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/user/study-sessions"],
    enabled: !!user,
  });

  // Fetch user achievements
  const { data: userAchievements = [] } = useQuery<any[]>({
    queryKey: ["/api/user/achievements"],
    enabled: !!user,
  });

  // Fetch active challenges
  const { data: challengeStatus = {} } = useQuery<any>({
    queryKey: ["/api/user/challenges/status"],
    enabled: !!user,
  });
  
  // Compute stats with memoization to prevent infinite loops
  const stats = useMemo(() => ({
    coursesInProgress: userSummary?.coursesInProgress ?? userCourses.filter(uc => !uc.completed).length,
    completedCourses: userSummary?.completedCourses ?? userCourses.filter(uc => uc.completed).length,
    pendingAssignments: userSummary?.pendingAssignments ?? assignments.length,
    achievementsCount: userSummary?.achievementsCount ?? userAchievements.length,
  }), [userSummary, userCourses, assignments, userAchievements]);
  
  // Get in-progress courses with memoization
  const inProgressCourses = useMemo(() => 
    userCourses
      .filter(uc => !uc.completed)
      .sort((a, b) => b.progress - a.progress),
    [userCourses]
  );
  
  // Get upcoming assignments (limit to 3) with memoization
  const upcomingAssignments = useMemo(() => 
    assignments
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 3),
    [assignments]
  );

  // Generate progress bubbles from user data - moved to useMemo to prevent infinite loops
  const progressBubblesData = useMemo(() => {
    if (!user || userCourses.length === 0) return [];
    
    return [
      {
        id: 'courses_progress',
        title: 'Courses Progress',
        category: 'course' as const,
        progress: userCourses.length > 0 ? (stats.completedCourses / userCourses.length) * 100 : 0,
        maxValue: userCourses.length,
        currentValue: stats.completedCourses,
        color: 'blue' as const,
        icon: 'BookOpen' as const,
        description: 'Overall course completion progress',
        isActive: stats.coursesInProgress > 0,
        animationSpeed: 1.2,
        metadata: { priority: 'high' as const }
      },
      {
        id: 'assignments_progress',
        title: 'Assignments',
        category: 'skill' as const,
        progress: stats.pendingAssignments > 0 ? 75 : 100,
        maxValue: assignments.length || 1,
        currentValue: Math.max(0, assignments.length - stats.pendingAssignments),
        color: 'purple' as const,
        icon: 'Target' as const,
        description: 'Assignment completion status',
        isActive: stats.pendingAssignments > 0,
        animationSpeed: 1.5,
        metadata: { priority: 'medium' as const }
      },
      {
        id: 'achievements_earned',
        title: 'Achievements',
        category: 'achievement' as const,
        progress: stats.achievementsCount > 0 ? 100 : 0,
        maxValue: Math.max(stats.achievementsCount, 1),
        currentValue: stats.achievementsCount,
        color: 'gold' as const,
        icon: 'Trophy' as const,
        description: 'Badges and achievements earned',
        isActive: false,
        animationSpeed: 1.0,
        metadata: { priority: 'low' as const }
      }
    ];
  }, [user, userCourses.length, stats, assignments.length]);

  // Remove this useEffect - directly use progressBubblesData instead of state

  // Handle achievement celebrations
  const triggerCelebration = (type: 'course' | 'assignment' | 'achievement') => {
    const achievements = {
      course: {
        id: 'course_completed',
        title: 'Course Completed! 🎓',
        description: 'Congratulations on completing another course!',
        type: 'completion' as const,
        rarity: 'rare' as const,
        icon: 'Trophy',
        color: 'blue',
        effects: ['confetti', 'sparkles'] as ('confetti' | 'sparkles' | 'fireworks' | 'glow' | 'shake')[]
      },
      assignment: {
        id: 'assignment_done',
        title: 'Assignment Submitted! ✅',
        description: 'Great work on completing your assignment!',
        type: 'milestone' as const,
        rarity: 'common' as const,
        icon: 'Star',
        color: 'green',
        effects: ['sparkles'] as ('confetti' | 'sparkles' | 'fireworks' | 'glow' | 'shake')[]
      },
      achievement: {
        id: 'new_achievement',
        title: 'New Achievement Unlocked! 🏆',
        description: 'You have earned a new badge for your efforts!',
        type: 'mastery' as const,
        rarity: 'epic' as const,
        icon: 'Crown',
        color: 'gold',
        effects: ['confetti', 'fireworks', 'glow'] as ('confetti' | 'sparkles' | 'fireworks' | 'glow' | 'shake')[]
      }
    } as const;
    
    setCurrentAchievement(achievements[type]);
    setShowAchievement(true);
    setMascot(prev => ({ ...prev, mood: 'celebrating', animation: 'dance' }));
  };

  const handleCelebrationComplete = () => {
    setShowAchievement(false);
    setCurrentAchievement(null);
    setMascot(prev => ({ ...prev, mood: 'happy', animation: 'float' }));
  };

  const handleMascotInteract = () => {
    const messages = [
      `Welcome back, ${user?.displayName?.split(' ')[0] || 'Student'}! 🌟`,
      "Keep up the great learning! 💪",
      "Ready for today's challenge? 🚀",
      "You're making amazing progress! 👍",
      "Don't forget to check your courses! 📚"
    ];
    
    setMascot(prev => ({
      ...prev,
      message: messages[Math.floor(Math.random() * messages.length)],
      mood: 'encouraging',
      animation: 'wave'
    }));
    
    setTimeout(() => {
      setMascot(prev => ({ ...prev, message: undefined, mood: 'happy', animation: 'float' }));
    }, 4000);
  };

  // Update mascot position on resize
  useEffect(() => {
    const handleResize = () => {
      setMascot(prev => ({
        ...prev,
        position: { x: window.innerWidth - 200, y: window.innerHeight - 200 }
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Remove the problematic celebration useEffect to prevent infinite loops
  
  return (
    <PageWrapper 
      currentPage={language === 'tr' ? 'Ana Sayfa' : 'Dashboard'}
      pageTitle={language === 'tr' ? 'Öğrenme Merkezim' : 'My Learning Center'}
    >
      <PlayfulLearningAnimations
      config={{
        enableParticles: true,
        enableMascot: true,
        enableSoundEffects: false,
        animationSpeed: 1,
        particleCount: 15,
        celebrationDuration: 3000
      }}
    >
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-neutral-100 flex items-center justify-between px-4">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 5.727 2.45a1 1 0 00.788 0l7-3a1 1 0 000-1.841l-7-3z"></path>
              <path d="M2.492 8.825l-.787.335c-.483.207-.795.712-.551 1.168.192.357.667.511 1.033.351l1.298-.558-.992-1.296zm10.665 2.31l-7.673 3.291c-.481.206-.796.71-.551 1.168.192.357.667.511 1.033.351l8.235-3.529c.392-.168.446-.707.098-.99-.27-.22-.67-.235-.968-.106l-.174.075v-.26z"></path>
            </svg>
            <span className="ml-2 text-xl font-semibold text-neutral-900">EduLearn</span>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">{t('welcomeBack')}, {user?.displayName?.split(' ')[0] || t('student')}</h1>
                  <p className="mt-1 text-sm text-neutral-600">{t('continueWhereYouLeftOff')}</p>
                </div>
                
                {/* Search */}
                <div className="mt-4 md:mt-0 md:ml-4">
                  <div className="flex items-center relative">
                    <Input 
                      className="md:w-64 pl-10" 
                      placeholder={t('searchCoursesResources')} 
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              <div className="flex justify-between items-center mb-4">
                <div className="mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">{t('yourProgress')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('checkYourLearningProgress')}
                </p>
              </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex items-center bg-primary/10 text-primary hover:text-primary-600 hover:bg-primary/20"
                    onClick={() => {
                      console.log("Daily Challenge button clicked");
                      triggerSkillChallenge("daily");
                      setMascot(prev => ({ ...prev, mood: 'excited', animation: 'bounce', message: 'Challenge time! 🎯' }));
                    }}
                  >
                    <Zap className="mr-1 h-4 w-4" />
                    {t('dailyChallenge')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center bg-purple-50 text-purple-600 hover:bg-purple-100"
                    onClick={() => navigate('/playful-animations')}
                  >
                    <Sparkles className="mr-1 h-4 w-4" />
                    {t('animationsDemo')}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div onClick={() => navigate('/courses')} className="cursor-pointer">
                  <StatCard 
                    icon={Book} 
                    title={t('coursesInProgress')} 
                    value={stats.coursesInProgress} 
                    color="primary" 
                  />
                  <p className="text-xs text-muted-foreground mt-2 px-4">
                    {t('continueText')}
                  </p>
                </div>
                
                <div onClick={() => navigate('/courses')} className="cursor-pointer">
                  <StatCard 
                    icon={CheckCircle} 
                    title={t('completedCourses')} 
                    value={stats.completedCourses} 
                    color="success" 
                  />
                  <p className="text-xs text-muted-foreground mt-2 px-4">
                    {t('greatJob')}
                  </p>
                </div>
                
                <div onClick={() => navigate('/assignments')} className="cursor-pointer">
                  <StatCard 
                    icon={FileText} 
                    title={t('pendingAssignments')} 
                    value={stats.pendingAssignments} 
                    color="warning" 
                  />
                  <p className="text-xs text-muted-foreground mt-2 px-4">
                    {stats.pendingAssignments > 0 ? t('timeToSubmit') : t('allCaughtUp')}
                  </p>
                </div>
                
                <div onClick={() => navigate('/gamification')} className="cursor-pointer">
                  <StatCard 
                    icon={Award} 
                    title={t('achievements')} 
                    value={stats.achievementsCount} 
                    color="secondary" 
                  />
                  <p className="text-xs text-muted-foreground mt-2 px-4">
                    {stats.achievementsCount > 0 ? t('amazingProgress') : t('startEarningAchievements')}
                  </p>
                </div>
              </div>
            </div>

            {/* Gamification Summary Widget */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 rounded-full p-2">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('yourAchievements')}</h3>
                      <p className="text-sm text-muted-foreground">{t('levelUpYourLearning')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/social')}
                      className="bg-white/50 hover:bg-white/80"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {t('share')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/gamification')}
                      className="bg-white/50 hover:bg-white/80"
                    >
                      {t('viewAll')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* User Level */}
                  <Card className="bg-white/60 backdrop-blur-sm border-primary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {t('yourLevel')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userLevel ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">Level {(userLevel as any)?.level || 1}</span>
                            <Badge variant="secondary">{(userLevel as any)?.totalXp || 0} XP</Badge>
                          </div>
                          <InteractiveProgressBar
                            current={(userLevel as any)?.currentXp || 0}
                            max={100}
                            label={`${t('progressToLevel')} ${((userLevel as any)?.level || 1) + 1}`}
                            onLevelUp={() => {
                              celebrateLevelUp(((userLevel as any)?.level || 1) + 1);
                              checkAndUnlockAchievements(user?.id || 0);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>{t('completeChallengesToUnlock')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Challenges */}
                  <Card className="bg-white/60 backdrop-blur-sm border-primary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {t('activeChallenges')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(challengeStatus as any)?.active && (challengeStatus as any).active.length > 0 ? (
                        <div className="space-y-3">
                          {(challengeStatus as any).active.slice(0, 2).map((challenge: any) => (
                            <div key={challenge.id} className="flex items-center justify-between p-2 bg-white/50 rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">{challenge.challenge?.title}</p>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-orange-500 h-1.5 rounded-full" 
                                    style={{ width: `${challenge.progress || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {challenge.progress || 0}%
                              </Badge>
                            </div>
                          ))}
                          {(challengeStatus as any).active.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{(challengeStatus as any).active.length - 2} more challenges
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">{t('noActiveChallenges')}</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => navigate('/challenges')}
                          >
                            {t('startChallenge')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Achievements */}
                  <Card className="bg-white/60 backdrop-blur-sm border-primary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        {t('recentAchievements')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userAchievements && (userAchievements as any[]).length > 0 ? (
                        <div className="space-y-3">
                          {(userAchievements as any[]).slice(0, 3).map((achievement: any) => (
                            <div key={achievement.id} className="flex items-center gap-3 p-2 bg-white/50 rounded">
                              <div className="bg-yellow-100 rounded-full p-1">
                                <Award className="h-3 w-3 text-yellow-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {achievement.achievement?.title}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {achievement.achievement?.rarity}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    +{achievement.xpEarned} XP
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">{t('noAchievementsYet')}</p>
                          <p className="text-xs mt-1">{t('completeCoursesAndChallenges')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-primary/10">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/challenges')}
                    className="bg-white/50 hover:bg-white/80"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {t('viewChallenges')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/gamification')}
                    className="bg-white/50 hover:bg-white/80"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    {t('leaderboards')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => triggerSkillChallenge("random")}
                    className="bg-white/50 hover:bg-white/80"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {t('quickChallenge')}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Mentor and Program Management Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Mentor Information Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">
                      {t('yourMentor') || 'Your Mentor'}
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    {userMentor ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {userMentor.mentor?.user?.displayName?.charAt(0) || 
                             (userMentor.mentor?.isAiMentor ? 'AI' : 'M')}
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">
                              {userMentor.mentor?.user?.displayName || 'AI Learning Assistant'}
                            </p>
                            <p className="text-xs text-blue-600">
                              {userMentor.mentor?.isAiMentor ? 
                                (t('aiMentor') || 'AI Mentor') : 
                                (t('humanMentor') || 'Human Mentor')
                              }
                            </p>
                          </div>
                        </div>
                        {userMentor.mentor?.specialization && (
                          <div>
                            <p className="text-xs text-blue-600 font-medium mb-1">
                              {t('specialization') || 'Specialization'}:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {userMentor.mentor.specialization.map((spec: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center text-xs text-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('assignedOn') || 'Assigned on'}: {new Date(userMentor.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <UserCheck className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                        <p className="text-blue-700 font-medium">
                          {t('assigningMentor') || 'Assigning your mentor...'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {t('mentorWillBeAssigned') || 'A mentor will be assigned to help you succeed.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Weekly Study Statistics Card */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">
                      {t('weeklyProgress') || 'Weekly Progress'}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">
                          {t('studyHours') || 'Study Hours'}
                        </span>
                        <span className="font-semibold text-green-900">
                          {Math.round(weeklyStats.actualHours || 0)}h / {weeklyStats.plannedHours || 10}h
                        </span>
                      </div>
                      
                      <div className="w-full bg-green-100 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                          style={{
                            width: `${Math.min(100, ((weeklyStats.actualHours || 0) / (weeklyStats.plannedHours || 10)) * 100)}%`
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">
                          {t('adherenceScore') || 'Adherence'}: {Math.round(weeklyStats.adherenceScore || 100)}%
                        </span>
                        <span className="text-green-600">
                          {weeklyStats.actualHours >= weeklyStats.plannedHours ? 
                            (t('targetAchieved') || 'Target Achieved! 🎉') :
                            (t('keepGoing') || 'Keep going! 💪')
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Study Programs Section */}
              {studyPrograms.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      {t('studyPrograms') || 'Study Programs'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studyPrograms.slice(0, 2).map((program: any) => (
                        <div key={program.id} className="p-4 bg-neutral-50 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-neutral-900">
                              {program.program?.title || 'Study Program'}
                            </h3>
                            <Badge variant="outline">
                              {t('week') || 'Week'} {program.currentWeek || 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-600 mb-3">
                            {program.program?.description}
                          </p>
                          <div className="space-y-2">
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${program.progress || 0}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-600">
                              <span>{program.progress || 0}% {t('complete') || 'complete'}</span>
                              <span>
                                {program.completedHours || 0}h / {program.totalHours || 0}h
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {studyPrograms.length > 2 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" onClick={() => navigate('/programs')}>
                          {t('viewAllPrograms') || 'View All Programs'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Continue Learning Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">{t('continueLeaning')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('pickUpWhereYouLeftOff')}
                </p>
              </div>
              
              {coursesError ? (
                <div className="mt-4">
                  <ApiError 
                    error={coursesError}
                    onRetry={refetchCourses}
                    type="network"
                    title={t('failedToLoadCourses', 'Failed to load courses')}
                    description={t('coursesErrorDesc', 'Unable to load your courses. Please check your connection and try again.')}
                  />
                </div>
              ) : coursesLoading ? (
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <DashboardCardSkeleton key={i} />
                  ))}
                </div>
              ) : inProgressCourses.length === 0 ? (
                <div className="mt-4">
                  <EmptyState 
                    type="courses"
                    onAction={() => navigate('/courses')}
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {inProgressCourses.map((userCourse) => (
                    <CourseCard
                      key={userCourse.id}
                      course={userCourse.course}
                      userCourse={userCourse}
                      showContinue={true}
                      onContinue={() => navigate(`/courses/${userCourse.courseId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* AI-powered Recommendations Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">{t('recommendedForYou')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('aiPoweredSuggestions')}
                </p>
              </div>
              <div className="mt-4">
                <CourseRecommendations />
              </div>
            </div>
            
            {/* Three-column layout with prominent To-Do List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To-Do List - Most Prominent Position */}
              <div className="md:col-span-1">
                <TodoList showAddButton={true} maxHeight="600px" />
              </div>
              
              {/* AI Assistant */}
              <div className="md:col-span-1">
                <EnhancedAIAssistant />
              </div>
              
              {/* Assignments */}
              <div className="md:col-span-1">
                {assignmentsError ? (
                  <ApiError 
                    error={assignmentsError}
                    onRetry={refetchAssignments}
                    type="server"
                    title={t('failedToLoadAssignments', 'Failed to load assignments')}
                    description={t('assignmentsErrorDesc', 'Unable to load your assignments. Please try again.')}
                  />
                ) : assignmentsLoading ? (
                  <LoadingSpinner 
                    type="default" 
                    message={t('loadingAssignments', 'Loading assignments...')} 
                    size="md"
                  />
                ) : upcomingAssignments.length === 0 ? (
                  <EmptyState 
                    type="assignments"
                    onAction={() => navigate('/courses')}
                  />
                ) : (
                  <AssignmentList 
                    assignments={upcomingAssignments}
                    onViewAll={() => navigate('/assignments')}
                    onViewAssignment={(id) => navigate(`/assignments/${id}`)}
                  />
                )}
              </div>
            </div>
            
            {/* Playful Progress Bubbles */}
            {progressBubblesData.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Learning Progress Visualization
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Interactive view of your learning journey with animated progress bubbles
                  </p>
                </div>
                <AnimatedProgressBubbles
                  bubbles={progressBubblesData}
                  onBubbleClick={(bubble) => {
                    if (bubble.category === 'course') {
                      navigate('/courses');
                    } else if (bubble.category === 'skill') {
                      navigate('/assignments');
                    } else {
                      triggerCelebration('achievement');
                    }
                  }}
                  animated={true}
                  showControls={false}
                />
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
      
      {/* Floating Mascot */}
      <FloatingMascot 
        mascot={mascot} 
        onInteract={handleMascotInteract}
      />
      
      {/* Achievement Celebrations */}
      {currentAchievement && (
        <AchievementCelebrationComponent
          achievement={currentAchievement}
          isVisible={showAchievement}
          onComplete={handleCelebrationComplete}
        />
      )}
    </PlayfulLearningAnimations>
    </PageWrapper>
  );
}
