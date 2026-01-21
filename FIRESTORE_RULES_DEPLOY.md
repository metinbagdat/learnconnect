# 🔥 Firestore Rules Deploy - ACİL ÇÖZÜM

## ❌ Sorun
```
FirebaseError: Missing or insufficient permissions
```

Admin kullanıcısı giriş yaptı ama Firestore'a yazamıyor çünkü **Security Rules deploy edilmemiş**!

---

## ✅ Çözüm: Firebase Console'dan Rules'ı Deploy Et

### Adım 1: Firebase Console'a Git

https://console.firebase.google.com/

### Adım 2: LearnConnect Projesini Aç

### Adım 3: Firestore Database → Rules

Sol menüden:
1. **Firestore Database** tıkla
2. **Rules** tab'ına geç

### Adım 4: Aşağıdaki Rules'ı Kopyala-Yapıştır

**UYARI:** Mevcut rules'ı tamamen sil ve aşağıdakini yapıştır!

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin kontrol fonksiyonu
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Curriculum - public read, admin write
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
    
    // Admins koleksiyonu - sadece adminler okuyabilir
    match /admins/{adminId} {
      allow read: if request.auth != null && isAdmin();
      allow write: if false; // Sadece Firebase Console'dan
    }
    
    // User progress - user can read/write own data
    match /user_progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Study plans - user can read/write own data
    match /study_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // AI plans - user can read/write own data
    match /ai_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users koleksiyonu - admin read/write
    match /users/{userId} {
      allow read: if request.auth != null && (isAdmin() || request.auth.uid == userId);
      allow write: if request.auth != null && isAdmin();
    }
    
    // Audit logs - admin only
    match /audit_logs/{document=**} {
      allow read: if request.auth != null && isAdmin();
      allow write: if request.auth != null && isAdmin();
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Adım 5: Publish Butonuna Bas

Sağ üst köşede **"Publish"** butonuna bas.

**Onay mesajı görünecek:** "Rules published successfully!"

---

## 🎯 Test Et

### 1. Admin Dashboard'ı Yenile

Tarayıcıda:
```
Ctrl+Shift+R (hard refresh)
```

### 2. Tekrar Ders Ekle

1. **Müfredat** tab
2. **TYT** seç
3. **"Ders Ekle"**
4. Form doldur:
   ```
   Ders Adı: TYT Matematik
   Icon: 🧮
   Açıklama: TYT matematik müfredatı - 40 soru
   ```
5. **"Kaydet"**

### 3. Başarı Mesajı

✅ Hata yok!
✅ Ders listede görünür
✅ Firebase Console'da `curriculum` koleksiyonunda ders var

---

## 🚨 Hala Hata Varsa?

### Kontrol 1: Rules Publish Edildi mi?
- Firebase Console → Firestore → Rules
- En son "Published" zamanı şu an mı?

### Kontrol 2: Admin Dokümanı Var mı?
- Firebase Console → Firestore → Data
- `admins` koleksiyonu var mı?
- İçinde UID ile bir doküman var mı?
- UID, Authentication'daki kullanıcıyla aynı mı?

### Kontrol 3: Giriş Yapan Kullanıcı Admin mi?
Console'da:
```javascript
// F12 → Console → Bu kodu çalıştır:
auth.currentUser.uid
```

Bu UID, `admins` koleksiyonundaki doküman ID'si ile aynı olmalı!

---

## 📋 Checklist

```
✅ Firebase Console → Firestore → Rules
✅ Rules'ı kopyala-yapıştır
✅ Publish butonuna bas
✅ "Rules published successfully!" mesajını gör
✅ Admin dashboard'ı yenile (Ctrl+Shift+R)
✅ Tekrar ders ekle
✅ Başarı! 🎉
```

---

## ⏱️ Tahmini Süre

- Rules'ı kopyala-yapıştır: 30 saniye
- Publish: 5 saniye
- Test: 1 dakika
- **TOPLAM: ~2 dakika**

---

## 🎉 Başarılı Olduktan Sonra

Admin dashboard artık tam çalışır:
- ✅ Ders ekle/sil
- ✅ Konu ekle/düzenle
- ✅ JSON import/export
- ✅ User management
- ✅ Analytics
- ✅ AI tools

---

**ŞİMDİ FIREBASE CONSOLE'A GİDİN VE RULES'I PUBLISH EDİN!** 🚀

2 dakika sonra her şey çalışacak! 💪
