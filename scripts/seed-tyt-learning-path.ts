/**
 * Seed Firestore with TYT Matematik 30 Gün learning path
 * Run: npx ts-node scripts/seed-tyt-learning-path.ts
 * Requires: FIREBASE_SERVICE_ACCOUNT_KEY or ./service-account-key.json
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';

const candidates = [
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  './service-account-key.json',
  './scripts/service-account-key.json',
].filter(Boolean) as string[];
const serviceAccountPath = candidates.find((p) => fs.existsSync(p));

if (!serviceAccountPath) {
  console.error('❌ Service account key not found.');
  console.error('   Place at: ./service-account-key.json or ./scripts/service-account-key.json');
  console.error('   Or set FIREBASE_SERVICE_ACCOUNT_KEY env var');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) });
} catch (error: unknown) {
  // Allow the specific "already initialized" case; fail fast on everything else
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'app/duplicate-app'
  ) {
    // Already initialized (e.g. from another script)
  } else {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

export const TYT_MATEMATIK_PATH_ID = 'tyt-matematik-30-gun';

const tytMatematikPath = {
  title: 'TYT Matematik 30 Gün',
  description:
    'TYT matematik konularını 30 günde tamamla. Adım adım ilerleyerek tüm konuları öğren ve sınava hazırlan.',
  category: 'TYT',
  estimatedDays: 30,
  tags: ['tyt', 'matematik', 'sınav', 'temel'],
  steps: [
    {
      id: 'step-1',
      title: 'Temel Kavramlar',
      description: 'Sayılar, işlemler, temel matematik kavramları',
      estimatedMinutes: 60,
      order: 1,
      type: 'lesson',
    },
    {
      id: 'step-2',
      title: 'Sayı Basamakları',
      description: 'Basamak değeri, sayı sistemleri',
      estimatedMinutes: 45,
      order: 2,
      type: 'lesson',
    },
    {
      id: 'step-3',
      title: 'Cebir - Denklemler',
      description: 'Birinci ve ikinci derece denklemler, eşitsizlikler',
      estimatedMinutes: 90,
      order: 3,
      type: 'lesson',
    },
    {
      id: 'step-4',
      title: 'Fonksiyonlar',
      description: 'Fonksiyon kavramı, grafikler',
      estimatedMinutes: 75,
      order: 4,
      type: 'lesson',
    },
    {
      id: 'step-5',
      title: 'Geometri - Temel Şekiller',
      description: 'Üçgen, dörtgen, çember temel özellikleri',
      estimatedMinutes: 120,
      order: 5,
      type: 'lesson',
    },
    {
      id: 'step-6',
      title: 'Geometri - Alan ve Çevre',
      description: 'Geometrik şekillerin alan ve çevre hesaplamaları',
      estimatedMinutes: 90,
      order: 6,
      type: 'practice',
    },
    {
      id: 'step-7',
      title: 'Olasılık ve İstatistik',
      description: 'Temel olasılık, veri analizi',
      estimatedMinutes: 60,
      order: 7,
      type: 'lesson',
    },
    {
      id: 'step-8',
      title: 'TYT Matematik Denemesi',
      description: 'Tüm konuları kapsayan deneme sınavı',
      estimatedMinutes: 75,
      order: 8,
      type: 'quiz',
    },
  ],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seedTytLearningPath() {
  const pathRef = db.collection('learningPaths').doc(TYT_MATEMATIK_PATH_ID);
  const existing = await pathRef.get();

  if (existing.exists) {
    console.log('⚠️  TYT Matematik path already exists. Updating...');
    await pathRef.update({
      ...tytMatematikPath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ TYT Matematik 30 Gün path updated successfully!');
  } else {
    await pathRef.set(tytMatematikPath);
    console.log('✅ TYT Matematik 30 Gün path seeded successfully!');
  }
  console.log(`   - Document ID: ${TYT_MATEMATIK_PATH_ID}`);
  console.log(`   - Steps: ${tytMatematikPath.steps.length}`);
}

async function main() {
  try {
    await seedTytLearningPath();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
