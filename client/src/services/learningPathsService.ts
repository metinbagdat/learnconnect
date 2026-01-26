import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

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
    const pathsRef = collection(db, 'learningPaths');
    const q = query(pathsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LearningPath[];
  } catch (error) {
    console.error('Error fetching paths:', error);
    throw error;
  }
}

export async function getPathById(pathId: string): Promise<LearningPath | null> {
  try {
    const pathRef = doc(db, 'learningPaths', pathId);
    const pathSnap = await getDoc(pathRef);
    
    if (!pathSnap.exists()) {
      return null;
    }
    
    return {
      id: pathSnap.id,
      ...pathSnap.data(),
    } as LearningPath;
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
    const progressRef = collection(db, 'userPathProgress');
    let q = query(progressRef, where('userId', '==', String(userId)));
    
    if (pathId) {
      q = query(q, where('pathId', '==', pathId));
    }
    
    const snapshot = await getDocs(q);
    const progressMap: Record<string, UserPathProgress> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      progressMap[data.pathId] = {
        id: doc.id,
        ...data,
      } as UserPathProgress;
    });
    
    return progressMap;
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
}

export async function startPath(userId: string, pathId: string): Promise<string> {
  try {
    // Check if progress already exists
    const existing = await getUserProgress(userId, pathId);
    if (existing[pathId]) {
      return existing[pathId].id || '';
    }

    // Create new progress
    const docRef = await addDoc(collection(db, 'userPathProgress'), {
      userId: String(userId),
      pathId,
      completedStepIds: [],
      progressPercent: 0,
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
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
    const progress = await getUserProgress(userId, pathId);
    const existing = progress[pathId];

    if (!existing) {
      // Start path if not started
      await startPath(userId, pathId);
    }

    const completedSteps = existing
      ? [...(existing.completedStepIds || []), stepId]
      : [stepId];

    // Remove duplicates
    const uniqueCompletedSteps = Array.from(new Set(completedSteps));
    const progressPercent = Math.round((uniqueCompletedSteps.length / totalSteps) * 100);

    // Update progress
    if (existing?.id) {
      const progressRef = doc(db, 'userPathProgress', existing.id);
      await updateDoc(progressRef, {
        completedStepIds: uniqueCompletedSteps,
        progressPercent,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create if doesn't exist
      await addDoc(collection(db, 'userPathProgress'), {
        userId: String(userId),
        pathId,
        completedStepIds: uniqueCompletedSteps,
        progressPercent,
        startedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error completing step:', error);
    throw error;
  }
}
