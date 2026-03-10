# 🚀 Seed Script'i Şimdi Çalıştırın

## Hızlı Yöntem: Browser Console

### Adım 1: Uygulamayı Başlatın
Terminal'de:
```bash
npm run dev
```

### Adım 2: Browser'da Açın
- Terminal'de gösterilen URL'yi kullanın (genellikle `http://localhost:5173`)

### Adım 3: Console'u Açın
- **F12** tuşuna basın
- **Console** sekmesine gidin

### Adım 4: Seed Script'i Çalıştırın

`BROWSER_CONSOLE_SEED.js` dosyasını açın ve **TAMAMINI** kopyalayıp console'a yapıştırın.

**VEYA** console'a şunu yapıştırın:

```javascript
(async function() {
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
})();
```

### Adım 5: Sonuç Kontrolü

Başarılı olursa console'da şunu göreceksiniz:
```
🚀 Starting Firestore seed...
✅ Added subject: Matematik
   ✅ Topic: Sayılar
   ✅ Topic: Cebir
   ✅ Topic: Geometri
   ✅ Topic: Veri, Sayma, Olasılık
✅ Added subject: Türkçe
   ✅ Topic: Dil Bilgisi
   ✅ Topic: Okuma Anlama
   ✅ Topic: Yazım Kuralları
✅ Added subject: Fen Bilimleri
   ✅ Topic: Fizik
   ✅ Topic: Kimya
   ✅ Topic: Biyoloji
✅ Added subject: Sosyal Bilimler
   ✅ Topic: Tarih
   ✅ Topic: Coğrafya
   ✅ Topic: Felsefe
   ✅ Topic: Din Kültürü
🎉 Firestore seed completed successfully!
```

## ⚠️ Önkoşullar

1. ✅ Firestore Database oluşturulmuş olmalı
2. ✅ Firestore Rules yüklenmiş olmalı
3. ✅ `npm run dev` çalışıyor olmalı

## 🔍 Hata Durumları

### "Permission denied"
- Firestore Rules'ı kontrol edin
- Rules'ın yayınlandığından emin olun

### "Cannot find module"
- `npm run dev` çalışıyor mu kontrol edin
- Browser'ı yenileyin (F5)

### "Firestore is not enabled"
- Firebase Console'dan Firestore Database'i oluşturun
