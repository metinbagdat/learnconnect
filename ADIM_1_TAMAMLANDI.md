# Adım 1: MEB Müfredatını Yükle ✅ TAMAMLANDI

286 TYT/AYT konusunu başarıyla organize ettik. Şimdi veritabanına yükleyelim.

## 📊 Ne Yaptık?

```text
✅ 10 Dersi
   - 4 TYT: Matematik, Türkçe, Sosyal Bilgiler, Fen Bilimleri
   - 6 AYT: Matematik, Fizik, Kimya, Biyoloji, Tarih, Coğrafya

✅ 58 Ünite
   - Bölündü: Konular, Temel Operasyonlar, Eşitsizlikler, vb.

✅ 286 Konu
   - Özel zorluk seviyeleri (1-5)
   - Tahmini çalışma süresi (35-90 dk)
   - TYT/AYT etiketleri

⏱️ Toplam tahmini çalışma saati: ~262 saat
```

## 🚀 Adım-Adım Yükleme

### 1. Supabase Hazırlığı

```bash
# Proje dizininde:
cd C:\Users\mb\Desktop\learnconnect\learnconnect

# A. Eğer Supabase CLI kurulu değilse:
npm install -g supabase

# B. Supabase projene bağlan:
supabase login

# C. Migrationları çalıştır:
supabase db push
```

Veya **Supabase Admin Panel** üzerinden:

```sql
-- SQL Editor'a git ve kopyala-yapıştır:
-- migrations/0001_curriculum_tables.sql
-- migrations/0002_seed_tyt_ayt_curriculum.sql (isteğe bağlı)
```

### 2. .env Dosyasını Güncelle

```bash
# .env veya .env.local dosyasına ekle:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Node.js API'ye ulaşmak için:
API_URL=http://localhost:3000
```

### 3. Müfredatı Yükle

#### Seçenek A: CLI ile (Tavsiye Edilir)

```bash
npm run import:curriculum
```

#### Seçenek B: API Endpoint ile

```bash
# Sunucu çalışıyor mu kontrol et:
npm run dev

# Başka terminal'de:
curl -X POST http://localhost:3000/api/admin/curriculum-import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d @curriculum-tyt-ayt-full.json
```

#### Seçenek C: Admin Panel UI'den

1. Admin Dashboard'a git: <http://localhost:3000/admin>
2. "Müfredat İçeri Aktar" butonuna tıkla.
3. JSON dosyasını seç ve yükle.

## 📁 Dosya Konumları

- **JSON Veri:** `curriculum-tyt-ayt-full.json` (kök dizin)
- **Script:** `scripts/generate-tyt-ayt-curriculum.js` (kullanılan)
- **İmport Script:** `scripts/import-curriculum-to-supabase.js` (kullanılan)
- **CLI Alternatifi:** `scripts/load-curriculum.cjs` (CommonJS uyumlu)

## ✅ Başarı Kontrol

Yükleme tamamlandı mı? Kontrol et:

```bash
# Supabase CLI ile
supabase db shell

# SQL çalıştır:
SELECT COUNT(*) AS topic_count FROM topics;
-- Sonuç: 286

SELECT COUNT(*) AS unit_count FROM units;
-- Sonuç: 58

SELECT COUNT(*) AS subject_count FROM subjects;
-- Sonuç: 10
```

## 🎯 Sonraki Adım

### Adım 2: Admin Dashboard Tamamlama

- [ ] Admin `CurriculumManager.jsx` dosyasını tamamla
- [ ] Drag-and-drop sıralama ekle
- [ ] Konuları düzenle/sil özelliği
- [ ] Search/filter işlevselliği

### Adım 3: Öğrenci Onboarding

- [ ] `CurriculumSelection.jsx` test et
- [ ] 3 adım flow'u doğrula
- [ ] Seçilen konuları veritabanına yaz

### Adım 4: AI Coach Entegrasyonu

- [ ] `curriculum-filter.ts` ile uyumlu hale getir
- [ ] Günlük öneriler oluştur
- [ ] Haftalık plan sistemi

---

## 📧 Destek

Hata görürseniz rapor edin.

---

## 🎨 Bilgi Grafikleri

### Ders Dağılımı (TYT vs AYT)

```text
TYT (Temel Yeterlilik): 4 Ders
├─ Matematik (70 konu)
├─ Türkçe (25 konu)
├─ Sosyal Bilgiler (15 konu)
└─ Fen Bilimleri (15 konu)
   Toplam: 125 konu

AYT (Alan Yeterlilik): 6 Ders
├─ Matematik (32 konu)
├─ Fizik (25 konu)
├─ Kimya (20 konu)
├─ Biyoloji (20 konu)
├─ Tarih (10 konu)
└─ Coğrafya (14 konu)
   Toplam: 121 konu
```

### Zorluk Seviyeleri

```text
1: Çok Kolay (Tanım, Temel Kavramlar)
2: Kolay (Hesaplamalar, Uygulamalar)
3: Orta Zorluk (Analiz, Problem Çözme)
4: Zor (Sentez, Derinlemesine Anlama)
5: Çok Zor (İleri Hesaplamalar, Kanıtlar)
```
