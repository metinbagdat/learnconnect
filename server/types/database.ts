export interface UserProgressRow {
  id: number;
  userId: number;
  lessonsCompleted?: number;
  hoursStudied?: number;
  performanceScore?: number;
  createdAt?: Date;
  [key: string]: any;
}

export interface StudyGoalRow {
  id: number;
  userId: number;
  goal: string;
  goalText?: string | null;
  title?: string | null;
  examType?: string | null;
  subjects?: string[] | null;
  targetDate?: Date | null;
  dueDate?: string | null;
  isCompleted?: boolean | null;
  completed?: boolean | null;
  progress?: number | null;
  createdAt: Date;
  targetExam?: string;
  studyHoursPerWeek?: number;
  currentProgress?: number;
  status?: string;
  [key: string]: any;
}

export interface UserProfileRow {
  id: number;
  userId: number;
  studentClass?: string;
  examYear?: number;
  targetNetScore?: number;
  dailyStudyHoursTarget?: number;
  selectedSubjects?: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];
  motivationLevel?: string;
  progressPercent?: number;
  masteryLevel?: string;
  lastStudiedAt?: Date;
  [key: string]: any;
}

export interface ExamCategoryRow {
  id: number;
  title: string;
  displayName?: string;
  name?: string;
  totalQuestions?: number;
  code?: string;
  questionCount?: number;
  [key: string]: any;
}
