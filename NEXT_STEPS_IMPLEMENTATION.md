# Sonraki Adımlar – Uygulama Planı

## Kontrol Özeti (Tamamlandı ✅)
- Öğrenci giriş, sekmeli ana sayfa, MEB iskelet, TYT AI + Firestore, Dashboard gösterimi doğrulandı.
- AYT / Konu Ağacı / Çalışma Planı akışı ve Firestore yapıları mevcut.
- Vercel path uyumu: `api/ai/generate-ayt-curriculum`, `generate-learning-tree`, `generate-study-plan` eklendi; client aynı path'leri kullanıyor.
- TYT kaydında subject `name` alanı eklendi (CurriculumTree `orderBy('name')` uyumu).

---

## 1. Gerçek OpenAI API → Kişiye Özel Plan ✅ (Yapıldı)
**Mevcut:** `api/ai-plan.js` demo `generateStudyPlan` (OpenAI yok).  
**Hedef:** `OPENAI_API_KEY` varken OpenAI ile kişiye özel haftalık plan.

**Yapılanlar:**
- ✅ `api/ai-plan.js`: `OPENAI_API_KEY` veya `AI_INTEGRATIONS_OPENAI_API_KEY` varken `generatePlanWithOpenAI` fonksiyonu eklendi.
- ✅ OpenAI Chat Completion: `studentProfile` + `curriculum` + `preferences` → haftalık plan JSON (`weeklyPlan`, `monthlySummary`, `recommendations`).
- ✅ Prompt: hedef sınav (TYT/AYT/YKS), günlük saat, zayıf dersler, müfredat özeti; çıktı 7 günlük plan.
- ✅ Fallback: OpenAI yoksa veya hata verirse demo `generateStudyPlan` kullanılıyor.
- ✅ Model: `AI_AYT_MODEL` / `AI_INTEGRATIONS_OPENAI_MODEL` veya `gpt-4o-mini`.
- ⏳ `AIPlanGenerator`: müfredatı Firestore `curriculum/tyt` veya `/api/tyt/subjects`'tan çekme (opsiyonel, sonraki aşama).

---

## 2. AYT ve YKS Sekmeleri ✅ (Yapıldı)
**Mevcut:** TYT Dashboard sekmeleri (Overview, Subjects, Trials, Tasks, Curriculum, AI Plan). Ana nav: Dashboard, Öğrenme Yolları, Kurslar, Defterim, Topluluk.

**Yapılanlar:**
- ✅ **MainNavbar:** TYT, AYT, YKS linkleri eklendi (`/tyt-dashboard`, `/ayt-dashboard`, `/yks-dashboard`).
- ✅ **`ayt-dashboard.tsx`:** AYT sayfası; Admin'e linkler (AYT Müfredat, Konu Ağacı / Çalışma Planı), Firestore yapısı özeti.
- ✅ **`yks-dashboard.tsx`:** YKS sayfası; TYT ve AYT'ye linkler, ilerleme takibi placeholder.
- ✅ **App.tsx:** `/ayt-dashboard`, `/yks-dashboard` rotaları; auth skip (exam rotaları).

---

## 3. Haftalık Plana Otomatik Dağıtım
**Mevcut:** AI plan haftalık yapı üretiyor; takvime yazılmıyor.

**Yapılacaklar:**
- Üretilen planı Firestore'a kaydet: örn. `study_plans/{userId}/weekly_plans/{planId}` veya mevcut `study_plans` yapısına uygun.
- TYT "Tasks" veya yeni "Haftalık Plan" sekmesinde bu planı göster; günlük görevleri `daily_tasks` veya mevcut task API'ye bağla.
- İsteğe bağlı: takvim UI'da haftalık bloklar halinde gösterim.

**Teknik Detaylar:**
- `api/ai-plan.js` zaten `weeklyPlan` (7 gün) üretiyor; her gün `subjects`, `topics`, `totalHours` içeriyor.
- Firestore yapısı: `study_plans/{userId}/plans/{planId}` mevcut; `weekly_plans` subcollection eklenebilir.
- TYT Dashboard Tasks sekmesi: `/api/tyt/tasks` endpoint'i var; günlük görevler `DailyStudyTask[]` formatında.
- Entegrasyon: AI plan üretildikten sonra `weeklyPlan` → `daily_tasks` dönüşümü + Firestore write.

---

## 4. İlerleme Takibi
**Mevcut:** `user_progress`, `studyStats` koleksiyonları ve `curriculumService.saveUserProgress` (şu an TODO).

**Yapılacaklar:**
- Konu/topic tamamlama işaretleme (UI + Firestore write).
- `saveUserProgress` implementasyonu: `user_progress` veya `studyStats` güncelle.
- Dashboard'da ilerleme özeti (grafik veya yüzde); mevcut `ProgressChart` ile entegre et.
- TYT deneme skorları zaten `tyt/trials` ile takip ediliyor; bunu ilerleme özetine dahil et.

**Teknik Detaylar:**
- Firestore: `user_progress/{userId}/subjects/{subjectId}/topics/{topicId}` veya `studyStats/{userId}/{date}`.
- UI: CurriculumTree'de checkbox'lar; topic tamamlandığında Firestore'a `completed: true`, `completedAt: timestamp`.
- ProgressChart: `client/src/components/ProgressChart.jsx` mevcut; `user_progress` verilerini okuyup grafik gösterebilir.
- API: `/api/progress` veya `/api/tyt/progress` endpoint'i eklenebilir.

---

## 5. Öğretmen Paneli
**Mevcut:** Admin paneli var; öğretmen rolü yok.

**Yapılacaklar:**
- Rol: `user.role === 'teacher'` (schema'da gerekirse `role` alanı).
- Öğretmen route: `/teacher` veya `/admin` altında role-based view.
- Öğretmen UI: atanmış sınıf/öğrenciler, basit ilerleme görünümü, müfredat görüntüleme. Öğrenci yönetimi sınırlı (sadece kendi sınıfı).
- Auth: login sonrası role'e göre yönlendirme (admin vs teacher vs student).

**Teknik Detaylar:**
- Schema: `shared/schema.ts` → `users` tablosuna `role: text('role')` (admin, teacher, student).
- Route: `client/src/pages/teacher-dashboard.tsx` (yeni), `App.tsx`'te `/teacher` route.
- API: `/api/teacher/students`, `/api/teacher/class-progress` endpoint'leri.
- Auth: `server/routes.ts` → `ensureTeacher` middleware (role check).

---

## Öncelik Sırası
1. ✅ **OpenAI kişiye özel plan** (ai-plan) – tamamlandı.
2. ✅ **AYT / YKS sekmeleri** – tamamlandı.
3. **Haftalık plana dağıtım** – planın takvimle ilişkilendirilmesi (sonraki adım).
4. **İlerleme takibi** – tamamlama + özet UI (sonraki adım).
5. **Öğretmen paneli** – rol ve ayrı sayfa (sonraki adım).

---

## Dosya Referansları

### Tamamlanan Özellikler
- **AYT/Vercel:** `api/ai/generate-ayt-curriculum.js`, `api/ai/generate-learning-tree.js`, `api/ai/generate-study-plan.js`, `api/lib/ayt-engine.js`, `api/prompts/ayt-prompts.js`
- **TYT müfredat:** `api/generate-curriculum.js`, `client/src/components/admin/AICurriculumGenerator.tsx` → Firestore `curriculum/tyt`
- **OpenAI Plan:** `api/ai-plan.js` (generatePlanWithOpenAI), `client/src/components/curriculum/ai-plan-generator.tsx`
- **AYT/YKS Dashboards:** `client/src/pages/ayt-dashboard.tsx`, `client/src/pages/yks-dashboard.tsx`, `client/src/components/layout/MainNavbar.tsx`
- **Firestore:** `curriculum_ayt`, `curriculum/tyt`, `study_plans`, `user_progress`, `studyStats`

### Sonraki Adımlar İçin
- **Haftalık dağıtım:** `client/src/pages/tyt-dashboard.tsx` (Tasks sekmesi), `api/tyt/tasks` endpoint, `client/src/services/curriculumService.ts`
- **İlerleme takibi:** `client/src/services/curriculumService.ts` (saveUserProgress), `client/src/components/ProgressChart.jsx`, `client/src/components/curriculum/curriculum-tree.tsx` (checkbox'lar)
- **Öğretmen paneli:** `client/src/pages/teacher-dashboard.tsx` (yeni), `server/routes.ts` (role check), `shared/schema.ts` (user.role)

---

## Notlar
- Tüm AI fonksiyonları JSON-only çıktı üretiyor; Firestore'a doğrudan yazılabilir.
- OpenAI ve DeepSeek (OpenRouter) destekleniyor; `callAIWithFallback` ile otomatik fallback.
- Vercel serverless ve Express server her ikisi de destekleniyor; path'ler uyumlu.
