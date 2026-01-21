/**
 * Firestore Seed Script - Node.js Version
 * 
 * KULLANIM:
 * 1. .env dosyasında Firebase config değerleri olmalı
 * 2. Terminal'de: node seed-firestore.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');

let envVars = {};
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !match[1].startsWith('#')) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
  console.log('✓ .env file loaded');
} catch (error) {
  console.warn('⚠ Could not load .env file, using process.env');
  envVars = process.env;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

// Validate config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key] || firebaseConfig[key].includes('your_'));
if (missingKeys.length > 0) {
  console.error('❌ Missing or invalid Firebase config:', missingKeys);
  console.error('Please update .env file with your Firebase config values.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✓ Firebase initialized');
console.log(`   Project: ${firebaseConfig.projectId}`);
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

async function seedFirestore() {
  try {
    console.log('🚀 Starting Firestore seed...');
    console.log('');
    
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
    console.log('📚 Data structure:');
    console.log('   /curriculum/tyt/subjects/{subjectId}');
    console.log('   /curriculum/tyt/subjects/{subjectId}/topics/{topicId}');
    console.log('   /curriculum/tyt/subjects/{subjectId}/topics/{topicId}/subtopics/{subtopicId}');
    console.log('');
    console.log('🔗 Check your Firebase Console:');
    console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Error seeding Firestore:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check .env file exists with Firebase config');
    console.error('   2. Make sure Firestore is enabled in Firebase Console');
    console.error('   3. Check Firestore security rules allow writes');
    console.error('   4. Verify Firebase project ID is correct');
    console.error('   5. Check Firebase API key is valid');
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the function
seedFirestore();
