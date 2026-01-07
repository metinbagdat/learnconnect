import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/consolidated-language-context";
import { Navbar } from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

// Lazy load all pages to reduce initial bundle size and fix module initialization order
const Dashboard = lazy(() => import("@/pages/dashboard"));
const DashboardStandalone = lazy(() => import("@/pages/dashboard-standalone"));
const Courses = lazy(() => import("@/pages/courses"));
const CourseDetail = lazy(() => import("@/pages/course-detail"));
const LessonPage = lazy(() => import("@/pages/lesson-page"));
const Assignments = lazy(() => import("@/pages/assignments"));
const Calendar = lazy(() => import("@/pages/calendar"));
const Resources = lazy(() => import("@/pages/resources"));
const Profile = lazy(() => import("@/pages/profile"));
const CourseGenerator = lazy(() => import("@/pages/course-generator"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const LearningPathPage = lazy(() => import("@/pages/learning-path-page"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const AdvancedAnalyticsDashboard = lazy(() => import("@/pages/advanced-analytics"));
const ChallengesPage = lazy(() => import("@/pages/challenges"));
const SuggestionsDemoPage = lazy(() => import("@/pages/suggestions-demo"));
const GamificationDashboard = lazy(() => import("@/pages/gamification-dashboard"));
const SocialPage = lazy(() => import("@/pages/social-page"));
const LearningTrailsPage = lazy(() => import("@/pages/learning-trails"));
const ChallengePathsPage = lazy(() => import("@/pages/challenge-paths"));
const ChallengeAnalyticsDashboard = lazy(() => import("@/pages/challenge-analytics-dashboard"));
const EntranceExamPrep = lazy(() => import("@/pages/entrance-exam-prep"));
const AdaptiveLearningDemo = lazy(() => import("@/pages/adaptive-learning-demo"));
const AdvancedAdaptiveLearning = lazy(() => import("@/pages/advanced-adaptive-learning"));
const EmojiMilestonesDemo = lazy(() => import("@/pages/emoji-milestones-demo"));
const AnimatedProgressDemo = lazy(() => import("@/pages/animated-progress-demo"));
const PlayfulAnimationsDemo = lazy(() => import("@/pages/playful-animations-demo"));
const StudentControlPanel = lazy(() => import("@/pages/student-control-panel"));
const MentorControlPanel = lazy(() => import("@/pages/mentor-control-panel"));
const StudyPlannerPage = lazy(() => import("@/pages/study-planner"));
const AssessmentPage = lazy(() => import("@/pages/assessment"));
const Checkout = lazy(() => import("@/pages/checkout"));
const SubscriptionPage = lazy(() => import("@/pages/subscription"));
const TytDashboard = lazy(() => import("@/pages/tyt-dashboard"));
const MyCurriculumPage = lazy(() => import("@/pages/my-curriculum"));
const EssaysPage = lazy(() => import("@/pages/essays"));
const TimeTracking = lazy(() => import("@/pages/time-tracking"));
const AIDailyPlan = lazy(() => import("@/pages/ai-daily-plan"));
const LandingPage = lazy(() => import("@/pages/landing-page"));
const LearnConnectPortal = lazy(() => import("@/pages/learnconnect-portal"));
const LearnConnectExams = lazy(() => import("@/pages/learnconnect-exams"));
const LearnConnectAdmin = lazy(() => import("@/pages/learnconnect-admin"));
const LearnConnectAI = lazy(() => import("@/pages/learnconnect-ai"));
const MarketingDashboard = lazy(() => import("@/pages/marketing-dashboard"));
const AffiliateDashboard = lazy(() => import("@/pages/affiliate-dashboard"));
const WaitlistManagement = lazy(() => import("@/pages/waitlist-management"));
const AnalyticsCharts = lazy(() => import("@/pages/analytics-charts"));
const StudyTechniques = lazy(() => import("@/pages/study-techniques"));
const ExamAnxietyGuide = lazy(() => import("@/pages/exam-anxiety-guide"));
const TestimonialsPage = lazy(() => import("@/pages/testimonials"));
const HowItWorks = lazy(() => import("@/pages/how-it-works"));
const PremiumPage = lazy(() => import("@/pages/premium"));
const SmartPlanningDashboard = lazy(() => import("@/pages/smart-planning-dashboard"));
const OnboardingPage = lazy(() => import("@/pages/onboarding").then(m => ({ default: m.OnboardingPage })));
const PreCourseGuidance = lazy(() => import("@/pages/pre-course-guidance").then(m => ({ default: m.PreCourseGuidance })));
const AIControlDashboard = lazy(() => import("@/pages/ai-control-dashboard").then(m => ({ default: m.AIControlDashboard })));
const InteractionTracking = lazy(() => import("@/pages/interaction-tracking").then(m => ({ default: m.InteractionTracking })));
const StudentAIDashboard = lazy(() => import("@/pages/student-ai-dashboard").then(m => ({ default: m.StudentAIDashboard })));
const SystemHealth = lazy(() => import("@/pages/system-health").then(m => ({ default: m.SystemHealth })));
const AdminAIDashboard = lazy(() => import("@/pages/admin-ai-dashboard").then(m => ({ default: m.AdminAIDashboard })));
const GoalSettingForm = lazy(() => import("@/pages/goal-setting-form").then(m => ({ default: m.GoalSettingForm })));
const AdaptiveLearning = lazy(() => import("@/pages/adaptive-learning"));
const ControlPanel = lazy(() => import("@/pages/control-panel"));
const MonitoringPage = lazy(() => import("@/pages/monitoring").then(m => ({ default: m.MonitoringPage })));
const PermissionsDemoPage = lazy(() => import("@/pages/permissions-demo").then(m => ({ default: m.PermissionsDemoPage })));
const CoursesControlPage = lazy(() => import("@/pages/courses-control").then(m => ({ default: m.CoursesControlPage })));
const CurriculumGenerationPage = lazy(() => import("@/pages/curriculum-generation"));
const CurriculumCustomization = lazy(() => import("@/pages/curriculum-customization"));
const StudentCurriculumDashboard = lazy(() => import("@/pages/student-curriculum-dashboard"));
const AdminCurriculumDashboard = lazy(() => import("@/pages/admin-curriculum-dashboard"));
const CurriculumGenerationForm = lazy(() => import("@/pages/curriculum-generation-form"));
const ProductionHistoryList = lazy(() => import("@/pages/production-history-list"));
const MemoryEnhancedDashboard = lazy(() => import("@/pages/memory-enhanced-dashboard"));
const CognitiveAssessment = lazy(() => import("@/pages/cognitive-assessment"));
const StudentCognitiveDashboard = lazy(() => import("@/pages/student-cognitive-dashboard"));
const AdminCognitiveDashboard = lazy(() => import("@/pages/admin-cognitive-dashboard"));
const CognitivePreferenceForm = lazy(() => import("@/pages/cognitive-preference-form"));
const IntegratedDashboard = lazy(() => import("@/pages/integrated-dashboard"));
const AdminIntegrationDashboard = lazy(() => import("@/pages/admin-integration-dashboard"));
const IntegratedEnrollment = lazy(() => import("@/pages/integrated-enrollment"));
const CurriculumDesigner = lazy(() => import("@/pages/curriculum-designer").then(m => ({ default: m.CurriculumDesigner })));
const SuccessMetricsDashboard = lazy(() => import("@/pages/success-metrics-dashboard").then(m => ({ default: m.SuccessMetricsDashboard })));
const CurriculumFrameworkDisplay = lazy(() => import("@/pages/curriculum-framework-display").then(m => ({ default: m.CurriculumFrameworkDisplay })));
const CurriculumParametersForm = lazy(() => import("@/pages/curriculum-parameters-form").then(m => ({ default: m.CurriculumParametersForm })));
const KPIDashboard = lazy(() => import("@/pages/kpi-dashboard").then(m => ({ default: m.KPIDashboard })));
const ProgramPlan = lazy(() => import("@/pages/program-plan").then(m => ({ default: m.ProgramPlan })));
const StudentDashboard = lazy(() => import("@/pages/student-dashboard").then(m => ({ default: m.StudentDashboard })));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard").then(m => ({ default: m.AdminDashboard })));
const AiRecommendations = lazy(() => import("@/pages/ai-recommendations").then(m => ({ default: m.AiRecommendations })));
const AdminCurriculumGenerator = lazy(() => import("@/pages/admin-curriculum-generator").then(m => ({ default: m.AdminCurriculumGenerator })));
const SmartStudentDashboard = lazy(() => import("@/pages/dashboard-smart").then(m => ({ default: m.SmartStudentDashboard })));
const StudyPlanDashboard = lazy(() => import("@/pages/study-plan-dashboard"));
const AdminEnrollmentDashboard = lazy(() => import("@/pages/admin-enrollment-dashboard"));
const StudentEnrollmentDashboard = lazy(() => import("@/pages/student-enrollment-dashboard"));
const EducationalMaterials = lazy(() => import("@/pages/educational-materials"));
const AdvisorMaterialDashboard = lazy(() => import("@/pages/advisor-material-dashboard"));

function Router() {
  return (
    <Switch>
      <Route path="/learnconnect" component={LearnConnectPortal} />
      <Route path="/learnconnect/exams" component={LearnConnectExams} />
      <Route path="/learnconnect/admin" component={LearnConnectAdmin} />
      <Route path="/learnconnect/ai" component={LearnConnectAI} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/study-techniques" component={StudyTechniques} />
      <Route path="/exam-anxiety" component={ExamAnxietyGuide} />
      <Route path="/testimonials" component={TestimonialsPage} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/premium" component={PremiumPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard-standalone" component={DashboardStandalone} />
      <ProtectedRoute path="/courses" component={Courses} />
      <ProtectedRoute path="/courses/:courseId" component={CourseDetail} />
      <ProtectedRoute path="/lessons/:lessonId" component={LessonPage} />
      <ProtectedRoute path="/assignments" component={Assignments} />
      <ProtectedRoute path="/calendar" component={Calendar} />
      <ProtectedRoute path="/resources" component={Resources} />
      <ProtectedRoute path="/educational-materials" component={EducationalMaterials} />
      <ProtectedRoute path="/advisor-materials" component={AdvisorMaterialDashboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/course-generator" component={CourseGenerator} />
      <ProtectedRoute path="/learning-paths" component={LearningPathPage} />
      <ProtectedRoute path="/learning-paths/:id" component={LearningPathPage} />
      <ProtectedRoute path="/challenges" component={ChallengesPage} />
      <ProtectedRoute path="/challenge-paths" component={ChallengePathsPage} />
      <ProtectedRoute path="/challenge-analytics" component={ChallengeAnalyticsDashboard} />
      <ProtectedRoute path="/entrance-exam-prep" component={EntranceExamPrep} />
      <ProtectedRoute path="/tyt-dashboard" component={TytDashboard} />
      <ProtectedRoute path="/tyt/profile-setup" component={TytDashboard} />
      <ProtectedRoute path="/tyt/tasks/new" component={TytDashboard} />
      <ProtectedRoute path="/tyt/trials/new" component={TytDashboard} />
      <ProtectedRoute path="/study-planner" component={StudyPlannerPage} />
      <ProtectedRoute path="/smart-planning" component={SmartPlanningDashboard} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} />
      <ProtectedRoute path="/pre-course-guidance" component={PreCourseGuidance} />
      <ProtectedRoute path="/ai-control" component={AIControlDashboard} />
      <ProtectedRoute path="/interaction-tracking" component={InteractionTracking} />
      <ProtectedRoute path="/student-ai-dashboard" component={StudentAIDashboard} />
      <ProtectedRoute path="/system-health" component={SystemHealth} />
      <ProtectedRoute path="/admin-ai-dashboard" component={AdminAIDashboard} />
      <ProtectedRoute path="/goal-setting" component={GoalSettingForm} />
      <ProtectedRoute path="/my-curriculum" component={MyCurriculumPage} />
      <ProtectedRoute path="/curriculum-generate" component={CurriculumGenerationPage} />
      <ProtectedRoute path="/curriculum-customize" component={CurriculumCustomization} />
      <ProtectedRoute path="/student-curriculum-dashboard" component={StudentCurriculumDashboard} />
      <ProtectedRoute path="/admin-curriculum-dashboard" component={AdminCurriculumDashboard} />
      <ProtectedRoute path="/curriculum-form" component={CurriculumGenerationForm} />
      <ProtectedRoute path="/production-history" component={ProductionHistoryList} />
      <ProtectedRoute path="/time-tracking" component={TimeTracking} />
      <ProtectedRoute path="/ai-daily-plan" component={AIDailyPlan} />
      <ProtectedRoute path="/assessment" component={AssessmentPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} />
      <ProtectedRoute path="/advanced-analytics" component={AdvancedAnalyticsDashboard} />
      <ProtectedRoute path="/gamification" component={GamificationDashboard} />
      <ProtectedRoute path="/integrated-dashboard" component={IntegratedDashboard} />
      <ProtectedRoute path="/admin-integration-dashboard" component={AdminIntegrationDashboard} />
      <ProtectedRoute path="/integrated-enrollment" component={IntegratedEnrollment} />
      <ProtectedRoute path="/social" component={SocialPage} />
      <ProtectedRoute path="/learning-trails" component={LearningTrailsPage} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <ProtectedRoute path="/suggestions" component={SuggestionsDemoPage} />
      <ProtectedRoute path="/adaptive-learning" component={AdaptiveLearning} />
      <ProtectedRoute path="/adaptive-learning-demo" component={AdaptiveLearningDemo} />
      <ProtectedRoute path="/advanced-adaptive" component={AdvancedAdaptiveLearning} />
      <ProtectedRoute path="/emoji-milestones" component={EmojiMilestonesDemo} />
      <ProtectedRoute path="/animated-progress" component={AnimatedProgressDemo} />
      <ProtectedRoute path="/playful-animations" component={PlayfulAnimationsDemo} />
      <ProtectedRoute path="/student-control-panel" component={StudentControlPanel} />
      <ProtectedRoute path="/mentor-control-panel" component={MentorControlPanel} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/checkout/:courseId" component={Checkout} />
      <ProtectedRoute path="/essays" component={EssaysPage} />
      <ProtectedRoute path="/marketing" component={MarketingDashboard} />
      <ProtectedRoute path="/affiliate" component={AffiliateDashboard} />
      <ProtectedRoute path="/waitlist" component={WaitlistManagement} />
      <ProtectedRoute path="/analytics-charts" component={AnalyticsCharts} />
      <ProtectedRoute path="/control-panel" component={ControlPanel} />
      <ProtectedRoute path="/monitoring" component={MonitoringPage} />
      <ProtectedRoute path="/permissions" component={PermissionsDemoPage} />
      <ProtectedRoute path="/courses-control" component={CoursesControlPage} />
      <ProtectedRoute path="/memory-enhanced-dashboard" component={MemoryEnhancedDashboard} />
      <ProtectedRoute path="/cognitive-assessment" component={CognitiveAssessment} />
      <ProtectedRoute path="/student-cognitive-dashboard" component={StudentCognitiveDashboard} />
      <ProtectedRoute path="/admin-cognitive-dashboard" component={AdminCognitiveDashboard} />
      <ProtectedRoute path="/cognitive-preferences" component={CognitivePreferenceForm} />
      <ProtectedRoute path="/curriculum-designer" component={CurriculumDesigner} />
      <ProtectedRoute path="/success-metrics" component={SuccessMetricsDashboard} />
      <ProtectedRoute path="/curriculum-framework" component={CurriculumFrameworkDisplay} />
      <ProtectedRoute path="/curriculum-parameters" component={CurriculumParametersForm} />
      <ProtectedRoute path="/kpi-dashboard" component={KPIDashboard} />
      <ProtectedRoute path="/program-plan" component={ProgramPlan} />
      <ProtectedRoute path="/student-dashboard" component={StudentDashboard} />
      <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/ai-recommendations" component={AiRecommendations} />
      <ProtectedRoute path="/admin/curriculum-generator" component={AdminCurriculumGenerator} />
      <ProtectedRoute path="/dashboard-smart" component={SmartStudentDashboard} />
      <ProtectedRoute path="/study-plan" component={StudyPlanDashboard} />
      <ProtectedRoute path="/admin/enrollment" component={AdminEnrollmentDashboard} />
      <ProtectedRoute path="/student/dashboard" component={StudentEnrollmentDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { AuthProvider } from "./hooks/use-auth";
import { SkillChallengeProvider } from "./hooks/use-skill-challenge";
import { GamificationProvider } from "./hooks/use-gamification-tracker";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ErrorBoundary } from "./components/error-states/error-boundary";
import { SafeAnalytics } from "./components/analytics-wrapper";
import { ConnectionErrorProvider, useConnectionError } from "./contexts/connection-error-context";
import { ConnectionErrorDialog } from "./components/error-states/connection-error-dialog";
import { setConnectionErrorHandler } from "./lib/queryClient";
import { initializeGlobalErrorHandler } from "./lib/global-error-handler";
import { ErrorMetadata } from "./contexts/connection-error-context";
import { useEffect } from "react";

// Loading fallback component for lazy-loaded routes
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isOpen, hideError, requestId, retry, retryLoading, showError, errorMetadata } = useConnectionError();
  
  useEffect(() => {
    // Set up the global connection error handler for API requests
    setConnectionErrorHandler((requestId: string, metadata?: ErrorMetadata) => {
      showError(requestId, metadata);
    });
    
    // Initialize global error handler for window.onerror and unhandled rejections
    const globalHandler = initializeGlobalErrorHandler({
      showDialogForTypes: ['network', 'ses', 'lexical'],
      onError: (error, type, errorRequestId) => {
        const metadata: ErrorMetadata = {
          type,
          message: error.message,
          stack: error.stack,
        };
        showError(errorRequestId, metadata);
      },
    });
    
    // Cleanup on unmount
    return () => {
      globalHandler.cleanup();
    };
  }, [showError]);
  
  return (
    <>
      <Navbar />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Router />
      </Suspense>
      <Toaster />
      <SafeAnalytics />
      <ConnectionErrorDialog
        open={isOpen}
        onOpenChange={hideError}
        onRetry={retry}
        requestId={requestId}
        retryLoading={retryLoading}
        errorMetadata={errorMetadata}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <ConnectionErrorProvider>
            <GamificationProvider>
              <SkillChallengeProvider>
                  <AppContent />
              </SkillChallengeProvider>
            </GamificationProvider>
            </ConnectionErrorProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
