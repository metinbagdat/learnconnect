/**
 * Firestore Seed Script for TYT Curriculum
 * 
 * Usage:
 * 1. Make sure Firebase config is in .env
 * 2. Run: node scripts/firestore-seed.js
 * 
 * Note: This uses Firebase Admin SDK or client SDK
 * For production, use Firebase Admin SDK with service account
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '..', '.env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  
  // Set environment variables
  Object.keys(envVars).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = envVars[key];
    }
  });
} catch (error) {
  console.warn('Could not load .env file, using process.env');
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
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

const tytCurriculum = {
  subjects: [
    {
      id: 'mathematics',
      name: 'Matematik',
      description: 'TYT Matematik müfredatı',
      icon: '🧮',
      color: 'blue',
      topics: [
        {
          id: 'numbers',
          name: 'Sayılar',
          subtopics: ['Doğal Sayılar', 'Tam Sayılar', 'Rasyonel Sayılar', 'Üslü Sayılar', 'Köklü Sayılar']
        },
        {
          id: 'algebra',
          name: 'Cebir',
          subtopics: ['Denklemler', 'Eşitsizlikler', 'Fonksiyonlar', 'Polinomlar']
        },
        {
          id: 'geometry',
          name: 'Geometri',
          subtopics: ['Temel Geometri', 'Üçgenler', 'Dörtgenler', 'Çember', 'Analitik Geometri']
        },
        {
          id: 'data',
          name: 'Veri, Sayma, Olasılık',
          subtopics: ['Veri Analizi', 'Sayma', 'Permütasyon', 'Kombinasyon', 'Olasılık']
        }
      ]
    },
    {
      id: 'turkish',
      name: 'Türkçe',
      description: 'TYT Türkçe müfredatı',
      icon: '📚',
      color: 'green',
      topics: [
        {
          id: 'grammar',
          name: 'Dil Bilgisi',
          subtopics: ['Sözcük Türleri', 'Cümle Ögeleri', 'Ses Bilgisi', 'Yazım Kuralları']
        },
        {
          id: 'reading',
          name: 'Okuma Anlama',
          subtopics: ['Paragraf', 'Anlatım Bozuklukları', 'Sözel Mantık']
        }
      ]
    },
    {
      id: 'science',
      name: 'Fen Bilimleri',
      description: 'TYT Fizik, Kimya, Biyoloji',
      icon: '🔬',
      color: 'purple',
      topics: [
        {
          id: 'physics',
          name: 'Fizik',
          subtopics: ['Hareket', 'Kuvvet', 'Enerji', 'Elektrik', 'Manyetizma']
        },
        {
          id: 'chemistry',
          name: 'Kimya',
          subtopics: ['Atom ve Periyodik Sistem', 'Kimyasal Bağlar', 'Kimyasal Tepkimeler', 'Asit-Baz']
        },
        {
          id: 'biology',
          name: 'Biyoloji',
          subtopics: ['Hücre', 'Canlıların Sınıflandırılması', 'Sistemler', 'Genetik']
        }
      ]
    },
    {
      id: 'social',
      name: 'Sosyal Bilimler',
      description: 'TYT Tarih, Coğrafya, Felsefe, Din',
      icon: '🌍',
      color: 'yellow',
      topics: [
        {
          id: 'history',
          name: 'Tarih',
          subtopics: ['İlk Çağ', 'Orta Çağ', 'Yeni Çağ', 'Yakın Çağ', 'Türkiye Tarihi']
        },
        {
          id: 'geography',
          name: 'Coğrafya',
          subtopics: ['Fiziki Coğrafya', 'Beşeri Coğrafya', 'Türkiye Coğrafyası']
        },
        {
          id: 'philosophy',
          name: 'Felsefe',
          subtopics: ['Felsefeye Giriş', 'Bilgi Felsefesi', 'Varlık Felsefesi', 'Ahlak Felsefesi']
        },
        {
          id: 'religion',
          name: 'Din Kültürü',
          subtopics: ['İslam Dini', 'İbadet', 'Ahlak', 'Kültür ve Medeniyet']
        }
      ]
    }
  ]
};

async function seedFirestore() {
  try {
    console.log('🚀 Seeding Firestore with TYT curriculum...');
    console.log('📝 Project:', firebaseConfig.projectId);
    
    // Add each subject
    for (const subject of tytCurriculum.subjects) {
      const subjectRef = doc(db, 'curriculum/tyt/subjects', subject.id);
      
      await setDoc(subjectRef, {
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
        color: subject.color,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Added subject: ${subject.name}`);
      
      // Add topics for this subject
      for (const topic of subject.topics) {
        const topicRef = doc(db, `curriculum/tyt/subjects/${subject.id}/topics`, topic.id);
        
        await setDoc(topicRef, {
          name: topic.name,
          subjectId: subject.id,
          order: subject.topics.indexOf(topic) + 1,
          estimatedHours: 10,
          difficulty: 'medium',
          createdAt: new Date().toISOString()
        });
        
        console.log(`  ✅ Topic: ${topic.name}`);
        
        // Add subtopics
        for (const subtopic of topic.subtopics) {
          const subtopicId = subtopic.toLowerCase().replace(/\s+/g, '_');
          const subtopicRef = doc(
            db, 
            `curriculum/tyt/subjects/${subject.id}/topics/${topic.id}/subtopics`, 
            subtopicId
          );
          
          await setDoc(subtopicRef, {
            name: subtopic,
            topicId: topic.id,
            subjectId: subject.id,
            order: topic.subtopics.indexOf(subtopic) + 1,
            estimatedMinutes: 60,
            createdAt: new Date().toISOString()
          });
          
          console.log(`    * Subtopic: ${subtopic}`);
        }
      }
    }
    
    console.log('');
    console.log('🎉 Seeding completed!');
    console.log('');
    console.log('📚 Data structure:');
    console.log('   curriculum/tyt/subjects/{subjectId}');
    console.log('   curriculum/tyt/subjects/{subjectId}/topics/{topicId}');
    console.log('   curriculum/tyt/subjects/{subjectId}/topics/{topicId}/subtopics/{subtopicId}');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check Firebase config in .env');
    console.error('   2. Make sure Firestore is enabled in Firebase Console');
    console.error('   3. Check Firestore security rules');
    process.exit(1);
  }
}

seedFirestore();
