# LearnConnect Kontrol Raporu

## 1. Öğrenci giriş sistemi ✅
- **Login:** `client/src/pages/login.tsx` – `/login`, `POST /api/login`
- **Register:** `client/src/pages/register.tsx` – `/register`, `POST /api/register`
- **AuthGuard:** `client/src/components/auth/AuthGuard.tsx` – korumalı rotalar
- **useAuth:** `client/src/hooks/use-auth.ts` – oturum yönetimi
- Public: `/login`, `/register`; diğerleri auth ile yönlendirme

## 2. Sekmeli ana sayfa ✅
- **Navbar sekmeleri:** `MainNavbar` – Dashboard, Öğrenme Yolları, Kurslar, Defterim, Topluluk
- **TYT Dashboard sekmeleri:** `tyt-dashboard.tsx` – Overview, Subjects, Trials, Tasks, **Curriculum**, **AI Plan** (Tabs)
- Ana sayfa: `/` → `/dashboard`; TYT: `/tyt-dashboard` (ve `/tyt/*`)

## 3. MEB müfredat iskeleti ✅
- **Seed:** `scripts/seed-firestore-curriculum.ts`, `scripts/firestore-seed.js` – MEB yapısı (mebCode, TYT/AYT)
- **Firestore:** `curriculum/tyt/subjects`, `curriculum/tyt/subjects/{id}/topics`, `.../topics/{id}/subtopics`
- **Schema:** `shared/schema.ts` – `mebCode`, `mebUnitCode`, `mebYear`
- **Prompts:** `api/prompts/curriculum-prompts.js` – MEB/ÖSYM referanslı

## 4. AI butonu ile TYT müfredatı üretme ✅
- **Admin panel:** `AICurriculumGenerator` – “⚡ Tam TYT Müfredatı Oluştur” → `handleGenerateFullTYT`
- **Servis:** `aiCurriculumService.generateCurriculumWithTemplate('tyt')` → `POST /api/generate-curriculum` (prompt, examType, useTemplate)
- **Backend:** `api/generate-curriculum.js` (Vercel) – OpenAI, CURRICULUM_PROMPTS, TYT tam müfredat
- **Not:** Express `POST /api/generate-curriculum` farklı (courseId, admin-only). Vercel deploy’da TYT akışı `api/generate-curriculum.js` ile çalışır.

## 5. Firestore’a kaydetme ✅
- **TYT (Admin):** `handleApply` → `curriculum/tyt/subjects` + `.../topics` + `.../subtopics`
- **AYT müfredat:** `curriculum_ayt` + `curriculum_ayt/{subjectId}/topics`
- **Konu ağacı:** `curriculum_ayt/{subjectId}/topics/{topicId}/learningTree`
- **Çalışma planı:** `study_plans/{userId}/plans/{topicId}` (AICurriculumGenerator)

## 6. Dashboard’da gösterme ✅
- **CurriculumTree:** `getCurriculumTree()` → Firestore `curriculum/tyt/subjects` + topics + subtopics
- **TYT Dashboard** “Curriculum” sekmesi: `CurriculumTree` ile müfredat ağacı
- **Dashboard (ana):** Notlar, study stats, learning paths (müfredat ağacı TYT sekmesinde)

---

## 7. AYT / Konu Ağacı / Çalışma Planı akışı ✅
- **Client:** `aiAytService` → `POST /api/ai/generate-ayt-curriculum`, `generate-learning-tree`, `generate-study-plan`
- **Server:** `server/api/ai.routes.ts` → `generateAYTCurriculum`, `generateLearningTree`, `generateStudyPlan` (ai-reasoning.engine)
- **Engine:** `ai-reasoning.engine.ts` – Claude (`callClaude`) + inline promptlar (kullanıcı revert sonrası)
- **Firestore:** Yukarıdaki yapılar; admin panel kaydetme mevcut.

**Vercel path uyumu (giderildi):**
- `api/ai/generate-ayt-curriculum.js`, `generate-learning-tree.js`, `generate-study-plan.js` eklendi.
- Client `/api/ai/generate-*` path’lerini kullanıyor; Vercel’de aynı path’lerle çalışır.
- `api/ai/study-plan.js` artık `totalHours` ve `level` (client) parametrelerini de kabul ediyor.

---

## 8. Model / config
- **AYT (Express):** Claude (ANTHROPIC_*). `AI_AYT_MODEL` / `AI_INTEGRATIONS_OPENAI_MODEL` ayt-curriculum-engine için kullanılmıyor (revert ile Claude kullanımına dönüldü).
- **TYT (Vercel):** `api/generate-curriculum.js` → OpenAI `gpt-4o-mini`, `OPENAI_API_KEY`.
- **OpenRouter/DeepSeek:** `ai-provider-service` fallback’te; AYT şu an Claude.

---

## 9. Yapılanlar / kalan adımlar
1. ✅ **API path uyumu:** `api/ai/generate-*` handler’ları eklendi.
2. ✅ **Curriculum `name`:** TYT save’de `name: subject.title` eklendi.
3. ✅ **OpenAI kişiye özel plan:** `api/ai-plan.js` – OpenAI ile haftalık plan; yoksa demo.
4. ✅ **AYT ve YKS sekmeleri:** Nav’da TYT / AYT / YKS; `/ayt-dashboard`, `/yks-dashboard` sayfaları.
5. **Haftalık plana otomatik dağıtım:** Planın takvime yazılması (sonraki aşama).
6. **İlerleme takibi:** `user_progress` / `studyStats` implementasyonu (sonraki aşama).
7. **Öğretmen paneli:** Rol + öğretmen UI (sonraki aşama).
