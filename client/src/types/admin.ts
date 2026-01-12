/**
 * Admin type definitions
 */

import { CourseCategory } from "@shared/schema";

// Extended category with tree properties
export interface ExtendedCategory extends CourseCategory {
  depth?: number;
  parentCategoryId?: number | null;
  children?: ExtendedCategory[];
}

// Analytics data types
export interface EnrollmentTrend {
  month: string;
  enrollments: number;
}

export interface CoursePerformance {
  name: string;
  students: number;
  completion: number;
}

export interface DashboardStats {
  totalStudents?: number;
  totalCourses?: number;
  avgCompletion?: number;
  [key: string]: any;
}

export interface AnalyticsResponse {
  enrollmentTrends?: EnrollmentTrend[];
  coursePerformance?: CoursePerformance[];
  stats?: DashboardStats;
  [key: string]: any;
}

// Course management types
export interface CourseFormData {
  id?: number;
  title?: string;
  titleEn?: string;
  titleTr?: string;
  description?: string;
  price?: number | string;
  isPremium?: boolean;
  level?: string | number;
  categoryId?: number | string;
  [key: string]: any;
}
