# Firestore Rules - Production Mode Setup

## ⚠️ Önemli: Production Mode Seçtiniz

Production mode seçtiğiniz için Firebase Console size şu default rules'ı gösteriyor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // ❌ Tüm erişim engellenmiş!
    }
  }
}
```

**Bu rules tüm okuma/yazma işlemlerini engelliyor!** Değiştirmeniz gerekiyor.

## ✅ Doğru Rules (Production için)

Firebase Console'daki Rules editörüne şu içeriği yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Curriculum data - public read, authenticated write
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User progress - user can read/write own data only
    match /user_progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Study plans - user can read/write own data only
    match /study_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // AI plans - user can read/write own data only
    match /ai_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📝 Adımlar

1. Firebase Console → Firestore Database → **Rules** sekmesi
2. Mevcut rules'ı silin (tüm içeriği seçip silin)
3. Yukarıdaki rules'ı kopyalayıp yapıştırın
4. **Publish** butonuna tıklayın
5. Onaylayın

## 🔒 Güvenlik Açıklaması

### Curriculum (Müfredat)
- ✅ **Public Read:** Herkes müfredatı okuyabilir (öğrenciler için gerekli)
- ✅ **Authenticated Write:** Sadece giriş yapmış kullanıcılar yazabilir

### User Progress, Study Plans, AI Plans
- ✅ **User-specific:** Her kullanıcı sadece kendi verilerini okuyup yazabilir
- ✅ **Authentication required:** Giriş yapmış kullanıcılar için

### Diğer Tüm Koleksiyonlar
- ❌ **Denied:** Varsayılan olarak tüm erişim engellenmiş

## ⚠️ Production İçin Ek Güvenlik (Opsiyonel)

Daha sıkı güvenlik istiyorsanız, curriculum write'ı da kısıtlayabilirsiniz:

```javascript
// Curriculum - sadece admin yazabilir
match /curriculum/{document=**} {
  allow read: if true;
  allow write: if request.auth != null && 
               request.auth.token.admin == true;  // Admin kontrolü
}
```

**Not:** Admin kontrolü için Firebase Authentication'da custom claims eklemeniz gerekir.

## ✅ Test

Rules'ı yayınladıktan sonra:
1. Uygulamayı test edin
2. CurriculumTree component'inin veri çekebildiğini kontrol edin
3. Firestore Console'da Rules Playground ile test edebilirsiniz

## 📁 Dosyalar

- `firestore.rules` - Development/Production için genel rules
- `firestore.rules.production` - Production için optimize edilmiş rules
- `FIRESTORE_RULES_PRODUCTION.md` - Bu dosya
