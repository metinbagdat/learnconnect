export interface TytStudentProfile {
  id?: number;
  userId?: number;
}

export interface TytSubject {
  id?: number;
  title?: string;
}

export interface TytTrialExam {
  id?: number;
  userId?: number;
  netScore?: number;
}

export interface DailyStudyTask {
  id: number;
  userId: number;
  title?: string;
  description?: string;
  scheduledDate?: string;
  isCompleted?: boolean;
  estimatedDuration?: number;
  actualDuration?: number;
}
