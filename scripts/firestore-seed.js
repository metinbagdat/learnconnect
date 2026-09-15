/**
 * Firestore Seed Script for TYT Curriculum
 *
 * Usage:
 *   npm run seed:curriculum
 *   # or
 *   node scripts/firestore-seed.js
 *
 * Requires VITE_FIREBASE_* values in .env
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '..', '.env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
} catch {
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

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(
  (key) => !firebaseConfig[key] || String(firebaseConfig[key]).includes('replace-with-')
);

if (missingKeys.length > 0) {
  console.error('❌ Missing or invalid Firebase config:', missingKeys);
  console.error('Update .env with your Firebase config values.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Schema aligned with client/src/types/curriculum.ts
 * Path: curriculum/tyt/subjects/{subjectId}/topics/{topicId}/subtopics/{subtopicId}
 */
const tytCurriculum = {
  subjects: [
    {
      id: 'mathematics',
      title: 'Matematik',
      description: 'TYT Matematik müfredatı',
      icon: '🧮',
      color: 'blue',
      order: 1,
      estimatedHours: 120,
      topics: [
        {
          id: 'numbers',
          name: 'Sayılar',
          difficulty: 'easy',
          estimatedTime: 60,
          subtopics: ['Doğal Sayılar', 'Tam Sayılar', 'Rasyonel Sayılar', 'Üslü Sayılar', 'Köklü Sayılar']
        },
        {
          id: 'algebra',
          name: 'Cebir',
          difficulty: 'medium',
          estimatedTime: 60,
          subtopics: ['Denklemler', 'Eşitsizlikler', 'Fonksiyonlar', 'Polinomlar']
        },
        {
          id: 'geometry',
          name: 'Geometri',
          difficulty: 'medium',
          estimatedTime: 60,
          subtopics: ['Temel Geometri', 'Üçgenler', 'Dörtgenler', 'Çember', 'Analitik Geometri']
        },
        {
          id: 'data',
          name: 'Veri, Sayma, Olasılık',
          difficulty: 'hard',
          estimatedTime: 45,
          subtopics: ['Veri Analizi', 'Sayma', 'Permütasyon', 'Kombinasyon', 'Olasılık']
        }
      ]
    },
    {
      id: 'turkish',
      title: 'Türkçe',
      description: 'TYT Türkçe müfredatı',
      icon: '📚',
      color: 'green',
      order: 2,
      estimatedHours: 80,
      topics: [
        {
          id: 'grammar',
          name: 'Dil Bilgisi',
          difficulty: 'easy',
          estimatedTime: 45,
          subtopics: ['Sözcük Türleri', 'Cümle Ögeleri', 'Ses Bilgisi', 'Yazım Kuralları']
        },
        {
          id: 'reading',
          name: 'Okuma Anlama',
          difficulty: 'medium',
          estimatedTime: 45,
          subtopics: ['Paragraf', 'Anlatım Bozuklukları', 'Sözel Mantık']
        }
      ]
    },
    {
      id: 'science',
      title: 'Fen Bilimleri',
      description: 'TYT Fizik, Kimya, Biyoloji',
      icon: '🔬',
      color: 'purple',
      order: 3,
      estimatedHours: 100,
      topics: [
        {
          id: 'physics',
          name: 'Fizik',
          difficulty: 'medium',
          estimatedTime: 60,
          subtopics: ['Hareket', 'Kuvvet', 'Enerji', 'Elektrik', 'Manyetizma']
        },
        {
          id: 'chemistry',
          name: 'Kimya',
          difficulty: 'medium',
          estimatedTime: 60,
          subtopics: ['Atom ve Periyodik Sistem', 'Kimyasal Bağlar', 'Kimyasal Tepkimeler', 'Asit-Baz']
        },
        {
          id: 'biology',
          name: 'Biyoloji',
          difficulty: 'medium',
          estimatedTime: 60,
          subtopics: ['Hücre', 'Canlıların Sınıflandırılması', 'Sistemler', 'Genetik']
        }
      ]
    },
    {
      id: 'social',
      title: 'Sosyal Bilimler',
      description: 'TYT Tarih, Coğrafya, Felsefe, Din',
      icon: '🌍',
      color: 'yellow',
      order: 4,
      estimatedHours: 90,
      topics: [
        {
          id: 'history',
          name: 'Tarih',
          difficulty: 'medium',
          estimatedTime: 50,
          subtopics: ['İlk Çağ', 'Orta Çağ', 'Yeni Çağ', 'Yakın Çağ', 'Türkiye Tarihi']
        },
        {
          id: 'geography',
          name: 'Coğrafya',
          difficulty: 'easy',
          estimatedTime: 40,
          subtopics: ['Fiziki Coğrafya', 'Beşeri Coğrafya', 'Türkiye Coğrafyası']
        },
        {
          id: 'philosophy',
          name: 'Felsefe',
          difficulty: 'medium',
          estimatedTime: 40,
          subtopics: ['Felsefeye Giriş', 'Bilgi Felsefesi', 'Varlık Felsefesi', 'Ahlak Felsefesi']
        },
        {
          id: 'religion',
          name: 'Din Kültürü',
          difficulty: 'easy',
          estimatedTime: 35,
          subtopics: ['İslam Dini', 'İbadet', 'Ahlak', 'Kültür ve Medeniyet']
        }
      ]
    }
  ]
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function seedFirestore() {
  try {
    console.log('🚀 Seeding Firestore with TYT curriculum...');
    console.log('📝 Project:', firebaseConfig.projectId);

    for (const subject of tytCurriculum.subjects) {
      const subjectRef = doc(db, 'curriculum/tyt/subjects', subject.id);
      const totalTopics = subject.topics.length;

      await setDoc(
        subjectRef,
        {
          title: subject.title,
          name: subject.title, // legacy compatibility
          description: subject.description,
          icon: subject.icon,
          color: subject.color,
          order: subject.order,
          totalTopics,
          estimatedHours: subject.estimatedHours,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        { merge: true }
      );

      console.log(`✅ Subject: ${subject.title}`);

      for (let topicIndex = 0; topicIndex < subject.topics.length; topicIndex++) {
        const topic = subject.topics[topicIndex];
        const topicRef = doc(db, `curriculum/tyt/subjects/${subject.id}/topics`, topic.id);

        await setDoc(
          topicRef,
          {
            name: topic.name,
            title: topic.name,
            subjectId: subject.id,
            order: topicIndex + 1,
            estimatedTime: topic.estimatedTime,
            difficulty: topic.difficulty,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          { merge: true }
        );

        console.log(`  ✅ Topic: ${topic.name}`);

        for (let subIndex = 0; subIndex < topic.subtopics.length; subIndex++) {
          const subtopicName = topic.subtopics[subIndex];
          const subtopicId = slugify(subtopicName);
          const subtopicRef = doc(
            db,
            `curriculum/tyt/subjects/${subject.id}/topics/${topic.id}/subtopics`,
            subtopicId
          );

          await setDoc(
            subtopicRef,
            {
              name: subtopicName,
              title: subtopicName,
              topicId: topic.id,
              subjectId: subject.id,
              order: subIndex + 1,
              estimatedTime: 30,
              completed: false,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            },
            { merge: true }
          );

          console.log(`    * Subtopic: ${subtopicName}`);
        }
      }
    }

    console.log('');
    console.log('🎉 Seeding completed!');
    console.log('📚 Path: curriculum/tyt/subjects/{subjectId}/topics/{topicId}/subtopics/{subtopicId}');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    console.error('💡 Check Firebase config, Firestore enablement, and security rules.');
    process.exit(1);
  }
}

seedFirestore();
