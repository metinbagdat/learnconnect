/**
 * Analytics type definitions
 */

export interface TimeTrackingData {
  userId?: number | string;
  courseId?: number | string;
  duration?: number;
  date?: string | Date;
  [key: string]: any;
}

export interface InteractionData {
  userId?: number | string;
  type?: string;
  targetId?: number | string;
  timestamp?: string | Date;
  [key: string]: any;
}

export interface AnalyticsApiResponse {
  data?: TimeTrackingData[] | InteractionData[];
  error?: string;
  [key: string]: any;
}
