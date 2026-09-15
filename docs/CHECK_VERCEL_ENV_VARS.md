# ✅ Vercel Environment Variables Kontrol Listesi

## 🔍 Kontrol Adımları

### Adım 1: Vercel Dashboard'a Git

```
https://vercel.com/dashboard
→ learn-connect projesi
→ Settings → Environment Variables
```

### Adım 2: 7 Firebase Variable Kontrol

**Her biri için kontrol edin:**

| # | Variable Name | Gerekli Değer | Environments |
|---|--------------|---------------|--------------|
| 1 | `VITE_FIREBASE_API_KEY` | `AIzaSy...` (Firebase'den) | ✅ Production ✅ Preview ✅ Development |
| 2 | `VITE_FIREBASE_AUTH_DOMAIN` | `learnconnect-7c499.firebaseapp.com` | ✅ Production ✅ Preview ✅ Development |
| 3 | `VITE_FIREBASE_PROJECT_ID` | `learnconnect-7c499` | ✅ Production ✅ Preview ✅ Development |
| 4 | `VITE_FIREBASE_STORAGE_BUCKET` | `learnconnect-7c499.appspot.com` | ✅ Production ✅ Preview ✅ Development |
| 5 | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `94708429652` (Firebase'den) | ✅ Production ✅ Preview ✅ Development |
| 6 | `VITE_FIREBASE_APP_ID` | `1:94708429652:web:...` (Firebase'den) | ✅ Production ✅ Preview ✅ Development |
| 7 | `VITE_FIREBASE_MEASUREMENT_ID` | `G-SKHJCN4ST9` (Firebase'den) | ✅ Production ✅ Preview ✅ Development |

### Adım 3: Firebase Console'dan Değerleri Al

```
https://console.firebase.google.com/project/learnconnect-7c499/settings/general
→ Your apps → Web app (</>) → SDK setup and configuration → Config
```

**firebaseConfig objesi:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // → VITE_FIREBASE_API_KEY
  authDomain: "...",             // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "learnconnect-7c499", // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "...",          // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...",     // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "...",                 // → VITE_FIREBASE_APP_ID
  measurementId: "G-..."        // → VITE_FIREBASE_MEASUREMENT_ID
};
```

### Adım 4: Eksik Variable'ları Ekle

**Her eksik variable için:**

1. **"Add New"** butonu
2. **Name:** `VITE_FIREBASE_API_KEY` (veya diğeri)
3. **Value:** Firebase Console'dan kopyaladığınız değer
4. **Environments:** 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. **"Save"** butonu

### Adım 5: Redeploy (Variables Aktif Olsun)

1. **Deployments** → En üstteki deployment
2. **⋯** (üç nokta) → **"Redeploy"**
3. **"Use existing Build Cache"** işaretini **KALDIRIN**
4. **"Redeploy"** butonu
5. **Ready** olana kadar bekleyin (2-3 dakika)

---

## ✅ Kontrol Listesi

```bash
□ VITE_FIREBASE_API_KEY var mı?
□ VITE_FIREBASE_AUTH_DOMAIN var mı?
□ VITE_FIREBASE_PROJECT_ID var mı?
□ VITE_FIREBASE_STORAGE_BUCKET var mı?
□ VITE_FIREBASE_MESSAGING_SENDER_ID var mı?
□ VITE_FIREBASE_APP_ID var mı?
□ VITE_FIREBASE_MEASUREMENT_ID var mı?
□ Her biri Production ortamında mı?
□ Her biri Preview ortamında mı?
□ Her biri Development ortamında mı?
□ Redeploy yapıldı mı?
□ Deployment Ready oldu mu?
```

---

## 🚨 Hata Durumunda

### "Firebase: No Firebase App '[DEFAULT]'"

**Sebep:** Environment variables eksik veya yanlış

**Çözüm:**
1. Tüm 7 variable'ın eklendiğinden emin olun
2. Değerlerin Firebase Console'dakiyle aynı olduğunu kontrol edin
3. Redeploy yapın (cache'siz)

### "Missing environment variables"

**Sebep:** Variable adları yanlış (VITE_ öneki eksik)

**Çözüm:**
- Variable adları **VITE_** ile başlamalı!
- `FIREBASE_API_KEY` ❌
- `VITE_FIREBASE_API_KEY` ✅

---

**ŞİMDİ YAPIN:**

1. Vercel → Settings → Environment Variables
2. 7 variable'ı kontrol edin
3. Eksik varsa ekleyin
4. Redeploy yapın
