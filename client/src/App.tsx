import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/consolidated-language-context";
import { Navbar } from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import Dashboard from "@/pages/dashboard";
import DashboardStandalone from "@/pages/dashboard-standalone";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import LessonPage from "@/pages/lesson-page";
import Assignments from "@/pages/assignments";
import Calendar from "@/pages/calendar";
import Resources from "@/pages/resources";
import Profile from "@/pages/profile";
import CourseGenerator from "@/pages/course-generator";
import AdminPanel from "@/pages/admin-panel";
import AuthPage from "@/pages/auth-page";
import LearningPathPage from "@/pages/learning-path-page";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import AdvancedAnalyticsDashboard from "@/pages/advanced-analytics";
import ChallengesPage from "@/pages/challenges";
import SuggestionsDemoPage from "@/pages/suggestions-demo";
import GamificationDashboard from "@/pages/gamification-dashboard";
import SocialPage from "@/pages/social-page";
import LearningTrailsPage from "@/pages/learning-trails";
import ChallengePathsPage from "@/pages/challenge-paths";
import ChallengeAnalyticsDashboard from "@/pages/challenge-analytics-dashboard";
import EntranceExamPrep from "@/pages/entrance-exam-prep";
import AdaptiveLearningDemo from "@/pages/adaptive-learning-demo";
import AdvancedAdaptiveLearning from "@/pages/advanced-adaptive-learning";
import EmojiMilestonesDemo from "@/pages/emoji-milestones-demo";
import AnimatedProgressDemo from "@/pages/animated-progress-demo";
import PlayfulAnimationsDemo from "@/pages/playful-animations-demo";
import StudentControlPanel from "@/pages/student-control-panel";
import MentorControlPanel from "@/pages/mentor-control-panel";
import StudyPlannerPage from "@/pages/study-planner";
import AssessmentPage from "@/pages/assessment";
import Checkout from "@/pages/checkout";
import SubscriptionPage from "@/pages/subscription";
import TytDashboard from "@/pages/tyt-dashboard";
import MyCurriculumPage from "@/pages/my-curriculum";
import EssaysPage from "@/pages/essays";
import TimeTracking from "@/pages/time-tracking";
import AIDailyPlan from "@/pages/ai-daily-plan";
import LandingPage from "@/pages/landing-page";
import LearnConnectPortal from "@/pages/learnconnect-portal";
import LearnConnectExams from "@/pages/learnconnect-exams";
import LearnConnectAdmin from "@/pages/learnconnect-admin";
import LearnConnectAI from "@/pages/learnconnect-ai";
import MarketingDashboard from "@/pages/marketing-dashboard";
import AffiliateDashboard from "@/pages/affiliate-dashboard";
import WaitlistManagement from "@/pages/waitlist-management";
import AnalyticsCharts from "@/pages/analytics-charts";
import StudyTechniques from "@/pages/study-techniques";
import ExamAnxietyGuide from "@/pages/exam-anxiety-guide";
import TestimonialsPage from "@/pages/testimonials";
import HowItWorks from "@/pages/how-it-works";
import PremiumPage from "@/pages/premium";
import SmartPlanningDashboard from "@/pages/smart-planning-dashboard";
import { OnboardingPage } from "@/pages/onboarding";
import { PreCourseGuidance } from "@/pages/pre-course-guidance";
import { AIControlDashboard } from "@/pages/ai-control-dashboard";
import { InteractionTracking } from "@/pages/interaction-tracking";
import { StudentAIDashboard } from "@/pages/student-ai-dashboard";
import { SystemHealth } from "@/pages/system-health";
import { AdminAIDashboard } from "@/pages/admin-ai-dashboard";
import { GoalSettingForm } from "@/pages/goal-setting-form";
import AdaptiveLearning from "@/pages/adaptive-learning";
import ControlPanel from "@/pages/control-panel";
import { MonitoringPage } from "@/pages/monitoring";
import { PermissionsDemoPage } from "@/pages/permissions-demo";
import { CoursesControlPage } from "@/pages/courses-control";
import CurriculumGenerationPage from "@/pages/curriculum-generation";
import CurriculumCustomization from "@/pages/curriculum-customization";
import StudentCurriculumDashboard from "@/pages/student-curriculum-dashboard";
import AdminCurriculumDashboard from "@/pages/admin-curriculum-dashboard";
import CurriculumGenerationForm from "@/pages/curriculum-generation-form";
import ProductionHistoryList from "@/pages/production-history-list";
import MemoryEnhancedDashboard from "@/pages/memory-enhanced-dashboard";
import CognitiveAssessment from "@/pages/cognitive-assessment";
import StudentCognitiveDashboard from "@/pages/student-cognitive-dashboard";
import AdminCognitiveDashboard from "@/pages/admin-cognitive-dashboard";
import CognitivePreferenceForm from "@/pages/cognitive-preference-form";
import IntegratedDashboard from "@/pages/integrated-dashboard";
import AdminIntegrationDashboard from "@/pages/admin-integration-dashboard";
import IntegratedEnrollment from "@/pages/integrated-enrollment";
import { CurriculumDesigner } from "@/pages/curriculum-designer";
import { SuccessMetricsDashboard } from "@/pages/success-metrics-dashboard";
import { CurriculumFrameworkDisplay } from "@/pages/curriculum-framework-display";
import { CurriculumParametersForm } from "@/pages/curriculum-parameters-form";
import { KPIDashboard } from "@/pages/kpi-dashboard";
import { ProgramPlan } from "@/pages/program-plan";
import { StudentDashboard } from "@/pages/student-dashboard";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { AiRecommendations } from "@/pages/ai-recommendations";
import { AdminCurriculumGenerator } from "@/pages/admin-curriculum-generator";
import { SmartStudentDashboard } from "@/pages/dashboard-smart";
import StudyPlanDashboard from "@/pages/study-plan-dashboard";
import AdminEnrollmentDashboard from "@/pages/admin-enrollment-dashboard";
import StudentEnrollmentDashboard from "@/pages/student-enrollment-dashboard";
import EducationalMaterials from "@/pages/educational-materials";
import AdvisorMaterialDashboard from "@/pages/advisor-material-dashboard";

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

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <GamificationProvider>
              <SkillChallengeProvider>
                <Navbar />
                <Router />
                <Toaster />
                <SafeAnalytics />
              </SkillChallengeProvider>
            </GamificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
