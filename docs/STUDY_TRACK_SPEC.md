# Çalışma takip — spec ↔ uygulama eşlemesi

Stack: **React (Vite)**, **Supabase** (auth, DB, storage), **TailwindCSS**.

## 1. SQL: tablolar, view, RLS

| Spec | Uygulama |
|------|----------|
| `students` (id, goal_net, daily_minutes, created_at) | [`supabase/migrations/20250320120000_study_track.sql`](../supabase/migrations/20250320120000_study_track.sql) — ek: **`current_net`** (hedef/şu an net takibi için) |
| `study_logs` (id, student_id, topic_id, duration, created_at) | Aynı migration — ek: **`net`** (nullable, grafik için günlük net) |
| `tasks` | Aynı migration |
| `student_metrics` view (student_id, total_sessions, total_minutes) | `student_metrics` — `study_logs` üzerinden aggregate; `security_invoker = true` |
| RLS | `students`, `study_logs`, `tasks` için select/insert/update/delete (kendi satırları); ek: `analytics_events` |

## 2. Edge Function `generate-daily-tasks`

| Spec | Uygulama |
|------|----------|
| DeepSeek + `DEEPSEEK_API_KEY` | [`supabase/functions/generate-daily-tasks/index.ts`](../supabase/functions/generate-daily-tasks/index.ts) |
| Prompt: hedef net X, şu an Y, son çalışma, 3 görev | Metin: hedef / şu an / günlük dk + **son çalışma özeti** + **son görevler** + “Bugün için tam 3 görev…” |
| JSON cevap → `tasks` insert | `response_format: json_object`, `extractJsonObject` ile parse |
| Deploy | `supabase functions deploy …` veya [GitHub Actions](../.github/workflows/supabase-edge-functions-deploy.yml) |

## 3. React bileşenleri

| Bileşen | Dosya | Not |
|---------|--------|-----|
| Dashboard | [`client/src/components/study-track/Dashboard.tsx`](../client/src/components/study-track/Dashboard.tsx) | Supabase + `studyTrackApi` |
| Header | [`Header.tsx`](../client/src/components/study-track/Header.tsx) | Streak + ayarlar |
| TodayPlanCard | [`TodayPlanCard.tsx`](../client/src/components/study-track/TodayPlanCard.tsx) | Checkbox + **TAMAMLADIM** |
| ProgressBar | [`ProgressBar.tsx`](../client/src/components/study-track/ProgressBar.tsx) | Bugünkü görev tamamlanma % |
| WarningCard | [`WarningCard.tsx`](../client/src/components/study-track/WarningCard.tsx) | Konu başına **≥3 gün** çalışılmadıysa uyarı |
| NetChart | [`NetChart.tsx`](../client/src/components/study-track/NetChart.tsx) | Son **7 gün** net toplamı (`study_logs.net`) |
| TargetCard | [`TargetCard.tsx`](../client/src/components/study-track/TargetCard.tsx) | Hedef − şu an farkı |

Rota: [`StudyTrackApp` / `App.tsx`](../client/src/App.tsx) — `/calisma-takip`.

## 4. Growth: PDF rapor + Storage + popup

| Spec | Uygulama |
|------|----------|
| Edge Function çağrısı | `functions.invoke('generate-report')` — [`Dashboard.tsx`](../client/src/components/study-track/Dashboard.tsx) |
| PDF üretimi | [`supabase/functions/generate-report/index.ts`](../supabase/functions/generate-report/index.ts) — **`pdf-lib`** (Deno Edge uyumlu) |
| `@react-pdf/renderer` | **Edge (Deno) ortamında React PDF kullanımı pratik değil**; eşdeğer çıktı için `pdf-lib` tercih edildi. İstemci tarafında React PDF isterseniz ayrı bir build pipeline gerekir. |
| Storage + URL | Bucket `reports`, yükleme + **signed URL** (7 gün) — `url` JSON’da |
| Paylaşılabilir UI | [`ReportShareModal.tsx`](../client/src/components/study-track/ReportShareModal.tsx) — kopyala, aç, (destekleniyorsa sistem paylaşımı) |

---

**Özet:** Spec’teki çekirdek özellikler bu repoda mevcut; şema grafik için `net` / `current_net` ile genişletilmiştir. Operasyon: [SUPABASE_STUDY_TRACK.md](./SUPABASE_STUDY_TRACK.md), [CONTINUE_STUDY_TRACK.md](./CONTINUE_STUDY_TRACK.md).
