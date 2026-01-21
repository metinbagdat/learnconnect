// ============================================
// 🔥 FIRESTORE CURRICULUM OLUŞTURMA SCRIPT'İ
// ============================================
// Firebase Console'da rules'ı publish ettikten sonra
// Tarayıcı console'unda (F12 → Console) çalıştırın
// ============================================

(async () => {
  console.log('🚀 Curriculum oluşturma başlatılıyor...\n');
  
  try {
    // Firebase CDN kontrolü
    const firebase = window.__FIREBASE_CDN__;
    if (!firebase) {
      console.error('❌ Firebase CDN yüklenmemiş!');
      console.log('💡 index.html dosyasında Firebase CDN var mı kontrol edin');
      return;
    }
    
    // Get Firestore functions
    const { collection, doc, setDoc, serverTimestamp } = firebase;
    const db = window.db; // firebase.ts'den export edilen db
    
    if (!db) {
      console.error('❌ Firestore bağlantısı yok!');
      return;
    }
    
    console.log('✅ Firebase CDN hazır');
    console.log('✅ Firestore bağlantısı hazır\n');
    
    // ============================================
    // 1. TYT EXAM TYPE OLUŞTUR
    // ============================================
    console.log('📚 TYT exam type oluşturuluyor...');
    
    const tytRef = doc(db, 'curriculum', 'TYT');
    await setDoc(tytRef, {
      name: 'TYT (Temel Yeterlilik Testi)',
      description: 'Üniversiteye giriş için temel yeterlilik testi',
      totalSubjects: 3,
      totalHours: 135,
      examType: 'TYT',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ TYT exam type oluşturuldu\n');
    
    // ============================================
    // 2. DERSLERI TANIMLA
    // ============================================
    const dersler = [
      {
        id: 'matematik',
        title: 'TYT Matematik',
        description: 'TYT Matematik konuları - Temel matematik bilgisi',
        icon: '🧮',
        color: 'blue',
        order: 1,
        estimatedHours: 60,
        totalTopics: 12,
        difficulty: 'medium',
        examType: 'TYT'
      },
      {
        id: 'turkce',
        title: 'TYT Türkçe',
        description: 'TYT Türkçe konuları - Dil bilgisi ve anlam bilgisi',
        icon: '📝',
        color: 'indigo',
        order: 2,
        estimatedHours: 40,
        totalTopics: 8,
        difficulty: 'easy',
        examType: 'TYT'
      },
      {
        id: 'fizik',
        title: 'TYT Fizik',
        description: 'TYT Fizik konuları - Temel fizik bilgisi',
        icon: '⚛️',
        color: 'purple',
        order: 3,
        estimatedHours: 35,
        totalTopics: 10,
        difficulty: 'hard',
        examType: 'TYT'
      }
    ];
    
    // ============================================
    // 3. HER DERSİ VE KONULARINI EKLE
    // ============================================
    for (const ders of dersler) {
      console.log(`📘 ${ders.title} dersi ekleniyor...`);
      
      // Dersi ekle
      const dersRef = doc(db, `curriculum/TYT/subjects/${ders.id}`);
      await setDoc(dersRef, {
        ...ders,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ ${ders.title} eklendi`);
      
      // Konuları tanımla
      let konular = [];
      
      if (ders.id === 'matematik') {
        konular = [
          { 
            id: 'sayilar', 
            title: 'Sayılar ve İşlemler', 
            order: 1, 
            estimatedHours: 10,
            description: 'Doğal sayılar, tam sayılar, rasyonel sayılar'
          },
          { 
            id: 'cebir', 
            title: 'Cebir', 
            order: 2, 
            estimatedHours: 15,
            description: 'Denklemler, eşitsizlikler, fonksiyonlar'
          },
          { 
            id: 'geometri', 
            title: 'Geometri', 
            order: 3, 
            estimatedHours: 12,
            description: 'Açılar, üçgenler, dörtgenler'
          }
        ];
      } else if (ders.id === 'turkce') {
        konular = [
          { 
            id: 'paragraf', 
            title: 'Paragraf', 
            order: 1, 
            estimatedHours: 12,
            description: 'Ana fikir, yan fikir, paragraf türleri'
          },
          { 
            id: 'dilbilgisi', 
            title: 'Dil Bilgisi', 
            order: 2, 
            estimatedHours: 10,
            description: 'Sözcük türleri, cümle bilgisi'
          }
        ];
      } else if (ders.id === 'fizik') {
        konular = [
          { 
            id: 'mekanik', 
            title: 'Mekanik', 
            order: 1, 
            estimatedHours: 12,
            description: 'Hareket, kuvvet ve enerji'
          },
          { 
            id: 'elektrik', 
            title: 'Elektrik', 
            order: 2, 
            estimatedHours: 8,
            description: 'Akım, gerilim, direnç'
          }
        ];
      }
      
      // Konuları ekle
      for (const konu of konular) {
        const konuRef = doc(db, `curriculum/TYT/subjects/${ders.id}/topics/${konu.id}`);
        await setDoc(konuRef, {
          title: konu.title,
          description: konu.description,
          order: konu.order,
          estimatedHours: konu.estimatedHours,
          subjectId: ders.id,
          subjectTitle: ders.title,
          examType: 'TYT',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`   ✓ ${konu.title}`);
      }
      
      console.log('');
    }
    
    // ============================================
    // BAŞARI MESAJI
    // ============================================
    console.log('\n═══════════════════════════════════════');
    console.log('🎉🎉🎉 CURRICULUM BAŞARIYLA OLUŞTURULDU! 🎉🎉🎉');
    console.log('═══════════════════════════════════════\n');
    console.log('✅ 1 exam type eklendi: TYT');
    console.log('✅ 3 ders eklendi:');
    console.log('   📘 Matematik (3 konu)');
    console.log('   📘 Türkçe (2 konu)');
    console.log('   📘 Fizik (2 konu)');
    console.log('✅ Toplam 7 konu eklendi');
    console.log('\n═══════════════════════════════════════\n');
    console.log('🔍 ŞİMDİ YAPMANIZ GEREKENLER:\n');
    console.log('1. Admin Dashboard\'ı yenileyin: Ctrl+Shift+R');
    console.log('2. Müfredat tab\'ında TYT derslerini göreceksiniz!');
    console.log('3. Firebase Console\'da kontrol edin:');
    console.log('   https://console.firebase.google.com/\n');
    
  } catch (error) {
    console.error('\n❌ HATA OLUŞTU:', error);
    console.log('\n🔍 Hata Detayı:', error.message);
    console.log('\n🔧 SORUN GİDERME:\n');
    console.log('1. Firestore Rules publish edildi mi?');
    console.log('   → Firebase Console → Firestore → Rules → Publish');
    console.log('2. Admin olarak giriş yaptınız mı?');
    console.log('   → http://localhost:5173/admin');
    console.log('3. Firebase Console\'da admins/{uid} dokümanı var mı?');
    console.log('4. Console\'da auth.currentUser.uid doğru mu?');
    console.log('\n💡 Eğer "Missing permissions" hatası alıyorsanız:');
    console.log('   Rules\'ı tekrar kontrol edin ve publish edin!');
  }
})();

// ============================================
// KULLANIM TALİMATLARI
// ============================================
// 1. Firebase Console\'da rules\'ı publish edin
// 2. Admin dashboard\'a giriş yapın
// 3. F12 → Console
// 4. Bu script\'i kopyalayın
// 5. Console\'a yapıştırın
// 6. Enter\'a basın
// 7. Başarı mesajını bekleyin!
// ============================================
