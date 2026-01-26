import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  limit,
} from 'firebase/firestore';

export interface StudyStat {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  minutes: number;
  streakCount: number;
}

export async function getTodayStats(userId: string): Promise<StudyStat | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = collection(db, 'studyStats');
    const q = query(
      statsRef,
      where('userId', '==', String(userId)),
      where('date', '==', today),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as StudyStat;
  } catch (error) {
    console.error('Error fetching today stats:', error);
    throw error;
  }
}

export async function addStudyTime(userId: string, minutes: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await getTodayStats(userId);

    if (existing) {
      // Update existing stat
      const statRef = doc(db, 'studyStats', existing.id);
      await updateDoc(statRef, {
        minutes: existing.minutes + minutes,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new stat
      // Calculate streak (simplified - would need to check previous days)
      const streakCount = 1; // TODO: Implement proper streak calculation

      await addDoc(collection(db, 'studyStats'), {
        userId: String(userId),
        date: today,
        minutes,
        streakCount,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error adding study time:', error);
    throw error;
  }
}
