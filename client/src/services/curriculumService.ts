import { db, collections } from '../lib/firebase';
import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import type { Subject, Topic, Subtopic, CurriculumTree } from '@/types/curriculum';

// TYT Müfredatını getir (alias for compatibility)
export async function getTYTCurriculum(): Promise<Subject[]> {
  return getTYTSubjects();
}

// TYT Subjects getir
export async function getTYTSubjects(): Promise<Subject[]> {
  try {
    const subjectsRef = collection(db, collections.tytSubjects);
    const q = query(subjectsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const subjects: Subject[] = [];
    snapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data()
      } as Subject);
    });
    
    return subjects;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return getMockCurriculum(); // Fallback
  }
}

// Belirli bir dersin konularını getir
export async function getSubjectTopics(subjectId: string): Promise<Topic[]> {
  try {
    const topicsRef = collection(db, collections.tytSubjects, subjectId, 'topics');
    const q = query(topicsRef, orderBy('order'));
    const snapshot = await getDocs(q);
    
    const topics = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const topicData = { id: doc.id, ...doc.data() } as Topic;
        
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
          
          topicData.subtopics = subtopicsSnapshot.docs.map(subDoc => ({
            id: subDoc.id,
            ...subDoc.data()
          } as Subtopic));
        } catch (error) {
          topicData.subtopics = [];
        }
        
        return topicData;
      })
    );
    
    return topics;
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
}

// Demo müfredat (Firestore yoksa)
function getMockCurriculum(): Subject[] {
  return [
    {
      id: 'mathematics',
      title: 'Matematik',
      description: 'TYT Matematik müfredatı',
      totalTopics: 25,
      estimatedHours: 120,
      order: 1,
      color: 'blue',
      icon: '🧮'
    },
    {
      id: 'turkish',
      title: 'Türkçe',
      description: 'TYT Türkçe müfredatı',
      totalTopics: 20,
      estimatedHours: 80,
      order: 2,
      color: 'green',
      icon: '📚'
    },
    {
      id: 'science',
      title: 'Fen Bilimleri',
      description: 'TYT Fizik, Kimya, Biyoloji',
      totalTopics: 35,
      estimatedHours: 100,
      order: 3,
      color: 'purple',
      icon: '🔬'
    },
    {
      id: 'social',
      title: 'Sosyal Bilimler',
      description: 'TYT Tarih, Coğrafya, Felsefe, Din',
      totalTopics: 30,
      estimatedHours: 90,
      order: 4,
      color: 'yellow',
      icon: '🌍'
    }
  ];
}

// Müfredat ağacını getir (dersler + konular + alt konular)
export async function getCurriculumTree(): Promise<CurriculumTree[]> {
  try {
    const subjects = await getTYTCurriculum();
    
    const tree = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await getSubjectTopics(subject.id);
        
        const topicsWithSubtopics = await Promise.all(
          topics.map(async (topic) => {
            try {
              const subtopicsRef = collection(
                db, 
                collections.tytCurriculum, 
                subject.id, 
                'topics', 
                topic.id, 
                'subtopics'
              );
              
              const subtopicsSnapshot = await getDocs(subtopicsRef);
              const subtopics: Subtopic[] = [];
              
              subtopicsSnapshot.forEach((doc) => {
                subtopics.push({
                  id: doc.id,
                  ...doc.data()
                } as Subtopic);
              });
              
              return {
                ...topic,
                subtopics: subtopics.sort((a, b) => (a.order || 0) - (b.order || 0))
              };
            } catch (error) {
              return { ...topic, subtopics: [] };
            }
          })
        );
        
        return {
          ...subject,
          topics: topicsWithSubtopics
        } as CurriculumTree;
      })
    );
    
    return tree;
  } catch (error) {
    console.error('Error fetching curriculum tree:', error);
    // Return mock data on error
    const mockSubjects = getMockCurriculum();
    return mockSubjects.map(subject => ({
      ...subject,
      topics: []
    })) as CurriculumTree[];
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
