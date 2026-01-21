/**
 * Firestore Seed Script - Browser Console Version
 * 
 * KULLANIM:
 * 1. npm run dev ile uygulamayı başlatın
 * 2. Browser'da uygulamayı açın (http://localhost:5173 veya port neyse)
 * 3. F12 ile Developer Console'u açın
 * 4. Bu dosyanın TAMAMINI kopyalayıp console'a yapıştırın
 * 5. Enter'a basın
 * 
 * NOT: Firebase SDK browser'da yüklü olmalı (npm run dev çalışıyorsa yüklü olur)
 */

// Firebase import'ları (browser'da mevcut olmalı)
// Eğer import çalışmazsa, global Firebase objesini kullanın

(async function seedFirestore() {
  try {
    console.log('🚀 Starting Firestore seed from browser console...');
    
    // Firebase'i import et (browser'da mevcut olmalı)
    const { db } = await import('/client/src/lib/firebase.js');
    const { doc, setDoc } = await import('firebase/firestore');
    
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
    
    console.log('📝 Seeding curriculum data...');
    
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
    console.log('');
    console.log('📚 Data structure created:');
    console.log('   curriculum/tyt/subjects/{subjectId}');
    console.log('   curriculum/tyt/subjects/{subjectId}/topics/{topicId}');
    
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Make sure npm run dev is running');
    console.error('   2. Check Firebase config in .env');
    console.error('   3. Verify Firestore is enabled in Firebase Console');
    console.error('   4. Check Firestore security rules');
  }
})();
