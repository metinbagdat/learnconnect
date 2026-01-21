# 🔐 Firebase Console'da Admin Kullanıcısı Oluşturma Rehberi

## Adım 1: Firebase Console'a Giriş

1. **Tarayıcınızda açın:** https://console.firebase.google.com/
2. Google hesabınızla giriş yapın
3. **LearnConnect** projenizi seçin

---

## Adım 2: Authentication Bölümüne Gidin

1. Sol menüden **"Build"** sekmesine tıklayın
2. **"Authentication"** seçeneğine tıklayın
3. **"Users"** tab'ına geçin

![Authentication Menu](https://i.imgur.com/placeholder.png)

---

## Adım 3: Yeni Admin Kullanıcısı Oluşturun

### 3.1 "Add User" Butonuna Tıklayın

Sağ üst köşede bulunan **"Add user"** butonuna basın.

### 3.2 Admin Bilgilerini Girin

```
📧 Email: admin@learnconnect.com
🔑 Password: [Güvenli bir şifre oluşturun]

Örnek güvenli şifre: LearnConnect2024!@#
```

**Şifre kriterleri:**
- En az 6 karakter
- Harf, rakam ve özel karakter içermeli
- Tahmin edilmesi zor olmalı

### 3.3 "Add user" Butonuna Basın

Kullanıcı oluşturulduktan sonra, liste yenilenecek.

---

## Adım 4: UID'yi Kopyalayın

1. Yeni oluşturduğunuz kullanıcıyı listede bulun
2. **UID** sütunundaki uzun metni kopyalayın
   
   Örnek UID: `xYz123AbC456DeF789GhI012`

📋 **UID'yi bir yere kaydedin** - bir sonraki adımda kullanacaksınız!

---

## Adım 5: Firestore Database'e Gidin

1. Sol menüden **"Firestore Database"** seçeneğine tıklayın
2. Eğer database oluşturmadıysanız:
   - **"Create database"** butonuna basın
   - **"Start in production mode"** seçin (security rules zaten hazır)
   - Location: `eur3 (europe-west)` veya size yakın olan
   - **"Enable"** butonuna basın

---

## Adım 6: `admins` Koleksiyonu Oluşturun

### 6.1 "Start collection" Butonuna Tıklayın

İlk kez kullanıyorsanız ekranın ortasında göreceksiniz.

### 6.2 Koleksiyon Adını Girin

```
Collection ID: admins
```

**"Next"** butonuna basın.

### 6.3 İlk Dokümanı Oluşturun

```
📄 Document ID: [Adım 4'te kopyaladığınız UID'yi yapıştırın]

Örnek: xYz123AbC456DeF789GhI012
```

### 6.4 Field'ları Ekleyin

Aşağıdaki field'ları **sırayla** ekleyin:

#### Field 1: email
```
Field: email
Type: string
Value: admin@learnconnect.com
```

#### Field 2: role
```
Field: role
Type: string
Value: super_admin
```

#### Field 3: permissions
```
Field: permissions
Type: array
```

Array içine aşağıdaki string değerleri ekleyin:
1. `manage_content`
2. `manage_users`
3. `view_analytics`

Array'e değer eklemek için:
- **"+ Add item"** butonuna basın
- Her bir permission için tekrarlayın

#### Field 4: createdAt
```
Field: createdAt
Type: timestamp
Value: [Now] (şu anki zaman otomatik)
```

#### Field 5: isActive
```
Field: isActive
Type: boolean
Value: true
```

### 6.5 "Save" Butonuna Basın

Tebrikler! Admin kullanıcısı oluşturuldu! 🎉

---

## Adım 7: Email Verification (Opsiyonel ama Önerilen)

1. **Authentication → Users** sayfasına geri dönün
2. Admin kullanıcısını listede bulun
3. Kullanıcının üzerine tıklayın
4. Sağ üstte **"⋮" (üç nokta)** menüsüne tıklayın
5. **"Email verification"** → **"Mark as verified"** seçin

---

## Adım 8: Security Rules'ı Kontrol Edin

1. **Firestore Database → Rules** tab'ına gidin
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
      allow write: if false;
    }
    
    match /user_progress/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /study_plans/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /audit_logs/{document=**} {
      allow read: if request.auth != null && isAdmin();
      allow write: if request.auth != null && isAdmin();
    }
  }
}
```

3. **"Publish"** butonuna basın

---

## ✅ Test Edin!

### Local Test

```bash
npm run dev
```

1. Tarayıcıda açın: `http://localhost:5173/admin`
2. Admin bilgileriyle giriş yapın:
   - Email: `admin@learnconnect.com`
   - Password: [Oluşturduğunuz şifre]

3. Giriş başarılıysa **Admin Dashboard** görünecek! 🎉

### Test Checklist

```
✅ Admin login çalışıyor
✅ Curriculum tab açılıyor
✅ Users tab açılıyor  
✅ Analytics tab açılıyor
✅ AI tab açılıyor
✅ Ders ekleme/silme çalışıyor
✅ JSON import/export çalışıyor
```

---

## 🚨 Sorun Giderme

### "Permission denied" Hatası

**Sebep:** Firestore rules yanlış veya admin dokümanı eksik

**Çözüm:**
1. Firestore'da `admins/{uid}` dokümanının var olduğunu kontrol edin
2. UID'nin Authentication'daki kullanıcıyla aynı olduğunu doğrulayın
3. Security rules'ın publish edildiğini kontrol edin

### "User not found" Hatası

**Sebep:** Authentication'da kullanıcı yok

**Çözüm:**
1. Authentication → Users'da admin kullanıcısını görüyor musunuz?
2. Email ve şifre doğru mu?
3. Email verified olarak işaretli mi?

### "Not authorized" Hatası

**Sebep:** Admin dokümanında role veya permissions eksik

**Çözüm:**
1. Firestore → `admins/{uid}` dokümanını açın
2. `role: "super_admin"` field'ının olduğunu kontrol edin
3. `permissions` array'inin dolu olduğunu kontrol edin

---

## 🎯 Sonraki Adımlar

Admin kullanıcısı oluşturulduktan sonra:

1. ✅ **İlk Dersi Ekleyin**
   - Admin Dashboard → Curriculum tab
   - "Ders Ekle" butonuna basın
   - Örnek: "TYT Matematik"

2. ✅ **AI ile Müfredat Oluşturun**
   - AI tab'ına gidin
   - "Tam TYT Müfredatı Oluştur" butonuna basın
   - Oluşturulan müfredatı Firestore'a kaydedin

3. ✅ **Production'a Deploy Edin**
   ```bash
   git add .
   git commit -m "feat: complete admin dashboard with advanced features"
   git push origin main
   ```

4. ✅ **Vercel Environment Variables Ekleyin**
   - Vercel Dashboard → Settings → Environment Variables
   - `OPENAI_API_KEY` ekleyin (AI features için)

---

## 📚 Ek Kaynaklar

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 🆘 Yardım

Sorun yaşıyorsanız:

1. Browser console'u açın (F12)
2. Network tab'ını kontrol edin
3. Firestore rules'ı tekrar kontrol edin
4. Admin dokümanının doğru UID ile oluşturulduğunu doğrulayın

**Not:** Tüm adımları doğru yaptıysanız, admin dashboard çalışıyor olmalı! 🚀
