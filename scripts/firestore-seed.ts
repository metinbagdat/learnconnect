/**
 * Firestore Seed Script for TYT Curriculum
 * 
 * Usage:
 * 1. Set up Firebase config in .env
 * 2. Run: npx tsx scripts/firestore-seed.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (requires service account key)
// For client-side seeding, use Firebase SDK instead
// This script is for server-side seeding with admin privileges

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
      { id: 'numbers', name: 'Sayılar', order: 1, estimatedTime: 15 },
      { id: 'algebra', name: 'Cebir', order: 2, estimatedTime: 25 },
      { id: 'geometry', name: 'Geometri', order: 3, estimatedTime: 30 },
      { id: 'data', name: 'Veri, Sayma, Olasılık', order: 4, estimatedTime: 20 }
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
      { id: 'grammar', name: 'Dil Bilgisi', order: 1, estimatedTime: 20 },
      { id: 'reading', name: 'Okuma Anlama', order: 2, estimatedTime: 25 },
      { id: 'writing', name: 'Yazım Kuralları', order: 3, estimatedTime: 15 }
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
      { id: 'physics', name: 'Fizik', order: 1, estimatedTime: 35 },
      { id: 'chemistry', name: 'Kimya', order: 2, estimatedTime: 35 },
      { id: 'biology', name: 'Biyoloji', order: 3, estimatedTime: 30 }
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
      { id: 'history', name: 'Tarih', order: 1, estimatedTime: 25 },
      { id: 'geography', name: 'Coğrafya', order: 2, estimatedTime: 25 },
      { id: 'philosophy', name: 'Felsefe', order: 3, estimatedTime: 20 },
      { id: 'religion', name: 'Din Kültürü', order: 4, estimatedTime: 20 }
    ]
  }
};

async function seedFirestore() {
  try {
    console.log('🚀 Starting Firestore seed...');
    
    // NOTE: This script requires Firebase Admin SDK
    // For client-side seeding, use the Firebase SDK from client/src/services/curriculumService.ts
    
    console.log('📝 Curriculum structure:');
    console.log(JSON.stringify(tytCurriculum, null, 2));
    
    console.log('\n✅ Seed data structure prepared.');
    console.log('⚠️  To actually seed Firestore:');
    console.log('   1. Use Firebase Admin SDK (requires service account key)');
    console.log('   2. Or manually create data in Firebase Console');
    console.log('   3. Or use Firebase SDK from the client (with proper auth)');
    
    console.log('\n📚 Manual Firestore Setup:');
    console.log('   1. Go to Firebase Console > Firestore Database');
    console.log('   2. Create collection: curriculum > tyt > subjects');
    console.log('   3. Add documents for each subject (mathematics, turkish, science, social)');
    console.log('   4. Add subcollections: topics > [topicId] > subtopics');
    
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    process.exit(1);
  }
}

seedFirestore();
