/**
 * Firestore Seed Script - Browser Console Version (FIXED)
 * 
 * KULLANIM:
 * 1. npm run dev ile uygulamayı başlatın (http://localhost:5173)
 * 2. Browser'da Developer Console'u açın (F12)
 * 3. Aşağıdaki kodu TEK BLOK olarak kopyalayıp console'a yapıştırın
 * 4. Enter'a basın
 * 
 * NOT: Bu script, app'in zaten yüklediği Firebase instance'ını kullanır
 */

(async function() {
  try {
    console.log('🚀 Starting Firestore seed from browser console...');
    console.log('');
    
    // Firebase modüllerini dynamic import et (Vite dev server'dan)
    // App zaten Firebase'i yüklemiş olmalı, bu yüzden node_modules'dan import edebiliriz
    const firebaseApp = await import('/node_modules/firebase/app/dist/index.esm.js');
    const firebaseFirestore = await import('/node_modules/firebase/firestore/dist/index.esm.js');
    
    const { initializeApp } = firebaseApp;
    const { getFirestore, doc, setDoc } = firebaseFirestore;
    
    // Firebase config - .env'den alınan değerler (browser'da import.meta.env kullanılır)
    // Ama console'da import.meta.env yok, bu yüzden manuel olarak girmelisiniz
    // VEYA app'in zaten initialize ettiği Firebase instance'ını kullanabilirsiniz
    
    // Alternatif: Window objesine Firebase eklenmişse onu kullan
    if (window.__FIREBASE_APP__) {
      console.log('✓ Using existing Firebase instance from app');
      var db = window.__FIREBASE_DB__;
    } else {
      // Manuel config (BURAYA KENDİ DEĞERLERİNİZİ GİRİN)
      const firebaseConfig = {
        apiKey: "AIzaSyDeZACW1poVyTucZgq0Y1JnqlAumRhnwkg",  // .env'den kopyalayın
        authDomain: "learnconnect-7c499.firebaseapp.com",
        projectId: "learnconnect-7c499",
        storageBucket: "learnconnect-7c499.firebasestorage.app",
        messagingSenderId: "94708429652",
        appId: "1:94708429652:web:af1e854867d6eeaf3dcec1"
      };
      
      const app = initializeApp(firebaseConfig);
      var db = getFirestore(app);
      console.log('✓ Firebase initialized with manual config');
    }
    
    console.log('');
    console.log('📝 Seeding curriculum data...');
    console.log('');
    
    // TYT Curriculum data
    const tytCurriculum = {
      subjects: [
        {
          id: 'mathematics',
          name: 'Matematik',
          title: 'Matematik',
          description: 'TYT Matematik müfredatı',
          icon: '🧮',
          color: 'blue',
          order: 1,
          estimatedHours: 120,
          totalTopics: 25,
          topics: [
            {
              id: 'numbers',
              name: 'Sayılar',
              order: 1,
              estimatedHours: 15,
              difficulty: 'medium',
              subtopics: [
                'Doğal Sayılar', 'Tam Sayılar', 'Rasyonel Sayılar', 
                'Üslü Sayılar', 'Köklü Sayılar', 'Çarpanlar ve Katlar'
              ]
            },
            {
              id: 'algebra',
              name: 'Cebir',
              order: 2,
              estimatedHours: 25,
              difficulty: 'medium',
              subtopics: [
                'Basit Denklemler', 'Oran-Orantı', 'Sayı Problemleri',
                'Kesir Problemleri', 'Yaş Problemleri', 'İşçi-Havuz Problemleri'
              ]
            },
            {
              id: 'geometry',
              name: 'Geometri',
              order: 3,
              estimatedHours: 30,
              difficulty: 'hard',
              subtopics: [
                'Temel Geometri', 'Üçgenler', 'Dörtgenler', 
                'Çember', 'Analitik Geometri'
              ]
            },
            {
              id: 'data',
              name: 'Veri, Sayma, Olasılık',
              order: 4,
              estimatedHours: 20,
              difficulty: 'easy',
              subtopics: [
                'Veri Analizi', 'Sayma', 'Permütasyon', 
                'Kombinasyon', 'Olasılık'
              ]
            }
          ]
        },
        {
          id: 'turkish',
          name: 'Türkçe',
          title: 'Türkçe',
          description: 'TYT Türkçe müfredatı',
          icon: '📚',
          color: 'green',
          order: 2,
          estimatedHours: 80,
          totalTopics: 20,
          topics: [
            {
              id: 'grammar',
              name: 'Dil Bilgisi',
              order: 1,
              estimatedHours: 20,
              difficulty: 'medium',
              subtopics: [
                'Sözcük Türleri', 'Sözcükte Anlam', 'Cümlede Anlam',
                'Paragraf', 'Yazım Kuralları', 'Noktalama İşaretleri'
              ]
            },
            {
              id: 'reading',
              name: 'Okuma Anlama',
              order: 2,
              estimatedHours: 25,
              difficulty: 'medium',
              subtopics: [
                'Paragraf Tamamlama', 'Anlatım Bozuklukları', 'Sözel Mantık',
                'Görsel Yorumlama', 'Düşünceyi Geliştirme Yolları'
              ]
            }
          ]
        },
        {
          id: 'science',
          name: 'Fen Bilimleri',
          title: 'Fen Bilimleri',
          description: 'TYT Fizik, Kimya, Biyoloji',
          icon: '🔬',
          color: 'purple',
          order: 3,
          estimatedHours: 100,
          totalTopics: 35,
          topics: [
            {
              id: 'physics',
              name: 'Fizik',
              order: 1,
              estimatedHours: 35,
              difficulty: 'hard',
              subtopics: [
                'Hareket', 'Kuvvet', 'Enerji', 'Elektrik', 'Manyetizma'
              ]
            },
            {
              id: 'chemistry',
              name: 'Kimya',
              order: 2,
              estimatedHours: 35,
              difficulty: 'medium',
              subtopics: [
                'Atom ve Periyodik Sistem', 'Kimyasal Bağlar', 
                'Kimyasal Tepkimeler', 'Asit-Baz'
              ]
            },
            {
              id: 'biology',
              name: 'Biyoloji',
              order: 3,
              estimatedHours: 30,
              difficulty: 'medium',
              subtopics: [
                'Hücre', 'Canlıların Sınıflandırılması', 
                'Sistemler', 'Genetik'
              ]
            }
          ]
        },
        {
          id: 'social',
          name: 'Sosyal Bilimler',
          title: 'Sosyal Bilimler',
          description: 'TYT Tarih, Coğrafya, Felsefe, Din',
          icon: '🌍',
          color: 'yellow',
          order: 4,
          estimatedHours: 90,
          totalTopics: 30,
          topics: [
            {
              id: 'history',
              name: 'Tarih',
              order: 1,
              estimatedHours: 25,
              difficulty: 'medium',
              subtopics: [
                'İlk Çağ', 'Orta Çağ', 'Yeni Çağ', 
                'Yakın Çağ', 'Türkiye Tarihi'
              ]
            },
            {
              id: 'geography',
              name: 'Coğrafya',
              order: 2,
              estimatedHours: 25,
              difficulty: 'medium',
              subtopics: [
                'Fiziki Coğrafya', 'Beşeri Coğrafya', 'Türkiye Coğrafyası'
              ]
            },
            {
              id: 'philosophy',
              name: 'Felsefe',
              order: 3,
              estimatedHours: 20,
              difficulty: 'medium',
              subtopics: [
                'Felsefeye Giriş', 'Bilgi Felsefesi', 
                'Varlık Felsefesi', 'Ahlak Felsefesi'
              ]
            },
            {
              id: 'religion',
              name: 'Din Kültürü',
              order: 4,
              estimatedHours: 20,
              difficulty: 'easy',
              subtopics: [
                'İslam Dini', 'İbadet', 'Ahlak', 'Kültür ve Medeniyet'
              ]
            }
          ]
        }
      ]
    };
    
    let totalSubjects = 0;
    let totalTopics = 0;
    let totalSubtopics = 0;
    
    // Seed subjects
    for (const subject of tytCurriculum.subjects) {
      const subjectRef = doc(db, 'curriculum/tyt/subjects', subject.id);
      
      await setDoc(subjectRef, {
        name: subject.name,
        title: subject.title,
        description: subject.description,
        icon: subject.icon,
        color: subject.color,
        order: subject.order,
        estimatedHours: subject.estimatedHours,
        totalTopics: subject.totalTopics,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ ${subject.icon} ${subject.name}`);
      totalSubjects++;
      
      // Seed topics
      for (const topic of subject.topics) {
        const topicRef = doc(db, `curriculum/tyt/subjects/${subject.id}/topics`, topic.id);
        
        await setDoc(topicRef, {
          name: topic.name,
          subjectId: subject.id,
          order: topic.order,
          estimatedHours: topic.estimatedHours,
          difficulty: topic.difficulty,
          createdAt: new Date().toISOString()
        });
        
        console.log(`   📘 ${topic.name}`);
        totalTopics++;
        
        // Seed subtopics
        for (const [index, subtopicName] of topic.subtopics.entries()) {
          const subtopicId = subtopicName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          const subtopicRef = doc(
            db, 
            `curriculum/tyt/subjects/${subject.id}/topics/${topic.id}/subtopics`, 
            subtopicId
          );
          
          await setDoc(subtopicRef, {
            name: subtopicName,
            topicId: topic.id,
            subjectId: subject.id,
            order: index + 1,
            estimatedMinutes: 60,
            createdAt: new Date().toISOString()
          });
          
          totalSubtopics++;
        }
        
        if (topic.subtopics.length > 0) {
          console.log(`      • ${topic.subtopics.length} subtopics added`);
        }
      }
      
      console.log('');
    }
    
    console.log('🎉 Firestore seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Subjects: ${totalSubjects}`);
    console.log(`   Topics: ${totalTopics}`);
    console.log(`   Subtopics: ${totalSubtopics}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Make sure npm run dev is running');
    console.error('   2. Check Firebase config values in the script');
    console.error('   3. Make sure Firestore is enabled in Firebase Console');
    console.error('   4. Check Firestore security rules');
    console.error('');
    console.error('Full error:', error);
  }
})();
