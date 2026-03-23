# Çalışma takip modülü (Supabase)

Bu modül **LearnConnect** içinde `/calisma-takip` altında çalışır; **Supabase Auth** kullanır (ana uygulamanın Firebase oturumundan bağımsızdır).

## Gereksinimler

- [Supabase](https://supabase.com) projesi
- Supabase CLI (opsiyonel, yerel geliştirme ve deploy için): `npm i -g supabase`

## 1. Ortam değişkenleri (Vite)

Kök `.env` veya `client` için yüklü Vite ortamında:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Örnekler için kök [`.env.example`](../.env.example) dosyasına bakın. `.env`’i GitHub’a göndermemek için: [ENV_AND_GITHUB.md](./ENV_AND_GITHUB.md).

## 2. Veritabanı migration

1. Supabase Dashboard → **SQL Editor**
2. [supabase/migrations/20250320120000_study_track.sql](../supabase/migrations/20250320120000_study_track.sql) dosyasının içeriğini yapıştırıp çalıştırın.

Veya CLI ile (proje bağlıysa):

```bash
supabase db push
```

Bu script:

- `students`, `study_logs`, `tasks`, `analytics_events` tablolarını
- `student_metrics` görünümünü
- RLS politikalarını
- `auth.users` üzerinde yeni kullanıcıya `students` satırı ekleyen tetikleyiciyi
- `reports` Storage bucket’ı ve politikalarını oluşturur.

## 3. Edge Functions

### Secrets (Supabase Dashboard → Project Settings → Edge Functions → Secrets)

| Secret | Açıklama |
|--------|----------|
| `DEEPSEEK_API_KEY` | [DeepSeek](https://platform.deepseek.com/) API anahtarı (`generate-daily-tasks` için) |
| `SUPABASE_URL` | Genelde otomatik |
| `SUPABASE_ANON_KEY` | Genelde otomatik |

> Not: Edge runtime ortamında `SUPABASE_SERVICE_ROLE_KEY` gerekmez; kullanıcı JWT’si ile RLS uygulanır.

### Deploy

```bash
cd /path/to/learnconnect
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-daily-tasks
supabase functions deploy generate-report
```

### Fonksiyonlar

- **`generate-daily-tasks`**: Kullanıcı JWT ile çağrılır; bugün için zaten 3 görev yoksa DeepSeek ile 3 görev üretip `tasks` tablosuna yazar.
- **`generate-report`**: Son 7 günün verileriyle `pdf-lib` PDF üretir, `reports` bucket’ına yükler, **signed URL** döner.

## 4. Frontend kullanımı

```ts
import { getSupabase } from "@/lib/supabaseClient";

const sb = getSupabase();

// Oturum
await sb.auth.signInWithPassword({ email, password });
await sb.auth.signUp({ email, password });
await sb.auth.signOut();

// Veri
const { data } = await sb.from("tasks").select("*").eq("student_id", user.id);

// Edge Function (JWT otomatik eklenir)
await sb.functions.invoke("generate-daily-tasks", { body: {} });
await sb.functions.invoke("generate-report", { body: {} });
```

## 5. Rotalar

| URL | Açıklama |
|-----|----------|
| `/calisma-takip` | Landing |
| `/calisma-takip/giris` | Giriş |
| `/calisma-takip/kayit` | Kayıt |
| `/calisma-takip/panel` | Dashboard |
| `/calisma-takip/ayarlar` | Ayarlar (hedef net vb.) |

## 6. Sorun giderme

- **“Supabase yapılandırması eksik”**: `VITE_*` değişkenlerini ekleyip dev sunucusunu yeniden başlatın.
- **Edge 401**: Kullanıcı giriş yapmış olmalı; `Authorization: Bearer <access_token>` gönderildiğinden emin olun (`supabase-js` bunu otomatik yapar).
- **Storage yükleme hatası**: `reports` bucket’ının ve migration’daki storage politikalarının uygulandığını doğrulayın.
- **Mevcut kullanıcıda `students` yok**: İlk panel yüklemesinde kod otomatik `insert` dener; tetikleyici yalnızca yeni kayıtlarda çalışır.
