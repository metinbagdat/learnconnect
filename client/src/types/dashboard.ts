export interface StudentAIDashboardData {
  goals?: Array<{
    id: string | number;
    text: string;
    completed?: boolean;
    [key: string]: any;
  }>;
  courseRecommendations?: any[];
  studyPlanSuggestions?: any[];
  goalSuggestions?: any[];
  weeklyProgress?: {
    [key: string]: any;
  };
  topStrengths?: Array<{
    label: string;
    value: number;
    [key: string]: any;
  }>;
  areasForImprovement?: Array<{
    label: string;
    value: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface StudentControlPanelData {
  assignments?: any[];
  achievements?: any[];
  [key: string]: any;
}

export interface StudentEnrollmentData {
  enrolledCourses?: any[];
  upcomingAssignments?: any[];
  [key: string]: any;
}

export interface StudyPlanDashboardData {
  assignments?: any[];
  modules?: any[];
  [key: string]: any;
}

export interface SystemHealthData {
  status?: string;
  aiAccuracy?: number;
  systemReliability?: number;
  totalEndpoints?: number;
  completionPercentage?: number;
  components?: any[];
  performanceTargets?: any;
  alerts?: any[];
  [key: string]: any;
}

export interface WaitlistManagementData {
  filter?: any;
  length?: number;
  map?: any;
  [key: string]: any;
}

export interface TYTProfileData {
  id: number;
  userId: number;
  isCompleted?: boolean;
  netScore?: number;
  targetTytScore?: number;
  examType?: string;
  examDate?: Date;
  correctAnswers?: number;
  wrongAnswers?: number;
  emptyAnswers?: number;
  completedAt?: Date;
  title?: string;
  description?: string;
  estimatedDuration?: number;
  taskType?: string;
  scheduledTime?: Date;
  priority?: string;
  [key: string]: any;
}
