/**
 * Seed Firestore with MEB Curriculum Data
 * Seeds TYT and AYT curriculum following MEB (Ministry of Education) structure
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './service-account-key.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const db = admin.firestore();

// MEB Curriculum Structure
const mebCurriculum = {
  tyt: [
    {
      title: 'TYT Matematik',
      description: 'TYT Matematik dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Temel Kavramlar', estimatedHours: 8, difficulty: 'easy', mebCode: 'MAT.9.1.1' },
        { title: 'Sayılar', estimatedHours: 10, difficulty: 'medium', mebCode: 'MAT.9.1.2' },
        { title: 'Üslü Sayılar', estimatedHours: 6, difficulty: 'medium', mebCode: 'MAT.9.1.3' },
        { title: 'Köklü Sayılar', estimatedHours: 6, difficulty: 'medium', mebCode: 'MAT.9.1.4' },
        { title: 'Çarpanlara Ayırma', estimatedHours: 8, difficulty: 'medium', mebCode: 'MAT.9.1.5' },
        { title: 'Oran-Orantı', estimatedHours: 6, difficulty: 'medium', mebCode: 'MAT.9.2.1' },
        { title: 'Denklemler', estimatedHours: 10, difficulty: 'medium', mebCode: 'MAT.9.2.2' },
        { title: 'Eşitsizlikler', estimatedHours: 8, difficulty: 'medium', mebCode: 'MAT.9.2.3' },
        { title: 'Fonksiyonlar', estimatedHours: 12, difficulty: 'hard', mebCode: 'MAT.10.1.1' },
        { title: 'Polinomlar', estimatedHours: 10, difficulty: 'hard', mebCode: 'MAT.10.1.2' }
      ]
    },
    {
      title: 'TYT Türkçe',
      description: 'TYT Türkçe dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Sözcükte Anlam', estimatedHours: 8, difficulty: 'easy', mebCode: 'TUR.9.1.1' },
        { title: 'Cümlede Anlam', estimatedHours: 10, difficulty: 'medium', mebCode: 'TUR.9.1.2' },
        { title: 'Paragrafta Anlam', estimatedHours: 12, difficulty: 'medium', mebCode: 'TUR.9.2.1' },
        { title: 'Dil Bilgisi', estimatedHours: 14, difficulty: 'hard', mebCode: 'TUR.9.3.1' },
        { title: 'Yazım Kuralları', estimatedHours: 6, difficulty: 'easy', mebCode: 'TUR.9.3.2' },
        { title: 'Noktalama İşaretleri', estimatedHours: 4, difficulty: 'easy', mebCode: 'TUR.9.3.3' },
        { title: 'Anlatım Bozuklukları', estimatedHours: 8, difficulty: 'medium', mebCode: 'TUR.10.1.1' }
      ]
    },
    {
      title: 'TYT Fizik',
      description: 'TYT Fizik dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Fizik Bilimine Giriş', estimatedHours: 4, difficulty: 'easy', mebCode: 'FIZ.9.1.1' },
        { title: 'Madde ve Özellikleri', estimatedHours: 6, difficulty: 'medium', mebCode: 'FIZ.9.1.2' },
        { title: 'Hareket', estimatedHours: 10, difficulty: 'medium', mebCode: 'FIZ.9.2.1' },
        { title: 'Kuvvet ve Hareket', estimatedHours: 12, difficulty: 'hard', mebCode: 'FIZ.9.2.2' },
        { title: 'Enerji', estimatedHours: 10, difficulty: 'hard', mebCode: 'FIZ.9.3.1' },
        { title: 'Isı ve Sıcaklık', estimatedHours: 8, difficulty: 'medium', mebCode: 'FIZ.9.3.2' }
      ]
    },
    {
      title: 'TYT Kimya',
      description: 'TYT Kimya dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Kimya Bilimi', estimatedHours: 4, difficulty: 'easy', mebCode: 'KIM.9.1.1' },
        { title: 'Atom ve Periyodik Sistem', estimatedHours: 10, difficulty: 'medium', mebCode: 'KIM.9.1.2' },
        { title: 'Kimyasal Türler Arası Etkileşimler', estimatedHours: 12, difficulty: 'hard', mebCode: 'KIM.9.2.1' },
        { title: 'Asitler, Bazlar ve Tuzlar', estimatedHours: 8, difficulty: 'medium', mebCode: 'KIM.9.2.2' },
        { title: 'Kimyasal Tepkimeler', estimatedHours: 10, difficulty: 'hard', mebCode: 'KIM.9.3.1' }
      ]
    }
  ],
  ayt: [
    {
      title: 'AYT Matematik',
      description: 'AYT Matematik dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Limit ve Süreklilik', estimatedHours: 12, difficulty: 'hard', mebCode: 'MAT.12.1.1' },
        { title: 'Türev', estimatedHours: 16, difficulty: 'hard', mebCode: 'MAT.12.1.2' },
        { title: 'İntegral', estimatedHours: 18, difficulty: 'hard', mebCode: 'MAT.12.1.3' },
        { title: 'Trigonometri', estimatedHours: 14, difficulty: 'hard', mebCode: 'MAT.12.2.1' },
        { title: 'Logaritma', estimatedHours: 10, difficulty: 'medium', mebCode: 'MAT.12.2.2' },
        { title: 'Diziler', estimatedHours: 8, difficulty: 'medium', mebCode: 'MAT.12.3.1' },
        { title: 'Seriler', estimatedHours: 6, difficulty: 'hard', mebCode: 'MAT.12.3.2' }
      ]
    },
    {
      title: 'AYT Fizik',
      description: 'AYT Fizik dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Elektrik ve Manyetizma', estimatedHours: 16, difficulty: 'hard', mebCode: 'FIZ.12.1.1' },
        { title: 'Dalgalar', estimatedHours: 12, difficulty: 'hard', mebCode: 'FIZ.12.1.2' },
        { title: 'Optik', estimatedHours: 14, difficulty: 'hard', mebCode: 'FIZ.12.2.1' },
        { title: 'Modern Fizik', estimatedHours: 10, difficulty: 'hard', mebCode: 'FIZ.12.2.2' }
      ]
    },
    {
      title: 'AYT Kimya',
      description: 'AYT Kimya dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Kimyasal Denge', estimatedHours: 12, difficulty: 'hard', mebCode: 'KIM.12.1.1' },
        { title: 'Asit-Baz Dengesi', estimatedHours: 14, difficulty: 'hard', mebCode: 'KIM.12.1.2' },
        { title: 'Çözünürlük Dengesi', estimatedHours: 10, difficulty: 'hard', mebCode: 'KIM.12.1.3' },
        { title: 'Elektrokimya', estimatedHours: 12, difficulty: 'hard', mebCode: 'KIM.12.2.1' },
        { title: 'Organik Kimya', estimatedHours: 16, difficulty: 'hard', mebCode: 'KIM.12.2.2' }
      ]
    },
    {
      title: 'AYT Biyoloji',
      description: 'AYT Biyoloji dersi - MEB müfredatına uygun',
      topics: [
        { title: 'Hücre Bölünmeleri', estimatedHours: 8, difficulty: 'medium', mebCode: 'BIO.12.1.1' },
        { title: 'Kalıtım', estimatedHours: 12, difficulty: 'hard', mebCode: 'BIO.12.1.2' },
        { title: 'Ekosistem', estimatedHours: 10, difficulty: 'medium', mebCode: 'BIO.12.2.1' },
        { title: 'Canlılar ve Çevre', estimatedHours: 8, difficulty: 'medium', mebCode: 'BIO.12.2.2' }
      ]
    }
  ]
};

async function seedCurriculum() {
  try {
    console.log('🌱 Seeding MEB curriculum to Firestore...');
    
    const batch = db.batch();
    let subjectCount = 0;
    let topicCount = 0;
    
    // Process TYT and AYT
    for (const [examType, subjects] of Object.entries(mebCurriculum)) {
      for (const subject of subjects) {
        // Create subject document
        const subjectRef = db.collection(`curriculum/${examType}/subjects`).doc();
        
        batch.set(subjectRef, {
          title: subject.title,
          description: subject.description,
          examType: examType.toUpperCase(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        });
        
        subjectCount++;
        
        // Create topics subcollection
        for (const topic of subject.topics) {
          const topicRef = subjectRef.collection('topics').doc();
          
          batch.set(topicRef, {
            title: topic.title,
            estimatedHours: topic.estimatedHours,
            difficulty: topic.difficulty,
            mebCode: topic.mebCode,
            orderIndex: subject.topics.indexOf(topic),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          topicCount++;
        }
      }
    }
    
    // Commit batch
    await batch.commit();
    
    console.log(`✅ Curriculum seeded successfully!`);
    console.log(`   - Subjects: ${subjectCount}`);
    console.log(`   - Topics: ${topicCount}`);
    console.log(`   - Exam Types: TYT, AYT`);
    
  } catch (error) {
    console.error('❌ Error seeding curriculum:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await seedCurriculum();
    console.log('✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
