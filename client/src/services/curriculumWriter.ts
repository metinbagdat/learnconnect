import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  writeBatch
} from "firebase/firestore";

/**
 * AI tarafından üretilen müfredatı Firestore'a yazar
 * @param examType - "tyt" veya "ayt"
 * @param aiJson - AI'dan gelen JSON
 * @returns Promise<boolean>
 */
export async function applyCurriculumToFirestore(examType: string, aiJson: any) {
  if (!aiJson.subjects || !Array.isArray(aiJson.subjects)) {
    throw new Error("Geçersiz AI JSON: subjects dizisi bulunamadı");
  }

  try {
    // Batch kullanarak toplu yazma (performans ve tutarlılık için)
    const batch = writeBatch(db);
    
    // Ana koleksiyon yolu
    const baseCollectionPath = `curriculum/${examType}/subjects`;

    for (const subject of aiJson.subjects) {
      // Subject dokümanı için referans oluştur
      const subjectRef = doc(collection(db, baseCollectionPath));
      
      // Subject verilerini batch'e ekle
      batch.set(subjectRef, {
        title: subject.title || "",
        description: subject.description || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
        examType: examType
      });

      // Topics alt koleksiyonu oluştur
      if (subject.topics && Array.isArray(subject.topics)) {
        for (const topic of subject.topics) {
          const topicRef = doc(collection(db, `${baseCollectionPath}/${subjectRef.id}/topics`));
          
          batch.set(topicRef, {
            title: topic.title || "",
            estimatedHours: typeof topic.estimatedHours === 'number' ? topic.estimatedHours : 6,
            difficulty: ["easy", "medium", "hard"].includes(topic.difficulty) 
              ? topic.difficulty 
              : "medium",
            orderIndex: subject.topics.indexOf(topic), // Sıralama için
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // Batch'i commit et
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error("Firestore yazma hatası:", error);
    throw new Error(`Firestore'a yazılamadı: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Tek bir konu için öğrenme ağacını Firestore'a yazar
 * @param examType - "tyt" veya "ayt"
 * @param subjectId - Subject doküman ID'si
 * @param topicId - Topic doküman ID'si
 * @param learningTree - AI'dan gelen öğrenme ağacı JSON'u
 */
export async function applyLearningTreeToFirestore(
  examType: string, 
  subjectId: string, 
  topicId: string, 
  learningTree: any
) {
  if (!learningTree.topic || !Array.isArray(learningTree.subtopics)) {
    throw new Error("Geçersiz learning tree JSON");
  }

  try {
    const learningTreeRef = doc(
      db, 
      `curriculum/${examType}/subjects/${subjectId}/topics/${topicId}/learningTree/current`
    );
    
    await setDoc(learningTreeRef, {
      ...learningTree,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Learning tree yazma hatası:", error);
    throw error;
  }
}

/**
 * Çalışma planını Firestore'a yazar
 * @param userId - Kullanıcı ID
 * @param studyPlan - AI'dan gelen çalışma planı
 * @param topicId - İlgili topic ID (opsiyonel)
 */
export async function applyStudyPlanToFirestore(
  userId: string, 
  studyPlan: any, 
  topicId: string | null = null
) {
  if (!studyPlan.topic || !Array.isArray(studyPlan.dailyPlan)) {
    throw new Error("Geçersiz study plan JSON");
  }

  try {
    const studyPlanRef = doc(collection(db, `studyPlans/${userId}/plans`));
    
    await setDoc(studyPlanRef, {
      ...studyPlan,
      userId: userId,
      topicId: topicId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active"
    });
    
    return studyPlanRef.id;
  } catch (error) {
    console.error("Study plan yazma hatası:", error);
    throw error;
  }
}
