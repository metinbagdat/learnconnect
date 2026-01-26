# 🧪 Admin Dashboard Test Rehberi

## Test Senaryoları

### TEST 1: Admin Login

**URL:** `https://egitim.today/admin`

**Adımlar:**
1. Sayfa açılır
2. Login formu görünür
3. Email: `metinbagdat@gmail.com`
4. Password: [Firebase Auth'daki şifre]
5. **"Giriş Yap"** butonuna bas

**Beklenen:**
- ✅ Login başarılı
- ✅ Admin panel açılır
- ✅ 4 tab görünür: Müfredat, Kullanıcılar, Analitikler, AI Asistan

**Hata varsa:**
- ❌ "User is not admin" → Firebase Console → Firestore → `admins/{uid}` dokümanı yok
- ❌ "Firebase: No Firebase App" → Environment variables eksik

---

### TEST 2: Curriculum Manager (CRUD)

**Tab:** Müfredat – Curriculum

#### 2.1 Ders Ekleme

1. **TYT** seç (exam type)
2. **"Ders Ekle"** butonu
3. Form doldur:
   - Ders Adı: `Matematik`
   - Sıra: `1`
   - Açıklama: `TYT Matematik müfredatı`
4. **"Ekle"** butonu

**Beklenen:**
- ✅ Ders listeye eklenir
- ✅ Firebase Console → Firestore → `curriculum/tyt/subjects` → Yeni ders görünür

#### 2.2 Konu Ekleme

1. Eklenen dersin yanında **"Konu Ekle"** butonu
2. Form doldur:
   - Konu Adı: `Sayılar`
   - Sıra: `1`
   - Tahmini Saat: `15`
   - Zorluk: `medium`
3. **"Ekle"** butonu

**Beklenen:**
- ✅ Konu ders altında görünür
- ✅ Firestore → `curriculum/tyt/subjects/{subjectId}/topics` → Yeni konu

#### 2.3 Alt Konu Ekleme

1. Konunun yanında **"Alt Konu Ekle"** butonu
2. Form doldur:
   - Alt Konu Adı: `Doğal Sayılar`
   - Sıra: `1`
3. **"Ekle"** butonu

**Beklenen:**
- ✅ Alt konu görünür
- ✅ Firestore → `curriculum/tyt/subjects/{subjectId}/topics/{topicId}/subtopics` → Yeni alt konu

#### 2.4 Ders Silme

1. Dersin yanında **"Sil"** butonu
2. Onay ver
3. **"Sil"** butonu

**Beklenen:**
- ✅ Ders listeden kalkar
- ✅ Firestore'dan silinir

---

### TEST 3: AI Curriculum Generator

**Tab:** AI Asistan – AI Assistant

#### 3.1 Tam TYT Müfredatı Oluştur

1. **"⚡ Tam TYT Müfredatı Oluştur (4 Ders)"** butonuna bas
2. Loading spinner görünür
3. 30-60 saniye bekle

**Beklenen:**
- ✅ 4 ders oluşturulur (Türkçe, Matematik, Fen, Sosyal)
- ✅ Her dersin konuları ve alt konuları var
- ✅ Preview'da görünür

#### 3.2 Firestore'a Kaydet

1. Oluşturulan müfredat preview'da görünür
2. **"Firestore'a Kaydet"** butonuna bas
3. Loading → Başarı mesajı

**Beklenen:**
- ✅ Tüm dersler Firestore'a yazılır
- ✅ `curriculum/tyt/subjects` koleksiyonunda 4 ders görünür
- ✅ Her dersin altında topics ve subtopics var

#### 3.3 Özel Prompt ile Müfredat

1. **"Özel Prompt"** textarea'sına yaz:
   ```
   TYT Geometri konularını oluştur
   ```
2. **"Müfredat Oluştur"** butonuna bas
3. Bekle → Preview görünür

**Beklenen:**
- ✅ Geometri dersi oluşturulur
- ✅ Konular ve alt konular var

---

### TEST 4: User Management

**Tab:** Kullanıcılar – Users

**Beklenen:**
- ✅ Kullanıcı listesi görünür
- ✅ Arama çalışır
- ✅ Filtreler çalışır (Aktif, Pasif, Premium)
- ✅ İstatistikler görünür (Toplam, Aktif, Premium, Toplam Saat)

**Test:**
1. Bir kullanıcının **"Aktif Et"** / **"Devre Dışı Bırak"** butonuna bas
2. Durum değişmeli

---

### TEST 5: Analytics Dashboard

**Tab:** Analitikler – Analytics

**Beklenen:**
- ✅ Metrikler görünür:
  - Toplam Kullanıcı
  - Toplam Ders
  - Toplam Çalışma Saati
  - Ortalama / Kullanıcı
  - Aktif Oran
- ✅ Büyüme göstergeleri görünür
- ✅ Exam type selector çalışır (TYT/AYT/YKS)

---

### TEST 6: AI Study Plan Tester

**Tab:** AI Asistan → AI Çalışma Planı Test

1. **"Test Planı Oluştur"** butonuna bas
2. Loading → Plan oluşturulur

**Beklenen:**
- ✅ Plan JSON formatında görünür
- ✅ Haftalık plan preview var
- ✅ Aylık özet var
- ✅ AI önerileri var

---

### TEST 7: Batch Operations (Import/Export)

**Tab:** Müfredat → İçe Aktar / Dışa Aktar

#### 7.1 Export

1. En az 1 ders eklenmiş olmalı
2. **"Dışa Aktar"** butonuna bas
3. JSON dosyası indirilir

**Beklenen:**
- ✅ JSON dosyası indirilir
- ✅ Format: `{ examType, subjects, exportedAt, version }`

#### 7.2 Import

1. **"İçe Aktar"** butonuna bas
2. Export edilen JSON dosyasını seç
3. Onay ver

**Beklenen:**
- ✅ Tüm dersler import edilir
- ✅ Topics ve subtopics de import edilir
- ✅ Firestore'da görünür

---

## 🚨 Hata Senaryoları ve Çözümleri

### "Missing or insufficient permissions"

**Sebep:** Firestore rules deploy edilmemiş veya admin user yok

**Çözüm:**
1. Firebase Console → Firestore → Rules → Publish
2. Firebase Console → Firestore → `admins/{uid}` dokümanı ekle

### "Firebase: No Firebase App '[DEFAULT]'"

**Sebep:** Environment variables eksik

**Çözüm:**
1. Vercel → Settings → Environment Variables
2. 7 adet `VITE_FIREBASE_*` ekle
3. Redeploy yap

### "AI servisine bağlanılamadı"

**Sebep:** OpenAI API key yok veya API route çalışmıyor

**Çözüm:**
1. Vercel → Settings → Environment Variables
2. `OPENAI_API_KEY` ekle
3. Redeploy yap

---

## ✅ Test Checklist

```bash
□ Admin login çalışıyor
□ Curriculum Manager - Ders ekleme çalışıyor
□ Curriculum Manager - Konu ekleme çalışıyor
□ Curriculum Manager - Alt konu ekleme çalışıyor
□ Curriculum Manager - Ders silme çalışıyor
□ AI Generator - Tam TYT müfredatı oluşturuyor
□ AI Generator - Firestore'a kaydediyor
□ AI Generator - Özel prompt çalışıyor
□ User Management - Liste görünüyor
□ User Management - Filtreler çalışıyor
□ Analytics Dashboard - Metrikler görünüyor
□ AI Study Plan Tester - Plan oluşturuyor
□ Batch Import - JSON import çalışıyor
□ Batch Export - JSON export çalışıyor
□ Firestore'da veriler görünüyor
```

---

**Tüm testleri tamamladıktan sonra bana sonuçları bildirin!** 🚀
