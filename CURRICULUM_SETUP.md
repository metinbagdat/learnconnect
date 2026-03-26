# 📚 AI Coach Müfredat Yönetimi - Kurulum Rehberi

> Son Güncelleme: 26 Mart 2026

Bu rehber, LearnConnect sistemine müfredat yönetimi altyapısını kurmanız için adım adım talimatlar içerir.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Database Kurulumu](#database-kurulumu)
3. [API Endpoint'lerinin Testi](#api-endpointlerinin-testi)
4. [Admin Dashboard Kurulumu](#admin-dashboard-kurulumu)
5. [Öğrenci Onboarding Entegrasyonu](#öğrenci-onboarding-entegrasyonu)
6. [AI Coach Entegrasyonu](#ai-coach-entegrasyonu)
7. [Örnek Veri Yükleme](#örnek-veri-yükleme)
8. [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## Genel Bakış

### Sistem Mimarisi

```text
┌─────────────────────────────────────────────────────────────┐
│                    LearnConnect Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐        ┌──────────────────┐            │
│  │  Admin Dashboard │        │ Student Selection│            │
│  │   (React)        │        │    Page (React)  │            │
│  └────────┬─────────┘        └──────────┬───────┘            │
│           │                            │                     │
│           └────────────────┬───────────┘                     │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Supabase API  │                        │
│                    │  (Node.js)     │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│    ┌───────────────────────┼───────────────────────┐         │
│    │                       │                       │         │
│    ▼                       ▼                       ▼         │
│  /subjects           /units              /topics            │
│  /curriculum-import  /user/curriculum    AI Coach           │
│                                                               │
│                    ┌──────────────────┐                      │
│                    │   PostgreSQL     │                      │
│                    │   (Supabase)     │                      │
│                    └──────────────────┘                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Tablo Yapısı (Hiyerarşi)

```text
subjects (Dersler)
├── id, name, slug, exam_type, grade_level
│
└── units (Üniteler) ─ subject_id referans
    ├── id, subject_id, name, description
    │
    └── topics (Konular) ─ unit_id referans
        ├── id, unit_id, name, difficulty, estimated_minutes
        ├── is_tyt, is_ayt
        │
        └── user_curriculum (Öğrenci Seçimi) ─ topic_id referans
            ├── user_id, topic_id, status
            └── completed_at
```

---

## Database Kurulumu

### Adım 1: Supabase Bağlantısı

1. **Environment Variables'ı ayarlayın** (`.env.local`):

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### Adım 2: Database Tabloları Oluştur

1. **Supabase SQL Editor'a gidin** (<https://app.supabase.com> -> SQL Editor)

2. **Migration'ları çalıştır:**

   ```bash
   # Proje dizininde terminal aç
   cd C:\Users\mb\Desktop\learnconnect\learnconnect

   # Migration dosyasını oku ve çalıştır
   cat .\migrations\0001_curriculum_tables.sql
   ```

3. **SQL Editor'a kopyala-yapıştır** ve **Run** butonuna tıkla

4. **Aynı işlemi 0002_seed_tyt_ayt_curriculum.sql için tekrar et**

### Adım 3: RLS Policies Test Et

```sql
-- RLS'nin aktif olduğunu kontrol et
SELECT * FROM information_schema.role_privilege_grants 
WHERE privilege_type = 'SELECT' 
AND table_name = 'topics';
```

---

## API Endpoint'lerinin Testi

### Adım 1: Server'ı Başlat

```bash
npm run dev
# veya Vercel environment'ında test et
```

### Adım 2: cURL ile Test Et

#### Tüm Dersleri Getir

```bash
curl -X GET http://localhost:3000/api/admin/subjects \
  -H "Content-Type: application/json"
```

#### Yeni Ders Ekle

```bash
curl -X POST http://localhost:3000/api/admin/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Matematik",
    "slug": "matematik",
    "description": "TYT Matematik Müfredatı",
    "exams": ["tyt", "ayt"]
  }'
```

#### Üniteler (Subject ID ile)

```bash
curl -X GET "http://localhost:3000/api/admin/units?subjectId=YOUR_SUBJECT_ID" \
  -H "Content-Type: application/json"
```

#### Konular (Unit ID ile)

```bash
curl -X GET "http://localhost:3000/api/admin/topics?unitId=YOUR_UNIT_ID" \
  -H "Content-Type: application/json"
```

### Adım 3: Postman ile Test Et

1. **Postman'i aç** (<https://www.postman.com>)
2. **Yeni Collection oluştur**: "LearnConnect Curriculum"
3. **Her endpoint için Request ekle**:

   - GET /api/admin/subjects
   - POST /api/admin/subjects
   - GET /api/admin/units?subjectId={{subject_id}}
   - POST /api/admin/units
   - Vb.

---

## Admin Dashboard Kurulumu

### Adım 1: Admin Dashboard Bileşenini Entegre Et

1. **App.jsx veya Route'a ekle:**

```jsx
import CurriculumManager from '@/components/admin/CurriculumManager';

// Route içinde
<Route path="/admin/curriculum" element={<CurriculumManager />} />
```

### Adım 2: Admin Koruma Ekle (Opsiyonel)

```jsx
function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Supabase'ten user role'ünü kontrol et
  }, []);

  if (!isAdmin) return <Navigate to="/login" />;
  return children;
}
```

### Adım 3: CSS İçe Akt

```jsx
import './CurriculumManager.css'; // Stil dosyası
```

---

## Öğrenci Onboarding Entegrasyonu

### Adım 1: CurriculumSelection Bileşenini Ekle

```jsx
// App.jsx veya route
import CurriculumSelection from '@/components/student/CurriculumSelection';

// Onboarding route'u
<Route 
  path="/onboarding/curriculum" 
  element={
    <CurriculumSelection 
      userId={user.id}
      onComplete={(data) => {
        console.log('Curriculum selected:', data);
        // Dashboard'a yönlendir
        navigate('/dashboard');
      }}
    />
  } 
/>
```

### Adım 2: İlk Giriş Kontrolü

```jsx
// In user profile or settings
useEffect(() => {
  const checkCurriculumSelection = async () => {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) {
      // Müfredat seçilmemiş, onboarding'e yönlendir
      navigate('/onboarding/curriculum');
    }
  };

  checkCurriculumSelection();
}, [userId]);
```

---

## AI Coach Entegrasyonu

### Adım 1: Müfredat Filter'ı Kullan

```jsx
// AI Coach bileşeninde
import { getUserCurriculum, getTopicsForWeeklyPlanning } from '@/lib/curriculum-filter';

export default function AICoach({ userId }) {
  const [weeklyPlan, setWeeklyPlan] = useState(null);

  useEffect(() => {
    const loadPlan = async () => {
      const plan = await getTopicsForWeeklyPlanning(userId, 1);
      setWeeklyPlan(plan);
    };
    loadPlan();
  }, [userId]);

  return (
    <div>
      <h2>Haftalık Çalışma Planı</h2>
      {weeklyPlan?.topics.map(topic => (
        <div key={topic.id}>
          <h3>{topic.name}</h3>
          <p>Zorluk: {topic.difficulty}/5 | Süre: {topic.estimatedMinutes} min</p>
        </div>
      ))}
    </div>
  );
}
```

### Adım 2: Günlük Öneriler

```jsx
import { getDailyRecommendations } from '@/lib/curriculum-filter';

const daily = await getDailyRecommendations(userId, 120); // 120 dakika
console.log(daily.suggestion); // AI tarafından oluşturulan tavsiye
```

---

## Örnek Veri Yükleme

### Seçenek 1: Migration ile (Önerilen)

```bash
# Terminal'de
psql $SUPABASE_CONNECTION_STRING < migrations/0002_seed_tyt_ayt_curriculum.sql
```

### Seçenek 2: Admin Dashboard üzerinden

1. **Admin paneline gir** -> <http://localhost:3000/admin/curriculum>
2. **"+ Ders Ekle"** butonuna tıkla
3. **İlişkili üniteler ve konuları ekle**

### Seçenek 3: JSON ile Toplu Import

```bash
# Kurulum dosyasına referans
curl -X POST http://localhost:3000/api/admin/curriculum-import \
  -H "Content-Type: application/json" \
  -d @curriculum-data.json
```

**curriculum-data.json formatı:**

```json
{
  "subjects": [
    {
      "name": "Matematik",
      "slug": "matematik",
      "exams": ["tyt", "ayt"],
      "units": [
        {
          "name": "Sayı Sistemleri",
          "topics": [
            {
              "name": "Doğal Sayılar",
              "difficulty": 1,
              "estimatedMinutes": 45,
              "isTyt": true,
              "isAyt": false
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Sık Sorulan Sorular

### S: Migration'ları nasıl çalıştırırım?

**C:**

1. Supabase SQL Editor'unu aç
2. Migration dosyasını kopyala-yapıştır
3. **Run** butonuna tıkla
4. Veya `npx supabase migration up` komutunu kullan (Supabase CLI kurulu ise)

### S: Rolle tabanlı (RLS) erişim nasıl ayarlanır?

**C:**

```sql
-- Kullanıcı role'ü ekle
ALTER TABLE auth.users ADD COLUMN role TEXT DEFAULT 'student';

-- Policy örneği
CREATE POLICY "Admins can do everything" ON subjects
  FOR ALL USING (auth.jwt_to_jsonb() ->> 'role' = 'admin');
```

### S: Müfredat müdürleriyle (Teachers) nasıl çalışırım?

**C:**

- `teacher_permissions` tablosunu kullan
- Öğretmen paneli admin panelinin kısıtlı versiyonudur
- Öğretmen sadece atandığı dersleri görebilir/düzenleyebilir

```js
// API'de teacher kontrolü
const { canEdit } = await fetchTeacherPermissions(userId, subjectId);
if (!canEdit) return 403; // Forbidden
```

### S: Öğrenci müfredat seçimi zorunlu mu?

**C:**

- Evet, AI Coach'un anlamlı plan yapabilmesi için gerekli
- Özetkle "Tümünü Seç" seçeneği vardır
- Daha sonra profil ayarlarından değiştirilebilir

### S: 400+ konuyu nasıl örgütlerim?

**C:**

- **Subjects**: Temel dersler (Matematik, Türkçe, Fizik, vb.)
- **Units**: Konu başlıkları (Üniteler)
- **Topics**: Atomic learning units (En küçük öğrenme birimi)
- Örnek:

  - Matematik → Türev → Türevin Tanımı (atomic)

### S: AI Coach günlük plan nasıl yapacak?

**C:**

```js
const recommendations = await getDailyRecommendations(userId, 120);
// Çıktı: 120 dakikada öğrenilecek optimize edilmiş konular listesi
// AI bunu başka veriler (ilerleme, zorluk, prestasi) ile birleştirip daha iyi plan yapabilir
```

---

## Ek Kaynaklar

### MEB Müfredat Kaynakları

| Kaynak | URL |
| --- | --- |
| ÖDSGM | <https://odsgm.meb.gov.tr> |
| TYT Soru Örnekleri | [ÖDSGM - Ölçme Araçları](https://odsgm.meb.gov.tr) |
| Müfredat PDF'leri | [ÖDSGM - Müfredat](https://odsgm.meb.gov.tr) |
| İstatistik | [ÖDSGM - Araştırma Raporları](https://odsgm.meb.gov.tr) |

### Teknik Referanslar

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [React Hooks](https://react.dev/reference/react/hooks)

---

## Sonraki Adımlar

1. ✅ **Database kurulumu** (Bu rehber)
2. ⬜ **400+ konuyu MEB kaynakları ile topla**
3. ⬜ **Admin dashboard UX iyileştir**
4. ⬜ **Öğretmen yönetim paneli**
5. ⬜ **İlerleme takibi ve analytics**
6. ⬜ **AI Coach'la derin entegrasyon** (LLM ile plan optimizasyonu)

---

**Sorularınız mı var?**

- Teknik destek: <mailto:tech@learnconnect.app>
- MEB müfredat sorgular: <mailto:curriculum@learnconnect.app>

**Son güncelleme:** 26 Mart 2026
