import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subject } from '@/types/curriculum';

/**
 * Custom hook for real-time curriculum updates
 * Uses Firestore onSnapshot for live data synchronization
 */
export function useRealtimeCurriculum(examType: 'tyt' | 'ayt' | 'yks') {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const subjectsRef = collection(db, `curriculum/${examType}/subjects`);
    const q = query(subjectsRef, orderBy('order', 'asc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const subjectsData: Subject[] = [];

          for (const subjectDoc of snapshot.docs) {
            const subjectData = subjectDoc.data();

            // Load topics subcollection
            const topicsRef = collection(
              db,
              `curriculum/${examType}/subjects/${subjectDoc.id}/topics`
            );
            const topicsQuery = query(topicsRef, orderBy('order', 'asc'));

            // Also listen to topics in real-time
            const topicsSnapshot = await new Promise<any>((resolve) => {
              onSnapshot(topicsQuery, resolve, { includeMetadataChanges: false });
            });

            const topics = await Promise.all(
              topicsSnapshot.docs.map(async (topicDoc: any) => {
                const topicData = topicDoc.data();

                // Load subtopics
                const subtopicsRef = collection(
                  db,
                  `curriculum/${examType}/subjects/${subjectDoc.id}/topics/${topicDoc.id}/subtopics`
                );
                const subtopicsQuery = query(subtopicsRef, orderBy('order', 'asc'));
                const subtopicsSnapshot = await new Promise<any>((resolve) => {
                  onSnapshot(subtopicsQuery, resolve);
                });

                return {
                  id: topicDoc.id,
                  ...topicData,
                  subtopics: subtopicsSnapshot.docs.map((subDoc: any) => ({
                    id: subDoc.id,
                    ...subDoc.data()
                  }))
                };
              })
            );

            subjectsData.push({
              id: subjectDoc.id,
              ...subjectData,
              topics
            } as Subject);
          }

          setSubjects(subjectsData);
          setLoading(false);
        } catch (err) {
          console.error('Error loading real-time curriculum:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [examType]);

  return { subjects, loading, error };
}
