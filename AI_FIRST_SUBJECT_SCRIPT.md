# 🤖 AI ile İlk Ders Ekleme Rehberi

## Yöntem 1: Admin Dashboard'dan (Önerilen)

### Adım 1: Admin Paneline Giriş

1. **https://egitim.today/admin** açın
2. Login yapın:
   - Email: `metinbagdat@gmail.com`
   - Password: [Firebase Auth'daki şifre]

### Adım 2: AI Asistan Tab'ına Git

1. Üst menüden **"AI Asistan – AI Assistant"** tab'ına tıklayın

### Adım 3: Tam TYT Müfredatı Oluştur

1. **"⚡ Tam TYT Müfredatı Oluştur (4 Ders)"** butonuna basın
2. Loading spinner görünür (30-60 saniye)
3. 4 ders oluşturulur:
   - Türkçe
   - Matematik
   - Fen Bilimleri
   - Sosyal Bilimler

### Adım 4: Firestore'a Kaydet

1. Oluşturulan müfredat preview'da görünür
2. **"Firestore'a Kaydet"** butonuna basın
3. Loading → Başarı mesajı

**Beklenen:**
- ✅ 4 ders Firestore'a yazılır
- ✅ Her dersin konuları ve alt konuları var
- ✅ `curriculum/tyt/subjects` koleksiyonunda görünür

---

## Yöntem 2: Browser Console Script (Alternatif)

**Eğer admin dashboard çalışmıyorsa:**

### Adım 1: Admin Dashboard'a Giriş Yap

```
https://egitim.today/admin
→ Login yap
```

### Adım 2: Browser Console Aç

**F12** → **Console** tab

### Adım 3: Script'i Çalıştır

Aşağıdaki script'i console'a yapıştırın ve Enter'a basın:

```javascript
(async () => {
  console.log('🤖 AI ile TYT müfredatı oluşturuluyor...');
  
  try {
    // API'ye istek at
    const response = await fetch('/api/generate-curriculum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examType: 'tyt',
        useTemplate: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ AI müfredat oluşturuldu:', data);
    
    if (!data.subjects || data.subjects.length === 0) {
      throw new Error('Müfredat boş geldi');
    }
    
    // Firestore'a kaydet
    const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    
    // Firebase config (environment variables'dan alınmalı, şimdilik hardcode)
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDeZACW1poVyTucZgq0Y1JnqlAumRhnwkg',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'learnconnect-7c499.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'learnconnect-7c499',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'learnconnect-7c499.appspot.com',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '94708429652',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:94708429652:web:af1e854867d6eeaf3dcec1',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-SKHJCN4ST9'
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📝 Firestore\'a yazılıyor...');
    
    for (const subject of data.subjects) {
      // Subject ekle
      const subjectRef = await addDoc(
        collection(db, 'curriculum/tyt/subjects'),
        {
          title: subject.title,
          description: subject.description || '',
          icon: subject.icon || '📘',
          color: subject.color || 'blue',
          order: subject.order,
          estimatedHours: subject.estimatedHours,
          totalTopics: subject.topics?.length || 0,
          examType: 'tyt',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      console.log(`✅ ${subject.title} dersi eklendi`);
      
      // Topics ekle
      if (subject.topics && Array.isArray(subject.topics)) {
        for (const topic of subject.topics) {
          const topicRef = await addDoc(
            collection(db, `curriculum/tyt/subjects/${subjectRef.id}/topics`),
            {
              name: topic.name || topic.title,
              title: topic.title || topic.name,
              order: topic.order,
              estimatedHours: topic.estimatedHours || 0,
              difficulty: topic.difficulty || 'medium',
              subjectId: subjectRef.id,
              createdAt: new Date().toISOString()
            }
          );
          
          console.log(`   📘 ${topic.title} konusu eklendi`);
          
          // Subtopics ekle
          if (topic.subtopics && Array.isArray(topic.subtopics)) {
            for (let i = 0; i < topic.subtopics.length; i++) {
              const subtopicName = typeof topic.subtopics[i] === 'string' 
                ? topic.subtopics[i] 
                : topic.subtopics[i].name || topic.subtopics[i].title;
              
              await addDoc(
                collection(db, `curriculum/tyt/subjects/${subjectRef.id}/topics/${topicRef.id}/subtopics`),
                {
                  name: subtopicName,
                  title: subtopicName,
                  order: i + 1,
                  topicId: topicRef.id,
                  subjectId: subjectRef.id,
                  createdAt: new Date().toISOString()
                }
              );
              
              console.log(`      📝 ${subtopicName} alt konusu eklendi`);
            }
          }
        }
      }
    }
    
    console.log('\n🎉🎉🎉 TÜM MÜFREDAT BAŞARIYLA EKLENDİ! 🎉🎉🎉');
    console.log('============================================');
    console.log(`✅ ${data.subjects.length} ders eklendi`);
    console.log('============================================');
    console.log('\n🔍 Şimdi yapın:');
    console.log('1. Firebase Console → Firestore → Data');
    console.log('2. curriculum/tyt/subjects koleksiyonunu kontrol edin');
    console.log('3. Admin dashboard → Müfredat sekmesini yenileyin');
    
  } catch (error) {
    console.error('❌ HATA:', error);
    console.log('\n🔥 Hata detayı:', error.message);
    console.log('\n🔧 Sorun giderme:');
    console.log('1. Admin girişi yaptığınızdan emin olun');
    console.log('2. Firestore rules publish edildi mi kontrol edin');
    console.log('3. Environment variables Vercel\'de var mı kontrol edin');
  }
})();
```

**Not:** Bu script production'da environment variables'ı okuyamayabilir. Admin dashboard'dan yapmak daha güvenli.

---

## ✅ Başarı Kontrolü

### Firebase Console'da Kontrol

```
https://console.firebase.google.com/project/learnconnect-7c499/firestore/data
→ curriculum → tyt → subjects
```

**Göreceksiniz:**
- 4 ders (Türkçe, Matematik, Fen, Sosyal)
- Her dersin altında topics
- Her topic'in altında subtopics

### Admin Dashboard'da Kontrol

1. **Müfredat** sekmesi
2. **TYT** seç
3. 4 ders görünmeli
4. Her dersin konuları açılabilir

---

**ÖNERİLEN:** Admin dashboard'dan **"⚡ Tam TYT Müfredatı Oluştur (4 Ders)"** butonunu kullanın. Daha kolay ve güvenli! 🚀
