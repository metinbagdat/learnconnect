const LEARNING_PATHS_API = '/api/learning-paths';
const LEARNING_PATHS_PROGRESS_API = '/api/learning-paths/progress';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedDays: number;
  steps: PathStep[];
  tags: string[];
  createdAt: any;
  updatedAt?: any;
}

export interface PathStep {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  order: number;
  type: 'lesson' | 'practice' | 'quiz' | 'project';
}

export interface UserPathProgress {
  id?: string;
  userId: string;
  pathId: string;
  completedStepIds: string[];
  progressPercent: number;
  startedAt: any;
  updatedAt: any;
}

export async function getAllPaths(): Promise<LearningPath[]> {
  try {
    const response = await fetch(LEARNING_PATHS_API, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Learning paths request failed: ${response.status}`);
    }

    const paths = await response.json();
    return Array.isArray(paths) ? (paths as LearningPath[]) : [];
  } catch (error) {
    console.error('Error fetching paths:', error);
    throw error;
  }
}

export async function getPathById(pathId: string): Promise<LearningPath | null> {
  try {
    const response = await fetch(`${LEARNING_PATHS_API}?pathId=${encodeURIComponent(pathId)}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Learning path request failed: ${response.status}`);
    }

    const paths = await response.json();
    if (!Array.isArray(paths)) {
      return null;
    }

    return paths.find((path: LearningPath) => String(path.id) === String(pathId)) || null;
  } catch (error) {
    console.error('Error fetching path:', error);
    throw error;
  }
}

export async function getUserProgress(
  userId: string,
  pathId?: string
): Promise<Record<string, UserPathProgress>> {
  try {
    const params = new URLSearchParams({ userId: String(userId) });
    if (pathId) {
      params.set('pathId', pathId);
    }

    const response = await fetch(`${LEARNING_PATHS_PROGRESS_API}?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Learning path progress request failed: ${response.status}`);
    }

    const progress = await response.json();
    return progress && typeof progress === 'object' && !Array.isArray(progress)
      ? (progress as Record<string, UserPathProgress>)
      : {};
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
}

export async function startPath(userId: string, pathId: string): Promise<string> {
  try {
    const response = await fetch(LEARNING_PATHS_PROGRESS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: String(userId),
        pathId,
        completedStepIds: [],
        progressPercent: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Start path failed: ${response.status}`);
    }

    const result = await response.json();
    return String(result?.id || '');
  } catch (error) {
    console.error('Error starting path:', error);
    throw error;
  }
}

export async function completeStep(
  userId: string,
  pathId: string,
  stepId: string,
  totalSteps: number
): Promise<void> {
  try {
    const response = await fetch(LEARNING_PATHS_PROGRESS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: String(userId),
        pathId,
        stepId,
        totalSteps,
      }),
    });

    if (!response.ok) {
      throw new Error(`Complete step failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error completing step:', error);
    throw error;
  }
}
