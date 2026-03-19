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

/** Static TYT Matematik 30 Gün path (plan: statik olarak tanımla) */
export const DEFAULT_TYT_MATEMATIK_PATH_ID = 'tyt-matematik-30-gun';

export function getDefaultPath(): LearningPath {
  return {
    id: DEFAULT_TYT_MATEMATIK_PATH_ID,
    title: 'TYT Matematik 30 Gün',
    description: 'TYT matematik konularını 30 günde tamamla. Adım adım ilerleyerek tüm konuları öğren ve sınava hazırlan.',
    category: 'TYT',
    estimatedDays: 30,
    tags: ['tyt', 'matematik', 'sınav', 'temel'],
    steps: [
      { id: 'step-1', title: 'Temel Kavramlar', description: 'Sayılar, işlemler, temel matematik kavramları', estimatedMinutes: 60, order: 1, type: 'lesson' },
      { id: 'step-2', title: 'Sayı Basamakları', description: 'Basamak değeri, sayı sistemleri', estimatedMinutes: 45, order: 2, type: 'lesson' },
      { id: 'step-3', title: 'Cebir - Denklemler', description: 'Birinci ve ikinci derece denklemler, eşitsizlikler', estimatedMinutes: 90, order: 3, type: 'lesson' },
      { id: 'step-4', title: 'Fonksiyonlar', description: 'Fonksiyon kavramı, grafikler', estimatedMinutes: 75, order: 4, type: 'lesson' },
      { id: 'step-5', title: 'Geometri - Temel Şekiller', description: 'Üçgen, dörtgen, çember temel özellikleri', estimatedMinutes: 120, order: 5, type: 'lesson' },
      { id: 'step-6', title: 'Geometri - Alan ve Çevre', description: 'Geometrik şekillerin alan ve çevre hesaplamaları', estimatedMinutes: 90, order: 6, type: 'practice' },
      { id: 'step-7', title: 'Olasılık ve İstatistik', description: 'Temel olasılık, veri analizi', estimatedMinutes: 60, order: 7, type: 'lesson' },
      { id: 'step-8', title: 'TYT Matematik Denemesi', description: 'Tüm konuları kapsayan deneme sınavı', estimatedMinutes: 75, order: 8, type: 'quiz' },
    ],
    createdAt: null,
    updatedAt: null,
  };
}

export async function getAllPaths(): Promise<LearningPath[]> {
  try {
    const pathsRef = collection(db, 'learningPaths');
    const q = query(pathsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const paths = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LearningPath[];
    return paths.length > 0 ? paths : [getDefaultPath()];
  } catch (error) {
    console.error('Error fetching paths:', error);
    throw error;
  }
}

export async function getPathById(pathId: string): Promise<LearningPath | null> {
  if (pathId === DEFAULT_TYT_MATEMATIK_PATH_ID) {
    return getDefaultPath();
  }
  try {
    const pathRef = doc(db, 'learningPaths', pathId);
    const pathSnap = await getDoc(pathRef);
    if (!pathSnap.exists()) return null;
    return { id: pathSnap.id, ...pathSnap.data() } as LearningPath;
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
