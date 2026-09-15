# 🚀 Hızlı Seed Script Kullanımı

## ❌ Sorun
`node scripts/firestore-seed.js` çalışmıyor çünkü Firebase SDK henüz yüklü değil.

## ✅ Çözüm: Browser Console'dan Çalıştırın

### Adım 1: Uygulamayı Başlatın
```bash
npm run dev
```

### Adım 2: Browser'da Açın
- Uygulama genellikle `http://localhost:5173` veya başka bir port'ta açılır
- Terminal'de gösterilen URL'yi kullanın

### Adım 3: Developer Console'u Açın
- **F12** tuşuna basın
- Veya sağ tık → **Inspect** → **Console** sekmesi

### Adım 4: Seed Script'i Çalıştırın

**Yöntem A - Dosyadan Kopyala:**
1. `BROWSER_CONSOLE_SEED.js` dosyasını açın
2. Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)
3. Browser console'a yapıştırın (Ctrl+V)
4. Enter'a basın

**Yöntem B - Direkt Kod:**
Console'a şunu yapıştırın:

```javascript
// Önce Firebase'i import edin (eğer mevcut değilse)
const { db } = await import('/client/src/lib/firebase.js');
const { doc, setDoc } = await import('firebase/firestore');

// Sonra seed fonksiyonunu çalıştırın
(async function() {
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
   ...
🎉 Firestore seed completed successfully!
```

## 🔍 Hata Durumları

### "Cannot find module"
- `npm run dev` çalışıyor mu kontrol edin
- Browser'ı yenileyin (F5)

### "Permission denied"
- Firestore Security Rules'ı kontrol edin
- Rules'ın yayınlandığından emin olun

### "Firestore is not enabled"
- Firebase Console'dan Firestore Database'i oluşturun

## ✅ Alternatif: Firebase Console'dan Manuel

Eğer browser console yöntemi çalışmazsa, Firebase Console'dan manuel ekleyebilirsiniz:
- Detaylar: `FIRESTORE_SEED_GUIDE.md`

## 💡 Not

Bu yöntem npm install tamamlanmadan da çalışır çünkü browser'da Firebase SDK zaten yüklü olur (npm run dev çalışıyorsa).
