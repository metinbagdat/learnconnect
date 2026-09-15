# 🌱 Firestore Seed Script - Kullanım Talimatları

## 🎯 İki Yöntem Var

### ✅ Yöntem 1: Node.js Script (ÖNERİLEN - Daha Güvenilir)

**Adımlar:**

1. **Terminal'de proje dizinine gidin:**
   ```powershell
   cd C:\Users\mb\Desktop\LearnConnect\LearnConnect
   ```

2. **.env dosyasını kontrol edin:**
   ```powershell
   if (Test-Path ".env") {
       Get-Content ".env" | Select-String "FIREBASE"
   } else {
       Write-Host "❌ .env file not found!" -ForegroundColor Red
   }
   ```

3. **Seed script'i çalıştırın:**
   ```powershell
   node seed-firestore.js
   ```

4. **Başarılı olursa şunu göreceksiniz:**
   ```
   🚀 Starting Firestore seed...
   ✓ Firebase initialized
      Project: learnconnect-7c499
   ✅ 🧮 Matematik
      📘 Sayılar
         • 6 subtopics added
      📘 Cebir
         • 6 subtopics added
   ...
   🎉 Firestore seeding completed successfully!
   ```

5. **Firebase Console'dan kontrol edin:**
   - Firebase Console → Firestore Database → Data
   - `curriculum/tyt/subjects` altında dersleri görmelisiniz

---

### 🌐 Yöntem 2: Browser Console (Alternatif)

**Eğer Node.js script çalışmazsa:**

1. **Uygulamayı başlatın:**
   ```powershell
   npm run dev
   ```

2. **Browser'da açın:**
   - `http://localhost:5173` adresine gidin

3. **Developer Console'u açın:**
   - **F12** tuşuna basın
   - **Console** sekmesine gidin

4. **Script'i çalıştırın:**
   - `BROWSER_CONSOLE_SEED_FIXED.js` dosyasını açın
   - **TAMAMINI** kopyalayın (Ctrl + A, Ctrl + C)
   - Console'a yapıştırın (Ctrl + V)
   - **Enter** tuşuna basın

5. **Başarılı olursa:**
   - Console'da başarı mesajlarını göreceksiniz
   - Firebase Console'dan kontrol edin

---

## ⚠️ Hata Durumları

### ❌ "Missing or invalid Firebase config"
**Çözüm:**
- `.env` dosyasını kontrol edin
- Firebase config değerlerinin doğru olduğundan emin olun

### ❌ "Permission denied"
**Çözüm:**
- Firebase Console → Firestore → Rules
- Rules'ı kontrol edin ve Publish edin

### ❌ "Firestore is not enabled"
**Çözüm:**
- Firebase Console → Firestore Database
- "Create database" tıklayın
- Location: `europe-west1` seçin

### ❌ "Cannot find module"
**Çözüm:**
- `npm install firebase` çalıştırın
- Veya `npm install --legacy-peer-deps` deneyin

---

## ✅ Başarı Kontrolü

1. **Firebase Console:**
   - Firestore Database → Data
   - `curriculum/tyt/subjects` → `mathematics`, `turkish`, `science`, `social` görünmeli

2. **React App:**
   - Uygulamada "Müfredat" sekmesine gidin
   - Dersler, konular ve alt konular görünmeli

3. **Console Log:**
   - Seed script başarılı mesajları göstermeli
   - Summary'de sayılar görünmeli

---

## 📝 Notlar

- Seed script'i **birden fazla kez çalıştırabilirsiniz** (idempotent)
- Mevcut veriler **üzerine yazılır** (update edilir)
- **Production'da dikkatli kullanın**

---

## 🔗 Faydalı Linkler

- Firebase Console: https://console.firebase.google.com
- Firestore Rules: Firebase Console → Firestore → Rules
- Project Settings: Firebase Console → Project Settings
