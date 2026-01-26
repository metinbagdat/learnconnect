/**
 * AYT AIReasoningEngine API client
 * Calls /api/ai/generate-ayt-curriculum, generate-learning-tree, generate-study-plan
 */

export interface AYTSubject {
  title: string;
  description: string;
  topics: Array<{
    title: string;
    estimatedHours: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export interface AYTCurriculumResponse {
  success: boolean;
  data?: { subjects: AYTSubject[] };
  error?: string;
  message?: string;
}

export interface LearningTreeSubtopic {
  title: string;
  prerequisites: string[];
  outcomes: string[];
}

export interface LearningTreeData {
  topic: string;
  subtopics: LearningTreeSubtopic[];
}

export interface LearningTreeResponse {
  success: boolean;
  data?: LearningTreeData;
  error?: string;
  message?: string;
}

export interface StudyPlanDay {
  day: number;
  focus: string;
  tasks: string[];
}

export interface StudyPlanData {
  topic: string;
  totalDays: number;
  dailyPlan: StudyPlanDay[];
  _meta?: { userId?: string; topicId?: string };
}

export interface StudyPlanResponse {
  success: boolean;
  data?: StudyPlanData;
  error?: string;
  message?: string;
}

async function apiPost<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }
  return json as T;
}

export async function generateAYTCurriculumApi(): Promise<AYTCurriculumResponse> {
  try {
    const json = await apiPost<{ success: boolean; data?: { subjects: AYTSubject[] }; error?: string; message?: string }>(
      '/api/ai/generate-ayt-curriculum',
      {}
    );
    if (!json.success || !json.data?.subjects) {
      return {
        success: false,
        error: json?.message || json?.error || 'Invalid response',
      };
    }
    return { success: true, data: { subjects: json.data.subjects } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function generateLearningTreeApi(
  topicTitle: string,
  subject: string = 'AYT Matematik'
): Promise<LearningTreeResponse> {
  try {
    const json = await apiPost<{ success: boolean; data?: LearningTreeData; error?: string; message?: string }>(
      '/api/ai/generate-learning-tree',
      { topicTitle, subject }
    );
    if (!json.success || !json.data) {
      return {
        success: false,
        error: json?.message || json?.error || 'Invalid response',
      };
    }
    return { success: true, data: json.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function generateStudyPlanApi(
  topicTitle: string,
  estimatedHours: number = 8,
  studentLevel: string = 'orta',
  dailyHours: number = 2
): Promise<StudyPlanResponse> {
  try {
    const json = await apiPost<{ success: boolean; data?: StudyPlanData; error?: string; message?: string }>(
      '/api/ai/generate-study-plan',
      { topicTitle, totalHours: estimatedHours, level: studentLevel, dailyHours }
    );
    if (!json.success || !json.data) {
      return {
        success: false,
        error: json?.message || json?.error || 'Invalid response',
      };
    }
    return { success: true, data: json.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
