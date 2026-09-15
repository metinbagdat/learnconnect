# Vercel: Projeyi Sil → Yeniden Import → SSL Fix + Checklist

Bu rehberi **sırayla** uygulayın. Her adımı tamamladıktan sonra ✓ işaretleyin.

---

## YAPILMASI GEREKENLER (Özet)

1. **Vercel projesini sil** (Settings → Advanced → Delete Project).
2. **learnconnect-** repo’sunu yeniden import et (Add New → Project → GitHub).
3. **Build ayarları:** Override kapalı, Framework: Vite, `vercel.json` yok.
4. **Environment Variables:** 7 adet `VITE_FIREBASE_*` ekle (Production + Preview + Development).
5. **Redeploy** yap (cache’siz); deployment **Ready** olsun.
6. **Domains:** `egitim.today`, `www.egitim.today` ekle.
7. **Git:** Bağlı, **Automatically deploy from main** açık.
8. **Firestore Rules:** Test için geçici `allow read, write: if true` publish et.
9. **Test:** Site, Admin, Login, Ders ekleme, Firestore kontrol.

---

## KALDIĞIN YERDEN DEVAM (Bölüm 1–2 ve Domain’ler tamam)

**Tamamlananlar:**
- ✅ BÖLÜM 1: Proje silindi
- ✅ BÖLÜM 2: `learnconnect-` yeniden import edildi, deploy **Ready**
- ✅ BÖLÜM 4: Domain’ler eklendi (`egitim.today`, `www.egitim.today`)

**Şimdi yapılacak (sırayla):**
1. **BÖLÜM 3:** 7 Firebase environment variable ekle → **VERCEL_7_DEGISKEN_EKLE.txt** dosyasındaki değerleri kullan.
2. **BÖLÜM 3.3:** Redeploy (cache’siz).
3. **BÖLÜM 5–6:** Git + Build ayarlarını kontrol et.
4. **BÖLÜM 7:** Firestore test rules (isteğe bağlı).
5. **Test:** https://egitim.today/admin → Login → Ders ekle.

---

## ÖN HAZIRLIK (2 dk)

### 1. Domain’leri not edin
- `egitim.today`
- `www.egitim.today`
- `learn-connect-alpha.vercel.app` (Vercel varsayılan)

### 2. Firebase config’i açın
```
https://console.firebase.google.com/project/learnconnect-7c499/settings/general
→ Your apps → Web app → Config
```
`firebaseConfig` değerlerini kopyalayıp bir yere kaydedin (Adım 5’te kullanılacak).

---

## BÖLÜM 1: MEVCUT PROJEYİ SİL

### Adım 1.1 – Proje ayarlarına git
1. **Vercel Dashboard:** https://vercel.com/dashboard  
2. **learn-connect** projesine tıklayın.  
3. Üstten **Settings** sekmesine girin.

### Adım 1.2 – Advanced bölümü
1. Sol menüden en alta inin.  
2. **Advanced** → **Delete Project** bölümünü bulun.

### Adım 1.3 – Projeyi sil
1. **Delete Project** butonuna tıklayın.  
2. Proje adını yazıp onaylayın (`learn-connect`).  
3. **Delete** ile silme işlemini tamamlayın.

- [ ] **1.3 tamamlandı:** Proje silindi.

---

## BÖLÜM 2: YENİ PROJE – GITHUB’DAN IMPORT

### Adım 2.1 – Yeni proje oluştur
1. **Vercel Dashboard** → **Add New** → **Project**.  
2. **Import Git Repository** ekranı açılır.

### Adım 2.2 – Repository seç
1. **GitHub** hesabınızı seçin.  
2. **metinbagdat/learnconnect-** repository’sini bulun.  
3. **Import** butonuna tıklayın.

### Adım 2.3 – Build & Output ayarları (ÖNEMLİ)
**Framework Preset:** `Vite` (otomatik algılanmalı).

**Override kullanmayın.** Aşağıdakiler **boş** veya **varsayılan** kalsın:

| Ayar | Değer | Override |
|------|--------|----------|
| **Build Command** | `npm run build` veya boş | Kapalı |
| **Output Directory** | `dist` veya boş | Kapalı |
| **Install Command** | varsayılan | Kapalı |
| **Root Directory** | `./` (boş) | Kapalı |

**`vercel.json` kullanmayın.** Repo’da yok; eklemeyin.

- [ ] **2.3 tamamlandı:** Build ayarları kontrol edildi, override yok.

### Adım 2.4 – İlk deploy’u başlat
1. **Deploy** butonuna basın.  
2. Build’in bitmesini bekleyin (2–3 dk).  
3. **Ready** olunca devam edin.

- [ ] **2.4 tamamlandı:** İlk deployment **Ready**.

---

## BÖLÜM 3: ENVIRONMENT VARIABLES (7 FIREBASE)

### Adım 3.1 – Environment Variables sayfası
1. Proje içinde **Settings** → **Environment Variables**.

### Adım 3.2 – Aşağıdaki 7 değişkeni ekleyin

Her biri için: **Add New** → **Name** + **Value** → **Environments:** Production, Preview, Development (hepsi seçili) → **Save**.

| # | Name | Value |
|---|------|-------|
| 1 | `VITE_FIREBASE_API_KEY` | `AIzaSyDeZACW1poVyTucZgq0Y1JnqlAumRhnwkg` |
| 2 | `VITE_FIREBASE_AUTH_DOMAIN` | `learnconnect-7c499.firebaseapp.com` |
| 3 | `VITE_FIREBASE_PROJECT_ID` | `learnconnect-7c499` |
| 4 | `VITE_FIREBASE_STORAGE_BUCKET` | `learnconnect-7c499.appspot.com` |
| 5 | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `94708429652` |
| 6 | `VITE_FIREBASE_APP_ID` | `1:94708429652:web:af1e854867d6eeaf3dcec1` |
| 7 | `VITE_FIREBASE_MEASUREMENT_ID` | `G-520454055` |

**Not:** `VITE_FIREBASE_API_KEY` Firebase Console → Project settings → Web app → `apiKey` ile kontrol edin.  
Hızlı kopyala-yapıştır için `VERCEL_7_DEGISKEN_EKLE.txt` dosyasını kullanın.  
Firebase Console’daki değerler farklıysa, oradaki değerleri kullanın.

- [ ] **3.2 tamamlandı:** 7 Firebase environment variable eklendi.

### Adım 3.3 – Redeploy (variables aktif olsun)
1. **Deployments** → en üstteki deployment.  
2. **⋯** → **Redeploy**.  
3. **Use existing Build Cache** işaretini **kaldırın**.  
4. **Redeploy** ile onaylayın.  
5. **Ready** olana kadar bekleyin.

- [ ] **3.3 tamamlandı:** Redeploy yapıldı, deployment **Ready**.

---

## BÖLÜM 4: DOMAIN’LERİ EKLE

### Adım 4.1 – Domains ayarı
1. **Settings** → **Domains**.

### Adım 4.2 – Domain ekle
1. **Add** → `egitim.today` yazın → **Add**.  
2. Tekrar **Add** → `www.egitim.today` yazın → **Add**.

DNS zaten Vercel’e yönlüyse, birkaç dakika içinde **Verified** olur.

- [ ] **4.2 tamamlandı:** `egitim.today` ve `www.egitim.today` eklendi ve verified.

---

## BÖLÜM 5: GİT AYARLARI

### Adım 5.1 – Git sayfası
1. **Settings** → **Git**.

### Adım 5.2 – Kontroller
- **Connected Git Repository:** `metinbagdat/learnconnect-` ✅  
- **Production Branch:** `main`  
- **Automatically deploy from main branch:** ✅ (açık)

- [ ] **5.2 tamamlandı:** Git bağlı, auto-deploy açık.

---

## BÖLÜM 6: BUILD & DEPLOYMENT AYARLARI

### Adım 6.1 – Build & Development
1. **Settings** → **Build and Deployment** (veya **General** altında).

### Adım 6.2 – Kontroller
- **Framework Preset:** Vite  
- **Build Command:** Override **kapalı** (Vite varsayılanı)  
- **Output Directory:** Override **kapalı** (`dist`)  
- **Production Overrides** uyarısı **olmamalı**.

- [ ] **6.2 tamamlandı:** Build ayarları override’sız, Vite/default.

---

## BÖLÜM 7: FIRESTORE RULES (TEST İÇİN)

### Adım 7.1 – Firestore Rules
1. **Firebase Console:** https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules  

### Adım 7.2 – Geçici test kuralı
Mevcut kuralları **geçici** olarak aşağıdaki ile değiştirin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Adım 7.3 – Publish
1. **Publish** butonuna basın.  
2. Test bittikten sonra production kurallarınızı geri yükleyin.

- [ ] **7.3 tamamlandı:** Test rules published.

---

## KONTROL LİSTESİ (ÖZET)

- [ ] **1.3** Proje silindi  
- [ ] **2.3** Build ayarları override’sız, `vercel.json` yok  
- [ ] **2.4** İlk deploy **Ready**  
- [ ] **3.2** 7 Firebase env var eklendi  
- [ ] **3.3** Env var’lı redeploy **Ready**  
- [ ] **4.2** `egitim.today` + `www.egitim.today` eklendi  
- [ ] **5.2** Git bağlı, auto-deploy açık  
- [ ] **6.2** Build & Deployment ayarları doğru  
- [ ] **7.3** Firestore test rules published  

---

## TEST ADIMLARI

### Site
1. **https://egitim.today** açılır, SSL hatası **olmamalı**.  
2. **https://www.egitim.today** aynı şekilde çalışmalı.

### Admin
1. **https://egitim.today/admin** açın.  
2. **F12** → **Console:**  
   - `Firebase: No Firebase App` vb. hata **olmamalı**.  
3. Admin login:  
   - Email: `metinbagdat@gmail.com`  
   - Şifre: Firebase Auth’daki şifre.  
4. **Müfredat Yönetimi** → **TYT** → **Ders Ekle** → Form doldur → **Kaydet**.

### Firestore
1. **Firebase Console** → **Firestore** → **Data**.  
2. `curriculum` koleksiyonunda yeni eklediğiniz ders görünmeli.

- [ ] Site SSL hatası yok  
- [ ] Admin açılıyor, konsol temiz  
- [ ] Login çalışıyor  
- [ ] Ders ekleme çalışıyor  
- [ ] Firestore’da veri görünüyor  

---

## HATA DURUMUNDA

### Build fail
- **Deployments** → ilgili deployment → **Build Logs**.  
- Hata mesajını kopyalayıp paylaşın.

### SSL_ERROR_RX_RECORD_TOO_LONG
- Repo’da **`vercel.json` olmamalı**.  
- Proje **yeniden import** edilmiş ve **en güncel main** (5c566a4) deploy edilmiş olmalı.

### Firebase / konsol hataları
- **Settings** → **Environment Variables:** 7 Firebase değişkeni **Production** dahil tüm ortamlara ekli mi kontrol edin.  
- **Redeploy** (cache’siz) yapıp tekrar deneyin.

---

**Bu rehberi adım sırasıyla uyguladığınızda:**  
- `vercel.json` yok → SSL hatası kalkar.  
- En güncel `main` (5c566a4) deploy edilir.  
- Firebase + Admin + Firestore testleri yapılmış olur.
