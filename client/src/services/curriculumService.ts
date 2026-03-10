import { db, collections, isFirebaseConfigured } from '../lib/firebase';
import { collection, getDocs, doc, query, orderBy } from 'firebase/firestore';
import type { Subject, Topic, Subtopic, CurriculumTree } from '@/types/curriculum';

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
          { id: 'equations', name: 'Denklemler', order: 1 },
          { id: 'inequalities', name: 'Eşitsizlikler', order: 2 }
        ]
      },
      {
        id: 'geometry',
        name: 'Geometri',
        order: 2,
        estimatedTime: 60,
        difficulty: 'medium',
        subtopics: [
          { id: 'triangles', name: 'Üçgenler', order: 1 },
          { id: 'polygons', name: 'Çokgenler', order: 2 }
        ]
      },
      {
        id: 'problems',
        name: 'Problemler',
        order: 3,
        estimatedTime: 45,
        difficulty: 'easy',
        subtopics: [
          { id: 'ratio', name: 'Oran-Orantı', order: 1 },
          { id: 'percent', name: 'Yüzde Problemleri', order: 2 }
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
        id: 'reading',
        name: 'Okuma ve Anlama',
        order: 1,
        estimatedTime: 45,
        difficulty: 'medium',
        subtopics: [
          { id: 'paragraph', name: 'Paragraf', order: 1 },
          { id: 'meaning', name: 'Anlam Bilgisi', order: 2 }
        ]
      },
      {
        id: 'grammar',
        name: 'Dil Bilgisi',
        order: 2,
        estimatedTime: 45,
        difficulty: 'medium',
        subtopics: [
          { id: 'spelling', name: 'Yazım Kuralları', order: 1 },
          { id: 'punctuation', name: 'Noktalama', order: 2 }
        ]
      },
      {
        id: 'vocabulary',
        name: 'Sözcük Bilgisi',
        order: 3,
        estimatedTime: 40,
        difficulty: 'easy',
        subtopics: [
          { id: 'wordTypes', name: 'Sözcük Türleri', order: 1 },
          { id: 'meaningRelations', name: 'Anlam İlişkileri', order: 2 }
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
        estimatedTime: 50,
        difficulty: 'hard',
        subtopics: [
          { id: 'motion', name: 'Hareket', order: 1 },
          { id: 'force', name: 'Kuvvet', order: 2 }
        ]
      },
      {
        id: 'chemistry',
        name: 'Kimya',
        order: 2,
        estimatedTime: 50,
        difficulty: 'medium',
        subtopics: [
          { id: 'atoms', name: 'Atom ve Periyodik Sistem', order: 1 },
          { id: 'reactions', name: 'Kimyasal Tepkimeler', order: 2 }
        ]
      },
      {
        id: 'biology',
        name: 'Biyoloji',
        order: 3,
        estimatedTime: 45,
        difficulty: 'medium',
        subtopics: [
          { id: 'cells', name: 'Hücre', order: 1 },
          { id: 'genetics', name: 'Genetik', order: 2 }
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
        estimatedTime: 45,
        difficulty: 'medium',
        subtopics: [
          { id: 'earlyHistory', name: 'İlk Çağ', order: 1 },
          { id: 'ottoman', name: 'Osmanlı Tarihi', order: 2 }
        ]
      },
      {
        id: 'geography',
        name: 'Coğrafya',
        order: 2,
        estimatedTime: 40,
        difficulty: 'easy',
        subtopics: [
          { id: 'maps', name: 'Harita Bilgisi', order: 1 },
          { id: 'climate', name: 'İklim', order: 2 }
        ]
      },
      {
        id: 'philosophy',
        name: 'Felsefe',
        order: 3,
        estimatedTime: 35,
        difficulty: 'medium',
        subtopics: [
          { id: 'logic', name: 'Mantık', order: 1 },
          { id: 'thinkers', name: 'Düşünürler', order: 2 }
        ]
      }
    ]
  }
];

const getMockCurriculum = (): Subject[] => mockCurriculumTree;

const getMockTopics = (subjectId: string): Topic[] => {
  const subject = mockCurriculumTree.find((item) => item.id === subjectId);
  return subject?.topics ?? [];
};

const normalizeSubject = (id: string, data: Partial<Subject>): Subject => ({
  id,
  title: data.title || (data as { name?: string }).name || id,
  description: data.description,
  order: data.order ?? 0,
  totalTopics: data.totalTopics,
  estimatedHours: data.estimatedHours,
  color: data.color,
  icon: data.icon
});

const normalizeTopic = (id: string, data: Partial<Topic>): Topic => ({
  id,
  name: data.name || data.title || id,
  title: data.title,
  order: data.order ?? 0,
  estimatedTime: data.estimatedTime,
  difficulty: data.difficulty,
  subjectId: data.subjectId
});

const normalizeSubtopic = (id: string, data: Partial<Subtopic>): Subtopic => ({
  id,
  name: data.name || data.title || id,
  title: data.title,
  order: data.order ?? 0,
  estimatedTime: data.estimatedTime,
  completed: data.completed
});

// TYT Müfredatını getir (alias for compatibility)
export async function getTYTCurriculum(): Promise<Subject[]> {
  return getTYTSubjects();
}

// TYT Subjects getir
export async function getTYTSubjects(): Promise<Subject[]> {
  if (!isFirebaseConfigured) {
    return getMockCurriculum();
  }

  try {
    const subjectsRef = collection(db, collections.tytSubjects);
    const q = query(subjectsRef, orderBy('order'));
    const snapshot = await getDocs(q);
    
    const subjects = snapshot.docs.map((doc) => normalizeSubject(doc.id, doc.data() as Partial<Subject>));
    return subjects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return getMockCurriculum(); // Fallback
  }
}

// Belirli bir dersin konularını getir
export async function getSubjectTopics(subjectId: string): Promise<Topic[]> {
  if (!isFirebaseConfigured) {
    return getMockTopics(subjectId);
  }

  try {
    const topicsRef = collection(db, collections.tytSubjects, subjectId, 'topics');
    const q = query(topicsRef, orderBy('order'));
    const snapshot = await getDocs(q);
    
    const topics = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const topicData = normalizeTopic(doc.id, doc.data() as Partial<Topic>);
        
        // Get subtopics
        try {
          const subtopicsRef = collection(
            db, 
            collections.tytSubjects, 
            subjectId, 
            'topics', 
            doc.id, 
            'subtopics'
          );
          const subtopicsQ = query(subtopicsRef, orderBy('order'));
          const subtopicsSnapshot = await getDocs(subtopicsQ);
          
          topicData.subtopics = subtopicsSnapshot.docs
            .map((subDoc) => normalizeSubtopic(subDoc.id, subDoc.data() as Partial<Subtopic>))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        } catch (error) {
          topicData.subtopics = [];
        }
        
        return topicData;
      })
    );
    
    return topics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error('Error fetching topics:', error);
    return getMockTopics(subjectId);
  }
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
    
    return tree;
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
