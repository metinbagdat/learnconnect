/**
 * Firestore Seed Script - Browser Version
 * 
 * Bu script'i browser console'da çalıştırabilirsiniz
 * veya bir HTML sayfasından import edebilirsiniz
 * 
 * Usage:
 * 1. Uygulamayı başlatın: npm run dev
 * 2. Browser console'u açın (F12)
 * 3. Bu script'i çalıştırın veya import edin
 */

// Browser'da çalıştırmak için:
// 1. Bu dosyayı bir HTML sayfasına script olarak ekleyin
// 2. Veya browser console'a kopyalayıp yapıştırın

import { db } from '../client/src/lib/firebase.js';
import { collection, doc, setDoc } from 'firebase/firestore';

const tytCurriculum = {
  mathematics: {
    title: 'Matematik',
    description: 'TYT Matematik müfredatı',
    order: 1,
    totalTopics: 25,
    estimatedHours: 120,
    color: 'blue',
    icon: '🧮',
    topics: [
      { id: 'numbers', name: 'Sayılar', order: 1, estimatedTime: 15, difficulty: 'medium' },
      { id: 'algebra', name: 'Cebir', order: 2, estimatedTime: 25, difficulty: 'medium' },
      { id: 'geometry', name: 'Geometri', order: 3, estimatedTime: 30, difficulty: 'hard' },
      { id: 'data', name: 'Veri, Sayma, Olasılık', order: 4, estimatedTime: 20, difficulty: 'easy' }
    ]
  },
  turkish: {
    title: 'Türkçe',
    description: 'TYT Türkçe müfredatı',
    order: 2,
    totalTopics: 20,
    estimatedHours: 80,
    color: 'green',
    icon: '📚',
    topics: [
      { id: 'grammar', name: 'Dil Bilgisi', order: 1, estimatedTime: 20, difficulty: 'medium' },
      { id: 'reading', name: 'Okuma Anlama', order: 2, estimatedTime: 25, difficulty: 'medium' },
      { id: 'writing', name: 'Yazım Kuralları', order: 3, estimatedTime: 15, difficulty: 'easy' }
    ]
  },
  science: {
    title: 'Fen Bilimleri',
    description: 'TYT Fizik, Kimya, Biyoloji',
    order: 3,
    totalTopics: 35,
    estimatedHours: 100,
    color: 'purple',
    icon: '🔬',
    topics: [
      { id: 'physics', name: 'Fizik', order: 1, estimatedTime: 35, difficulty: 'hard' },
      { id: 'chemistry', name: 'Kimya', order: 2, estimatedTime: 35, difficulty: 'medium' },
      { id: 'biology', name: 'Biyoloji', order: 3, estimatedTime: 30, difficulty: 'medium' }
    ]
  },
  social: {
    title: 'Sosyal Bilimler',
    description: 'TYT Tarih, Coğrafya, Felsefe, Din',
    order: 4,
    totalTopics: 30,
    estimatedHours: 90,
    color: 'yellow',
    icon: '🌍',
    topics: [
      { id: 'history', name: 'Tarih', order: 1, estimatedTime: 25, difficulty: 'medium' },
      { id: 'geography', name: 'Coğrafya', order: 2, estimatedTime: 25, difficulty: 'medium' },
      { id: 'philosophy', name: 'Felsefe', order: 3, estimatedTime: 20, difficulty: 'medium' },
      { id: 'religion', name: 'Din Kültürü', order: 4, estimatedTime: 20, difficulty: 'easy' }
    ]
  }
};

export async function seedFirestore() {
  try {
    console.log('🚀 Starting Firestore seed...');
    
    for (const [subjectId, subjectData] of Object.entries(tytCurriculum)) {
      // Create subject document in curriculum/tyt/subjects
      const subjectRef = doc(db, 'curriculum', 'tyt', 'subjects', subjectId);
      await setDoc(subjectRef, {
        title: subjectData.title,
        description: subjectData.description,
        order: subjectData.order,
        totalTopics: subjectData.totalTopics,
        estimatedHours: subjectData.estimatedHours,
        color: subjectData.color,
        icon: subjectData.icon,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Added subject: ${subjectData.title}`);
      
      // Add topics as subcollection
      for (const topic of subjectData.topics) {
        const topicRef = doc(db, 'curriculum', 'tyt', 'subjects', subjectId, 'topics', topic.id);
        await setDoc(topicRef, {
          name: topic.name,
          order: topic.order,
          estimatedTime: topic.estimatedTime,
          difficulty: topic.difficulty,
          subjectId: subjectId,
          createdAt: new Date().toISOString()
        });
        
        console.log(`   ✅ Topic: ${topic.name}`);
      }
    }
    
    console.log('');
    console.log('🎉 Firestore seed completed successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    return { success: false, error: error.message };
  }
}

// Browser console'dan çalıştırmak için
if (typeof window !== 'undefined') {
  window.seedFirestore = seedFirestore;
  console.log('💡 Seed function available: window.seedFirestore()');
}
