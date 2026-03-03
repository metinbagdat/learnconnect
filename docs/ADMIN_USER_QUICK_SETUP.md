# 🚀 Admin Kullanıcı Hızlı Kurulum

## ✅ Durum
- `/admin` route'u çalışıyor ✅
- Admin Dashboard yükleniyor ✅
- Firebase bağlantısı aktif ✅
- **Şimdi yapılacak:** Admin kullanıcı oluşturma

## 📋 Adım Adım Kurulum (5 Dakika)

### 1️⃣ Firebase Console'da Admin Kullanıcı Oluştur

1. **Firebase Console** → [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Projenizi seçin: **learnconnect-7c499**
3. Sol menüden **Authentication** → **Users** sekmesi
4. **Add User** butonuna tıklayın
5. Formu doldurun:
   - **Email**: `admin@learnconnect.com` (veya istediğiniz email)
   - **Password**: Güçlü bir şifre (örn: `Admin123!@#`)
6. **Add User** butonuna tıklayın
7. **ÖNEMLİ:** Kullanıcı oluşturulduktan sonra **User UID**'yi kopyalayın
   - UID örneği: `abc123xyz456def789ghi012jkl345mno678`

### 2️⃣ Firestore'da Admins Koleksiyonu Oluştur

1. Firebase Console → **Firestore Database**
2. **Start collection** butonuna tıklayın
3. **Collection ID**: `admins` (tam olarak bu şekilde)
4. **Document ID**: 1. adımda kopyaladığınız **User UID**'yi yapıştırın
5. **Add field** ile aşağıdaki alanları ekleyin:

#### Alan 1: `email` (string)
- **Field name**: `email`
- **Type**: string
- **Value**: `admin@learnconnect.com` (veya 1. adımda girdiğiniz email)

#### Alan 2: `role` (string)
- **Field name**: `role`
- **Type**: string
- **Value**: `super_admin`

#### Alan 3: `permissions` (array)
- **Field name**: `permissions`
- **Type**: array
- **Value**: Aşağıdaki değerleri tek tek ekleyin:
  - `manage_content`
  - `manage_users`
  - `view_analytics`

#### Alan 4: `createdAt` (timestamp)
- **Field name**: `createdAt`
- **Type**: timestamp
- **Value**: Şu anki tarih/saat (otomatik)

6. **Save** butonuna tıklayın

**Sonuç:** Firestore'da şu yapı oluşmalı:
```
admins/
  └── {USER_UID}/
      ├── email: "admin@learnconnect.com"
      ├── role: "super_admin"
      ├── permissions: ["manage_content", "manage_users", "view_analytics"]
      └── createdAt: Timestamp
```

### 3️⃣ Firestore Rules'u Kontrol Et

1. Firebase Console → **Firestore Database** → **Rules** sekmesi
2. Aşağıdaki kuralların olduğundan emin olun:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    
    match /admins/{adminId} {
      allow read: if request.auth != null && isAdmin();
      allow write: if false; // Sadece Firebase Console'dan
    }
    
    match /user_progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /study_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /ai_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Eğer farklıysa, `firestore.rules` dosyasındaki içeriği kopyalayıp yapıştırın
4. **Publish** butonuna tıklayın

### 4️⃣ Test Et

1. Tarayıcıda `https://www.egitim.today/admin` adresine gidin
2. **Hard Refresh**: `Ctrl+Shift+R` (Windows) veya `Cmd+Shift+R` (Mac)
3. Admin login formunda:
   - **Email**: `admin@learnconnect.com` (veya oluşturduğunuz email)
   - **Password**: Oluşturduğunuz şifre
4. **Login** butonuna tıklayın
5. **Beklenen:** Admin Panel görünmeli (Curriculum, Users, Analytics, AI Assistant sekmeleri)

## 🔍 Sorun Giderme

### ❌ "Invalid email or password" hatası
- ✅ Firebase Authentication'da kullanıcı oluşturuldu mu?
- ✅ Email ve password doğru mu?
- ✅ Browser console'da başka hata var mı?

### ❌ "Access Denied" veya "You are not an admin" hatası
- ✅ Firestore'da `admins` koleksiyonu var mı?
- ✅ Document ID, Authentication'daki User UID ile aynı mı?
- ✅ `admins/{UID}` dokümanında `email` ve `role` alanları var mı?
- ✅ Firestore Rules publish edildi mi?

### ❌ Login sonrası sayfa yenilenmiyor
- ✅ Browser console'da hata var mı?
- ✅ Network tab'da Firestore request'leri başarılı mı?
- ✅ Hard refresh yapın (`Ctrl+Shift+R`)

### ❌ Firestore Rules hatası
- ✅ Rules syntax doğru mu? (yukarıdaki örneğe göre kontrol edin)
- ✅ `isAdmin()` fonksiyonu var mı?
- ✅ Rules publish edildi mi? (birkaç dakika sürebilir)

## ✅ Başarı Kriterleri

1. ✅ `/admin` sayfası açılıyor
2. ✅ Login formu görünüyor
3. ✅ Email/password ile login olabiliyorsunuz
4. ✅ Admin Panel görünüyor (4 sekme: Curriculum, Users, Analytics, AI Assistant)
5. ✅ Browser console'da hata yok

## 📸 Görsel Rehber (Opsiyonel)

### Firebase Console → Authentication → Users
```
[Add User Button]
Email: admin@learnconnect.com
Password: ********
[Add User]
```

### Firebase Console → Firestore Database
```
[Start collection]
Collection ID: admins
Document ID: {USER_UID_BURAYA}
Fields:
  - email: "admin@learnconnect.com"
  - role: "super_admin"
  - permissions: ["manage_content", "manage_users", "view_analytics"]
  - createdAt: [Timestamp]
[Save]
```

## 🎯 Sonraki Adımlar

Admin kullanıcı oluşturulduktan ve login başarılı olduktan sonra:

1. **Curriculum Yönetimi**: Admin Panel → Curriculum sekmesi
   - TYT/AYT/YKS seçin
   - Ders, konu, alt konu ekleyin
   
2. **AI Müfredat Oluşturma**: Admin Panel → AI Assistant sekmesi
   - "⚡ Tam TYT Müfredatı Oluştur" butonuna tıklayın
   - AI müfredat oluşturulacak (OpenAI key varsa)
   - Preview'da kontrol edin
   - Firestore'a kaydedin

3. **Test**: Ana sayfa → TYT Dashboard → Müfredat sekmesi
   - Eklediğiniz müfredat görünmeli

## 💡 İpucu

Eğer hızlı test için mock data istiyorsanız:
- Admin Panel → AI Assistant
- OpenAI API key olmadan da mock data oluşturulur
- Bu mock data'yı Firestore'a kaydedebilirsiniz
