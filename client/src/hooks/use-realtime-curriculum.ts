import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, type Firestore } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { CurriculumTree, Subject, Subtopic, Topic } from '@/types/curriculum';

type ExamType = 'tyt' | 'ayt' | 'yks';

function normalizeSubject(id: string, data: Record<string, unknown>): Subject {
  const title = String(data.title || data.name || id);
  return {
    id,
    title,
    description: data.description as string | undefined,
    order: Number(data.order || 0),
    totalTopics: data.totalTopics as number | undefined,
    estimatedHours: data.estimatedHours as number | undefined,
    color: data.color as string | undefined,
    icon: data.icon as string | undefined
  };
}

async function loadTopics(
  firestore: Firestore,
  examType: ExamType,
  subjectId: string
): Promise<Topic[]> {
  const topicsRef = collection(firestore, `curriculum/${examType}/subjects/${subjectId}/topics`);

  let topicsSnapshot;
  try {
    topicsSnapshot = await getDocs(query(topicsRef, orderBy('order', 'asc')));
  } catch {
    topicsSnapshot = await getDocs(topicsRef);
  }

  const topics = await Promise.all(
    topicsSnapshot.docs.map(async (topicDoc) => {
      const topicData = topicDoc.data();
      const subtopicsRef = collection(
        firestore,
        `curriculum/${examType}/subjects/${subjectId}/topics/${topicDoc.id}/subtopics`
      );

      let subtopicsSnapshot;
      try {
        subtopicsSnapshot = await getDocs(query(subtopicsRef, orderBy('order', 'asc')));
      } catch {
        subtopicsSnapshot = await getDocs(subtopicsRef);
      }

      const subtopics: Subtopic[] = subtopicsSnapshot.docs.map((subDoc) => {
        const data = subDoc.data();
        return {
          id: subDoc.id,
          name: String(data.name || data.title || subDoc.id),
          title: data.title as string | undefined,
          order: Number(data.order || 0),
          estimatedTime: data.estimatedTime as number | undefined,
          completed: Boolean(data.completed)
        };
      });

      return {
        id: topicDoc.id,
        name: String(topicData.name || topicData.title || topicDoc.id),
        title: topicData.title as string | undefined,
        order: Number(topicData.order || 0),
        estimatedTime: topicData.estimatedTime as number | undefined,
        difficulty: topicData.difficulty as Topic['difficulty'],
        subjectId,
        subtopics: subtopics.sort((a, b) => (a.order || 0) - (b.order || 0))
      } as Topic;
    })
  );

  return topics.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Real-time TYT/AYT/YKS curriculum listener.
 * Subjects stream via onSnapshot; nested topics/subtopics load with getDocs.
 */
export function useRealtimeCurriculum(examType: ExamType = 'tyt') {
  const [subjects, setSubjects] = useState<CurriculumTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured || !db) {
      setSubjects([]);
      setLoading(false);
      setError('Firebase not configured');
      return () => {
        cancelled = true;
      };
    }

    const firestore = db;
    const subjectsRef = collection(firestore, `curriculum/${examType}/subjects`);
    let q;
    try {
      q = query(subjectsRef, orderBy('order', 'asc'));
    } catch {
      q = subjectsRef;
    }

    const unsubscribe = onSnapshot(
      q as ReturnType<typeof query>,
      async (snapshot) => {
        try {
          const tree = await Promise.all(
            snapshot.docs.map(async (subjectDoc) => {
              const subject = normalizeSubject(subjectDoc.id, subjectDoc.data());
              const topics = await loadTopics(firestore, examType, subjectDoc.id);
              return {
                ...subject,
                topics,
                totalTopics: subject.totalTopics || topics.length
              } as CurriculumTree;
            })
          );

          if (!cancelled) {
            setSubjects(tree.sort((a, b) => (a.order || 0) - (b.order || 0)));
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          console.error('Error loading real-time curriculum:', err);
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setLoading(false);
          }
        }
      },
      (err) => {
        console.error('Snapshot error:', err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [examType]);

  return { subjects, loading, error };
}
