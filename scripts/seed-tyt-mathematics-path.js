/**
 * Seed script to create a sample TYT Mathematics 30-day learning path in Firestore
 * 
 * Run this script after setting up Firebase:
 * node scripts/seed-tyt-mathematics-path.js
 * 
 * Or use the browser console script if you have Firebase initialized
 */

// This is a Node.js script - you'll need to set up Firebase Admin SDK
// For now, this is a reference implementation

const samplePath = {
  title: 'TYT Matematik 30 Gün',
  description: 'TYT matematik konularını 30 günde tamamla. Adım adım ilerleyerek tüm konuları öğren ve sınava hazırlan.',
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
      type: 'lesson'
    },
    {
      id: 'step-2',
      title: 'Sayı Basamakları',
      description: 'Basamak değeri, sayı sistemleri',
      estimatedMinutes: 45,
      order: 2,
      type: 'lesson'
    },
    {
      id: 'step-3',
      title: 'Cebir - Denklemler',
      description: 'Birinci ve ikinci derece denklemler, eşitsizlikler',
      estimatedMinutes: 90,
      order: 3,
      type: 'lesson'
    },
    {
      id: 'step-4',
      title: 'Fonksiyonlar',
      description: 'Fonksiyon kavramı, grafikler',
      estimatedMinutes: 75,
      order: 4,
      type: 'lesson'
    },
    {
      id: 'step-5',
      title: 'Geometri - Temel Şekiller',
      description: 'Üçgen, dörtgen, çember temel özellikleri',
      estimatedMinutes: 120,
      order: 5,
      type: 'lesson'
    },
    {
      id: 'step-6',
      title: 'Geometri - Alan ve Çevre',
      description: 'Geometrik şekillerin alan ve çevre hesaplamaları',
      estimatedMinutes: 90,
      order: 6,
      type: 'practice'
    },
    {
      id: 'step-7',
      title: 'Olasılık ve İstatistik',
      description: 'Temel olasılık, veri analizi',
      estimatedMinutes: 60,
      order: 7,
      type: 'lesson'
    },
    {
      id: 'step-8',
      title: 'TYT Matematik Denemesi',
      description: 'Tüm konuları kapsayan deneme sınavı',
      estimatedMinutes: 75,
      order: 8,
      type: 'quiz'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Instructions for manual creation in Firebase Console:
console.log(`
========================================
TYT Matematik 30 Gün Yolu Oluşturma
========================================

Firebase Console'da manuel olarak oluşturmak için:

1. Firebase Console → Firestore Database → learningPaths koleksiyonuna gidin
2. "Add document" tıklayın
3. Document ID: "tyt-matematik-30" (veya otomatik)
4. Aşağıdaki alanları ekleyin:

title: "TYT Matematik 30 Gün"
description: "TYT matematik konularını 30 günde tamamla..."
category: "TYT"
estimatedDays: 30
tags: ["tyt", "matematik", "sınav", "temel"]
steps: [array of step objects - see samplePath.steps above]
createdAt: [timestamp]
updatedAt: [timestamp]

Veya Admin Panel'den "AI ile Müfredat Oluştur" özelliğini kullanın.
`);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { samplePath };
}
