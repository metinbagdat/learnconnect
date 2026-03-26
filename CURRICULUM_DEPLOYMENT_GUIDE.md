# 🎓 Adım 1: TAMAMLANDI - MEB Müfredatını Deploy Et

> **Durum:** ✅ 286 TYT/AYT konusu organize edildi ve yüklemeye hazır!

## 📊 Yüklenecek Veri

| Kategori | Miktar | Detaylar |
| --- | --- | --- |
| **Dersler** | 10 | TYT: 4, AYT: 6 |
| **Üniteler** | 58 | Dersi: Matematik, Türkçe, Fizik, vb. |
| **Konular** | 286 | Zorluk: 1-5, Süre: 35-90 dakika |
| **Tahmini Çalışma** | ~262 saat | 1 yıllık hazırlık programı |

---

## 🚀 BAŞLAMA (5 Dakika)

### Kurulum Scripti (En Hızlı Yöntem)

```bash
cd C:\Users\mb\Desktop\learnconnect\learnconnect

# Windows PowerShell veya Bash:
bash scripts/setup-curriculum.sh
```

Veya **adım adım** yapabilirsin:

---

## 📋 Adım Adım Yönerge

### 1️⃣ Bağımlılıkları Yükle

```bash
npm install
# Kurulan: @supabase/supabase-js, uuid
```

### 2️⃣ Environment Değişkenlerini Ayarla

`.env.local` dosyasına ekle:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... # (SECRET - Güvenli tut!)

API_URL=http://localhost:3000
NODE_ENV=development
```

> **Supabase'den Nasıl Alınır?**
>
> 1. <https://app.supabase.com> >> Seç Projenizi
> 2. Settings >> API
> 3. Project URL'i kopyala
> 4. `anon public` key'i kopyala
> 5. `service_role` key'i kopyala (SECRET!)

### 3️⃣ Supabase Migrations Deploy Et

#### A) **Supabase CLI ile (Tavsiye Edilir)**

```bash
# CLI'yı yükle (ilk kez)
npm install -g supabase

# Login yap
supabase login

# Migrations deploy et
supabase db push

# Input:
# - Migration adı: curriculum_setup
# - Onay: y (yes)

# Sonuç: ✅ Applied migration X/Y successfully
```

#### B) **Manuel (Supabase UI'den)**

1. Supabase Dashboard >> SQL Editor
2. `migrations/0001_curriculum_tables.sql` kopyala
3. SQL Editor'a yapıştır
4. Run (▶️ butonuna tıkla)
5. Bekle - ✅ Tamam

```sql
-- Örnek - yapıştırılacak kod:
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  ...
);
```

### 4️⃣ Müfredat Datos Oluştur (Generate)

```bash
npm run generate:curriculum

# Çıktı:
# ✅ Müfredat verileri oluşturuldu!
# 📊 İstatistikler:
#    - Dersler: 10
#    - Üniteler: 58
#    - Konular: 286
#    - Toplam tahmini çalışma saati: ~262 saat
# 📁 Dosya: ./curriculum-tyt-ayt-full.json
```

Dosya konumu: **`curriculum-tyt-ayt-full.json`** (proje kök dizini)

### 5️⃣ API Sunucusunu Başlat

Yeni terminal'de:

```bash
npm run dev

# Bekle: ✅ VITE v5.0.0 ready in 1234 ms
# >> Local:   http://localhost:5173
# >> API:     http://localhost:3000
```

### 6️⃣ Müfredat Verileri Yükle

Orijinal terminal'de:

#### **Seçenek A: Node.js Script'i ile**

```bash
npm run import:curriculum

# Çıktı:
# 🚀 Müfredat importu başlıyor...
# ✅ TYT Matematik (9 üniteler)
# ✅ TYT Türkçe (5 üniteler)
# ...
# 📊 İmport Sonuçları:
#    ✅ Dersler: 10
#    ✅ Üniteler: 58
#    ✅ Konular: 286
#    ✅ Hatasız tamamlandı!
```

#### **Seçenek B: curl/API ile**

```bash
curl -X POST http://localhost:3000/api/admin/curriculum-import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d @curriculum-tyt-ayt-full.json

# Beklenen Yanıt:
# {
#   "success": true,
#   "subjectsCreated": 10,
#   "unitsCreated": 58,
#   "topicsCreated": 286,
#   "errors": []
# }
```

#### **Seçenek C: Admin UI'den**

1. Tarayıcıyı aç: <http://localhost:5173/admin>
2. Üst menüde "Müfredat İçeri Aktarma" butonunu ara
3. `curriculum-tyt-ayt-full.json` dosyasını seç
4. "Upload" tıkla
5. Bekle: ✅ Import başarılı

### 7️⃣ Doğrulama

Verileri kontrol et:

#### Option A: Supabase Dashboardında

1. <https://app.supabase.com> >> Select Project
2. Table Editor
3. `subjects` table >> 10 satır görülüyor mu?
4. `topics` table >> 286 satır?

#### Option B: SQL Query'si ile

```sql
-- Supabase SQL Editor'da çalıştır:

-- Toplam konu sayısı
SELECT COUNT(*) as total_topics FROM topics;
-- Beklenen: 286

-- Dersi başına konu dağılımı
SELECT 
  s.name,
  COUNT(t.id) as topic_count,
  AVG(t.difficulty) as avg_difficulty,
  SUM(t.estimated_minutes) as total_minutes
FROM subjects s
LEFT JOIN units u ON s.id = u.subject_id  
LEFT JOIN topics t ON u.id = t.unit_id
GROUP BY s.id, s.name
ORDER BY topic_count DESC;

-- Beklenen çıktı:
-- TYT Matematik | 70 | 3.2 | 3850
-- AYT Matematik | 32 | 3.1 | 2100
-- ...
```

#### Option C: Node.js Script'i ile

```javascript
// test-curriculum-import.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data: topics, error } = await supabase
  .from('topics')
  .select('*')
  .limit(5);

console.log(`✅ ${topics.length} konu yüklendi`);
```

---

## ✅ Başarı Kontrol Listesi

- [ ] npm install tamamlandı
- [ ] .env.local SUPABASE_URL ile ayarlandı
- [ ] Supabase migrations deploy edildi
- [ ] `curriculum-tyt-ayt-full.json` oluşturuldu (286 konu)
- [ ] API sunucusu çalışıyor (<http://localhost:3000>)
- [ ] Veriler Supabase'e yüklendi
- [ ] SELECT COUNT(*) sorgusu 286 sonuç veruyor
- [ ] Admin Dashboard'ta 10 dersi görülüyor

---

## 🛠️ Hata Giderme

### "SUPABASE_URL is undefined"

```bash
✅ Çözüm:
1. .env.local dosyasını kontrol et
2. SUPABASE_URL değeri boş mu?
3. npm run dev'i yeniden başlat (env'ler cache'leniyor)
```

### "relation \"subjects\" does not exist"

```bash
✅ Çözüm:
1. migrations/0001_curriculum_tables.sql'ı Supabase'de çalıştırmadın
2. Supabase Dashboard >> SQL Editor >> Yapıştır >> Run
```

### "403 Unauthorized on POST /api/admin/curriculum-import"

```bash
✅ Çözüm:
1. -H "Authorization: Bearer YOUR_SERVICE_KEY" header'ı eksik
2. SERVICE_KEY doğru mu? (ANON_KEY değil)
3. API RLS policies kontrol et
```

### "ERR TypeError: fetch is not a function"

```bash
✅ Çözüm:
1. Node 18+ gerekli
2. node --version kontrol et
3. Çalışmazsa: node scripts/load-curriculum.cjs (alternatif)
```

---

## 📁 Dosya Yapısı

```text
learnconnect/
├── scripts/
│   ├── generate-tyt-ayt-curriculum.js    ← Veri oluştur
│   ├── import-curriculum-to-supabase.js   ← Supabase import
│   ├── load-curriculum.cjs                ← API import
│   └── setup-curriculum.sh                ← Otomatik kurulum
├── migrations/
│   ├── 0001_curriculum_tables.sql         ← Tablo yapısı
│   └── 0002_seed_tyt_ayt_curriculum.sql   ← Örnek veri
├── curriculum-tyt-ayt-full.json           ← 286 konu
├── .env.local                             ← Supabase keys
└── package.json
```

---

## 📚 Sonraki Adımlar

1. **Admin Dashboard** (Adım 2)
   - CurriculumManager.jsx tamamla
   - Drag-drop sıralama ekle
   - Search/filter

2. **Öğrenci Onboarding** (Adım 3)
   - CurriculumSelection.jsx test et
   - 3-step flow
   - Seçim kayıt

3. **AI Coach Integration** (Adım 4)
   - curriculum-filter.ts kullan
   - Günlük öneriler
   - Haftalık planlar

---

## 🎓 Müfredat Yapısı

### TYT (Temel Yeterlilik Testi) - Genel

```text
├── Matematik (70 konu)
│   ├─ Sayı Sistemleri
│   ├─ Üslü/Köklü
│   ├─ Eşitsizlikler
│   └─ ... (19+ ünite)
├── Türkçe (25 konu)
├── Sosyal Bilgiler (15 konu)
└── Fen Bilimleri (15 konu)
```

### AYT (Alan Yeterlilik Testi) - Uzmanlık

```text
├── Matematik (32 konu)
├── Fizik (25 konu)
├── Kimya (20 konu)
├── Biyoloji (20 konu)
├── Tarih (10 konu)
└── Coğrafya (14 konu)
```

---

## 💡 PRO TİPLER

1. **Backup Al**

   ```bash
   supabase db pull
   ```

2. **Veri Reset**

   ```bash
   supabase db reset --refresh-schema
   ```

3. **Local Dev Database**

   ```bash
   supabase start  # local version
   ```

4. **Performance Test**

   ```sql
   SELECT COUNT(*) FROM topics WHERE difficulty = 3;
   -- Index kontrol: EXPLAIN ANALYZE
   ```

---

## 📞 Destek & Kaynaklar

- Supabase Docs: <https://supabase.com/docs>
- MEB Müfredatı: <https://odsgm.meb.gov.tr>
- Proje Repo: `.../QUICK_REFERENCE.md`

---

## ✅ Tamamlandı

Adım 1 bitti. Şimdi Adım 2'ye geç: **Admin Dashboard**

Next: `ADIM_2_ADMIN_DASHBOARD.md` 🚀
