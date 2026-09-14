import { db, collections } from '../lib/firebase';
import { collection, getDocs, doc, query, orderBy } from 'firebase/firestore';
import type { Subject, Topic, Subtopic, CurriculumTree } from '@/types/curriculum';

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

function normalizeTopic(id: string, data: Record<string, unknown>, subjectId?: string): Topic {
  return {
    id,
    name: String(data.name || data.title || id),
    title: (data.title as string | undefined) || String(data.name || id),
    order: Number(data.order || 0),
    estimatedTime: data.estimatedTime as number | undefined,
    difficulty: data.difficulty as Topic['difficulty'],
    subjectId,
    subtopics: []
  };
}

// TYT Müfredatını getir (alias for compatibility)
export async function getTYTCurriculum(): Promise<Subject[]> {
  return getTYTSubjects();
}

// TYT Subjects getir
export async function getTYTSubjects(): Promise<Subject[]> {
  try {
    const subjectsRef = collection(db, collections.tytSubjects);
    let snapshot;
    try {
      const q = query(subjectsRef, orderBy('order'));
      snapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback when order field is missing
      snapshot = await getDocs(subjectsRef);
    }
    
    const subjects = snapshot.docs.map((docSnap) =>
      normalizeSubject(docSnap.id, docSnap.data() as Record<string, unknown>)
    );

    if (subjects.length === 0) {
      return getMockSubjects();
    }

    return subjects.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return getMockSubjects(); // Fallback
  }
}

// Belirli bir dersin konularını getir
export async function getSubjectTopics(subjectId: string): Promise<Topic[]> {
  try {
    const topicsRef = collection(db, collections.tytSubjects, subjectId, 'topics');
    let snapshot;
    try {
      const q = query(topicsRef, orderBy('order'));
      snapshot = await getDocs(q);
    } catch (orderError) {
      snapshot = await getDocs(topicsRef);
    }
    
    const topics = await Promise.all(
      snapshot.docs.map(async (topicDoc) => {
        const topicData = normalizeTopic(
          topicDoc.id,
          topicDoc.data() as Record<string, unknown>,
          subjectId
        );
        
        // Get subtopics
        try {
          const subtopicsRef = collection(
            db, 
            collections.tytSubjects, 
            subjectId, 
            'topics', 
            topicDoc.id, 
            'subtopics'
          );
          let subtopicsSnapshot;
          try {
            const subtopicsQ = query(subtopicsRef, orderBy('order'));
            subtopicsSnapshot = await getDocs(subtopicsQ);
          } catch (orderError) {
            subtopicsSnapshot = await getDocs(subtopicsRef);
          }
          
          topicData.subtopics = subtopicsSnapshot.docs
            .map((subDoc) => {
              const data = subDoc.data() as Record<string, unknown>;
              return {
                id: subDoc.id,
                name: String(data.name || data.title || subDoc.id),
                title: data.title as string | undefined,
                order: Number(data.order || 0),
                estimatedTime: data.estimatedTime as number | undefined,
                completed: Boolean(data.completed)
              } as Subtopic;
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (error) {
          topicData.subtopics = [];
        }
        
        return topicData;
      })
    );
    
    return topics.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching topics:', error);
    return getMockSubjectTopics(subjectId);
  }
}

const mockCurriculumTree: CurriculumTree[] = [
  {
    id: 'mathematics',
    title: 'Matematik',
    description: 'TYT Matematik müfredatı',
    totalTopics: 25,
    estimatedHours: 120,
    order: 1,
    color: 'blue',
    icon: '🧮',
    topics: [
      {
        id: 'algebra',
        name: 'Cebir',
        order: 1,
        estimatedTime: 60,
        difficulty: 'medium',
        subtopics: [
          { id: 'equations', name: 'Denklemler', order: 1, estimatedTime: 30 },
          { id: 'inequalities', name: 'Eşitsizlikler', order: 2, estimatedTime: 30 }
        ]
      },
      {
        id: 'geometry',
        name: 'Geometri',
        order: 2,
        estimatedTime: 60,
        difficulty: 'medium',
        subtopics: [
          { id: 'triangles', name: 'Üçgenler', order: 1, estimatedTime: 30 },
          { id: 'circles', name: 'Çember ve Daire', order: 2, estimatedTime: 30 }
        ]
      }
    ]
  },
  {
    id: 'turkish',
    title: 'Türkçe',
    description: 'TYT Türkçe müfredatı',
    totalTopics: 20,
    estimatedHours: 80,
    order: 2,
    color: 'green',
    icon: '📚',
    topics: [
      {
        id: 'grammar',
        name: 'Dil Bilgisi',
        order: 1,
        estimatedTime: 45,
        difficulty: 'easy',
        subtopics: [
          { id: 'verbs', name: 'Fiiller', order: 1, estimatedTime: 20 },
          { id: 'sentence', name: 'Cümle Bilgisi', order: 2, estimatedTime: 25 }
        ]
      },
      {
        id: 'reading',
        name: 'Paragraf',
        order: 2,
        estimatedTime: 45,
        difficulty: 'medium',
        subtopics: [
          { id: 'main-idea', name: 'Ana Düşünce', order: 1, estimatedTime: 20 },
          { id: 'structure', name: 'Paragraf Yapısı', order: 2, estimatedTime: 25 }
        ]
      }
    ]
  },
  {
    id: 'science',
    title: 'Fen Bilimleri',
    description: 'TYT Fizik, Kimya, Biyoloji',
    totalTopics: 35,
    estimatedHours: 100,
    order: 3,
    color: 'purple',
    icon: '🔬',
    topics: [
      {
        id: 'physics',
        name: 'Fizik',
        order: 1,
        estimatedTime: 60,
        difficulty: 'medium',
        subtopics: [
          { id: 'motion', name: 'Hareket', order: 1, estimatedTime: 30 },
          { id: 'force', name: 'Kuvvet', order: 2, estimatedTime: 30 }
        ]
      },
      {
        id: 'chemistry',
        name: 'Kimya',
        order: 2,
        estimatedTime: 60,
        difficulty: 'medium',
        subtopics: [
          { id: 'atoms', name: 'Atom ve Periyodik Sistem', order: 1, estimatedTime: 30 },
          { id: 'bonds', name: 'Kimyasal Bağlar', order: 2, estimatedTime: 30 }
        ]
      }
    ]
  },
  {
    id: 'social',
    title: 'Sosyal Bilimler',
    description: 'TYT Tarih, Coğrafya, Felsefe, Din',
    totalTopics: 30,
    estimatedHours: 90,
    order: 4,
    color: 'yellow',
    icon: '🌍',
    topics: [
      {
        id: 'history',
        name: 'Tarih',
        order: 1,
        estimatedTime: 50,
        difficulty: 'medium',
        subtopics: [
          { id: 'ottoman', name: 'Osmanlı Tarihi', order: 1, estimatedTime: 25 },
          { id: 'republic', name: 'Cumhuriyet Dönemi', order: 2, estimatedTime: 25 }
        ]
      },
      {
        id: 'geography',
        name: 'Coğrafya',
        order: 2,
        estimatedTime: 40,
        difficulty: 'easy',
        subtopics: [
          { id: 'climate', name: 'İklim', order: 1, estimatedTime: 20 },
          { id: 'population', name: 'Nüfus', order: 2, estimatedTime: 20 }
        ]
      }
    ]
  }
];

function getMockSubjects(): Subject[] {
  return mockCurriculumTree.map(({ topics, ...subject }) => ({ ...subject }));
}

function getMockSubjectTopics(subjectId: string): Topic[] {
  return mockCurriculumTree.find((subject) => subject.id === subjectId)?.topics ?? [];
}

// Müfredat ağacını getir (dersler + konular + alt konular)
export async function getCurriculumTree(): Promise<CurriculumTree[]> {
  try {
    const subjects = await getTYTCurriculum();
    
    const tree = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await getSubjectTopics(subject.id);

        return {
          ...subject,
          topics
        } as CurriculumTree;
      })
    );
    
    return tree.length > 0 ? tree : mockCurriculumTree;
  } catch (error) {
    console.error('Error fetching curriculum tree:', error);
    return mockCurriculumTree;
  }
}

// Kullanıcının ilerlemesini kaydet
export async function saveUserProgress(
  userId: string, 
  subjectId: string, 
  topicId: string, 
  progress: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { setDoc } = await import('firebase/firestore');
    const progressRef = doc(db, collections.userProgress, `${userId}_${subjectId}_${topicId}`);
    
    await setDoc(progressRef, {
      userId,
      subjectId,
      topicId,
      ...progress,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Progress saved:', { userId, subjectId, topicId, progress });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving progress:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
