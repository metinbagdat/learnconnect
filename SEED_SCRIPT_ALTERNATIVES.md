# Firestore Seed Script - Alternatif Yöntemler

## ❌ Sorun: Firebase SDK Yüklü Değil

`node scripts/firestore-seed.js` çalıştırıldığında hata alındı:
```
Error: Cannot find package 'firebase'
```

**Sebep:** `npm install` henüz tamamlanmamış veya Firebase SDK yüklenmemiş.

## ✅ Çözüm Seçenekleri

### Seçenek 1: npm install Tamamlanmasını Bekleyin

```bash
# Terminal'de npm install --legacy-peer-deps çalışıyor mu kontrol edin
# Tamamlandıktan sonra:
node scripts/firestore-seed.js
```

### Seçenek 2: Browser Console'dan Çalıştırın

1. Uygulamayı başlatın: `npm run dev`
2. Browser'da uygulamayı açın
3. F12 ile Developer Console'u açın
4. Şu kodu console'a yapıştırın:

```javascript
// Firebase import (zaten yüklü olmalı)
import { db } from '/client/src/lib/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

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

async function seedFirestore() {
  try {
    console.log('🚀 Starting Firestore seed...');
    
    for (const [subjectId, subjectData] of Object.entries(tytCurriculum)) {
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
    
    console.log('🎉 Firestore seed completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Çalıştır
seedFirestore();
```

### Seçenek 3: Firebase Console'dan Manuel Ekleme

1. [Firebase Console](https://console.firebase.google.com/) → `learnconnect-7c499`
2. Firestore Database → Data
3. **Start collection** → Collection ID: `curriculum` → Document ID: `tyt` → Save
4. `tyt` document'ına tıklayın → **Start subcollection** → Collection ID: `subjects`
5. Her ders için document ekleyin (mathematics, turkish, science, social)
6. Her ders document'ına tıklayın → **Start subcollection** → Collection ID: `topics`
7. Konuları ekleyin

**Detaylı rehber:** `FIRESTORE_SEED_GUIDE.md`

### Seçenek 4: Admin Panel Component (Gelecekte)

Bir admin panel component'i oluşturup oradan seed yapabilirsiniz.

## 📋 Önerilen Sıra

1. ⏳ `npm install --legacy-peer-deps` tamamlanmasını bekleyin
2. ✅ `node scripts/firestore-seed.js` çalıştırın
3. ❌ Çalışmazsa → Browser console yöntemini kullanın
4. ❌ O da çalışmazsa → Firebase Console'dan manuel ekleyin

## 💡 Not

Firebase SDK yüklü değilse, uygulama mock data ile çalışacak. Seed script'i çalıştırmak zorunlu değil, ama gerçek veri için gereklidir.
