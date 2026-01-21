export interface Subject {
  id: string;
  title: string;
  description?: string;
  order: number;
  totalTopics?: number;
  estimatedHours?: number;
  color?: string;
  icon?: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  title?: string;
  order: number;
  estimatedTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  subjectId?: string;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  id: string;
  name: string;
  title?: string;
  order: number;
  estimatedTime?: number;
  completed?: boolean;
}

export interface CurriculumTree extends Subject {
  topics: Topic[];
}

export interface StudentProfile {
  name: string;
  targetExam?: string;
  dailyStudyHours?: number;
  targetDays?: number;
  weakSubjects?: string[];
  studyStyle?: string;
  currentLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface WeeklyPlanDay {
  day: string;
  date: string;
  subjects: Array<{
    subject: string;
    hours: number;
    topics: Array<{
      id: string;
      name: string;
      estimatedTime: number;
      difficulty: string;
    }>;
  }>;
  totalHours: number;
}

export interface MonthlySummary {
  subject: string;
  weeklyHours: number;
  completionWeeks: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Recommendation {
  type: string;
  message: string;
  reason: string;
}

export interface StudyPlan {
  id: string;
  studentName: string;
  targetExam: string;
  totalDays: number;
  dailyHours: number;
  totalHours: number;
  weeklyPlan: WeeklyPlanDay[];
  monthlySummary: MonthlySummary[];
  recommendations: Recommendation[];
  createdAt: string;
  updatedAt: string;
}
