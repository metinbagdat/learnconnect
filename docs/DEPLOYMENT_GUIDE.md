# LearnConnect Deployment & Admin Setup Guide

Bu doküman, LearnConnect projesinin Firebase ve Vercel'e deploy edilmesi ve admin dashboard'unun kurulumu için adım adım rehberdir.

## 📋 İçindekiler

1. [Firestore Security Rules Deployment](#1-firestore-security-rules-deployment)
2. [Admin Login Test ve Kurulum](#2-admin-login-test-ve-kurulum)
3. [MEB Müfredatı Initial Data Ekleme](#3-meb-müfredatı-initial-data-ekleme)
4. [Admin Dashboard Test Senaryoları](#4-admin-dashboard-test-senaryoları)
5. [Environment Variables Ayarlama](#5-environment-variables-ayarlama)
6. [Vercel Deployment](#6-vercel-deployment)
7. [Post-Deployment Test Checklist](#7-post-deployment-test-checklist)

---

## 1. Firestore Security Rules Deployment

### Adımlar:

1. **Firebase CLI Kurulumu** (eğer yoksa):
```bash
npm install -g firebase-tools
```

2. **Firebase'e Login**:
```bash
firebase login
```

3. **Firebase Projesini Bağla** (ilk kez):
```bash
firebase init firestore
```
- Mevcut projeyi seç veya yeni oluştur
- `firestore.rules` dosyasını kullan

4. **Firestore Rules Deploy**:
```bash
firebase deploy --only firestore:rules
```

### ✅ Başarı Kontrolü:
```bash
# Rules'ın deploy edildiğini kontrol et
firebase firestore:rules:get
```

### 📝 Notlar:
- Mevcut `firestore.rules` dosyası admin kontrolü için `admins` koleksiyonunu kullanıyor
- Admin kullanıcılar `admins/{userId}` dokümanına sahip olmalı
- Rules'ı değiştirdikten sonra mutlaka deploy et

---

## 2. Admin Login Test ve Kurulum

### 2.1 Admin Kullanıcı Oluşturma

**Yöntem 1: Firebase Console'dan (Manuel)**
1. Firebase Console → Authentication → Users
2. "Add user" → Email/Password ile kullanıcı oluştur
3. Firestore → `admins` koleksiyonuna yeni doküman ekle:
   - Document ID: `{userId}` (Authentication'daki UID)
   - Fields: `{ email: "admin@example.com", createdAt: timestamp }`

**Yöntem 2: Script ile (Önerilen)**

`scripts/init-admin.js` dosyasını çalıştır:
```bash
node scripts/init-admin.js
```

### 2.2 Admin Login Test

1. **Frontend'den Test**:
   - Admin panel sayfasına git: `/admin`
   - Email ve password ile login ol
   - Admin yetkilerinin çalıştığını kontrol et

2. **API'den Test**:
```bash
# Login endpoint'ini test et
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### ✅ Başarı Kriterleri:
- [ ] Admin kullanıcı oluşturuldu
- [ ] `admins/{userId}` dokümanı Firestore'da mevcut
- [ ] Admin login başarılı
- [ ] Admin panel erişilebilir

---

## 3. MEB Müfredatı Initial Data Ekleme

### 3.1 MEB Curriculum Data Yapısı

MEB müfredatına uygun ders verileri `scripts/seed-meb-curriculum.js` scripti ile eklenir.

### 3.2 Script Çalıştırma

```bash
# Service account key'i ayarla (ilk kez)
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"

# Script'i çalıştır
node scripts/seed-meb-curriculum.js
```

### 3.3 Veri Yapısı

Script şu koleksiyonları oluşturur:
- `curriculum/tyt/subjects` - TYT dersleri
- `curriculum/ayt/subjects` - AYT dersleri
- Her subject altında `topics` subcollection

### ✅ Başarı Kontrolü:
```bash
# Firestore Console'dan kontrol et
# veya script çıktısını kontrol et
```

---

## 4. Admin Dashboard Test Senaryoları

### 4.1 Test Checklist

#### Login Test
- [ ] Admin email/password ile login
- [ ] Non-admin kullanıcı login denemesi (başarısız olmalı)
- [ ] Session persistence (sayfa yenilendiğinde login kalıyor mu)

#### CRUD Testleri
- [ ] **Create**: Yeni ders ekleme
- [ ] **Read**: Ders listesi görüntüleme
- [ ] **Update**: Mevcut dersi düzenleme
- [ ] **Delete**: Ders silme

#### AI Features Test
- [ ] AYT Müfredat Üret (Generate AYT Curriculum)
- [ ] Öğrenme Ağacı Üret (Generate Learning Tree)
- [ ] Çalışma Planı Üret (Generate Study Plan)
- [ ] AI üretilen verilerin Firestore'a kaydedilmesi

#### Analytics Test
- [ ] Dashboard analytics verilerinin görüntülenmesi
- [ ] Kullanıcı istatistikleri
- [ ] Ders tamamlama oranları

### 4.2 Test Script Çalıştırma

```bash
# Test script'i çalıştır (eğer varsa)
npm run test:admin

# Veya manuel test
# Admin panelde her özelliği tek tek test et
```

---

## 5. Environment Variables Ayarlama

### 5.1 Local Development (.env.local)

`.env.local` dosyası oluştur (root dizinde):

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Server Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
NODE_ENV=development
PORT=5000

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/learnconnect

# Admin Configuration
ADMIN_EMAIL=admin@learnconnect.com
ADMIN_INITIAL_PASSWORD=Admin123!
```

### 5.2 Vercel Environment Variables

1. **Vercel Dashboard'a Git**:
   - https://vercel.com/dashboard
   - Projeni seç → Settings → Environment Variables

2. **Tüm Environment Variables'ı Ekle**:
   - Her değişken için:
     - **Name**: Değişken adı (örn: `VITE_FIREBASE_API_KEY`)
     - **Value**: Değişken değeri
     - **Environment**: Production, Preview, Development (hepsini seç)

3. **Gerekli Variables**:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ANTHROPIC_API_KEY
   ANTHROPIC_MODEL
   DATABASE_URL (if applicable)
   ```

### ✅ Kontrol:
```bash
# Local'de test et
npm run dev

# Environment variables yüklendi mi kontrol et
# Browser console'da: console.log(import.meta.env)
```

---

## 6. Vercel Deployment

### 6.1 Vercel CLI Kurulumu

```bash
npm install -g vercel
```

### 6.2 İlk Deploy

```bash
# Vercel'e login
vercel login

# Projeyi deploy et
vercel

# Production'a deploy
vercel --prod
```

### 6.3 GitHub Integration (Önerilen)

1. **GitHub Repository'yi Bağla**:
   - Vercel Dashboard → Import Project
   - GitHub repository'yi seç
   - Build settings'i ayarla

2. **Build Settings**:
   - **Framework Preset**: Vite (veya Next.js)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (Vite için) veya `.next` (Next.js için)
   - **Install Command**: `npm install`

3. **Auto Deploy**:
   - `main` branch'e push yapıldığında otomatik deploy

### 6.4 Vercel.json Kontrolü

`vercel.json` dosyasının doğru yapılandırıldığından emin ol:
- API routes doğru yönlendiriliyor mu?
- Rewrites/redirects doğru mu?

### ✅ Deploy Sonrası Kontrol:
```bash
# Production URL'yi test et
curl https://your-project.vercel.app/api/health

# Admin panel erişimi
# https://your-project.vercel.app/admin
```

---

## 7. Post-Deployment Test Checklist

### 7.1 Website Erişimi
- [ ] Ana sayfa yükleniyor
- [ ] CSS/JS dosyaları yükleniyor
- [ ] API endpoints çalışıyor

### 7.2 Authentication
- [ ] Kullanıcı kayıt olabiliyor
- [ ] Kullanıcı login olabiliyor
- [ ] Admin login çalışıyor

### 7.3 Admin Panel
- [ ] Admin panel erişilebilir
- [ ] CRUD operasyonları çalışıyor
- [ ] AI features çalışıyor
- [ ] Analytics görüntüleniyor

### 7.4 Firestore Integration
- [ ] Veri okuma çalışıyor
- [ ] Veri yazma çalışıyor
- [ ] Security rules doğru çalışıyor

### 7.5 Performance
- [ ] Sayfa yükleme hızı kabul edilebilir
- [ ] API response süreleri normal
- [ ] Error handling çalışıyor

---

## 🚀 Hızlı Setup Script

Tüm adımları otomatikleştiren script:

```bash
# Setup script'i çalıştır
chmod +x scripts/setup-deployment.sh
./scripts/setup-deployment.sh
```

---

## 📞 Sorun Giderme

### Firestore Rules Deploy Hatası
```bash
# Rules syntax kontrolü
firebase firestore:rules:get

# Detaylı log
firebase deploy --only firestore:rules --debug
```

### Vercel Build Hatası
- Environment variables eksik mi kontrol et
- Build log'larını incele
- Local build'i test et: `npm run build`

### Admin Login Çalışmıyor
- Firestore'da `admins/{userId}` dokümanı var mı?
- Authentication'da kullanıcı var mı?
- Browser console'da hata var mı?

---

## 📚 Ek Kaynaklar

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0
