# Çalışma takip modülü (Supabase)

Bu modül **LearnConnect** içinde `/calisma-takip` altında çalışır; **Supabase Auth** kullanır (ana uygulamanın Firebase oturumundan bağımsızdır).

Yerelde `npm` çalışmıyorsa: kod **GitHub**’a push edilir, **Vercel** build alır — bkz. [REMOTE_WORKFLOW_GITHUB_VERCEL.md](./REMOTE_WORKFLOW_GITHUB_VERCEL.md). Kalan adımlar: [CONTINUE_STUDY_TRACK.md](./CONTINUE_STUDY_TRACK.md).

## Gereksinimler

- [Supabase](https://supabase.com) projesi
- Supabase CLI — aşağıdaki **CLI ile tekrarlanabilir kurulum** bölümüne bakın

## Supabase CLI — tekrarlanabilir kurulum (önerilen)

Aynı veritabanı ve Edge Function’ları her ortamda (siz, ekip, CI) yeniden üretmek için migration + CLI kullanın.

### 0) CLI’yı projeye ekleyin (global gerekmez)

```bash
npm install
```

Bu repoda Supabase CLI `devDependency` olarak tanımlıdır (`supabase`). Komutlar `npx supabase` veya aşağıdaki `npm run` script’leri ile çalışır.

### 1) Oturum açın (bir kez / makine başına)

```bash
npm run supabase:login
# veya: npx supabase login
```

### 2) Projeyi uzaktaki Supabase projesine bağlayın (bir kez / repo klonundan sonra)

**Reference ID:** Dashboard → **Project Settings** → **General** → **Reference ID** (ör. `sgmeogazkwzvspyptcvc`).

```bash
npm run supabase:link -- --project-ref YOUR_PROJECT_REF
# veya: npx supabase link --project-ref YOUR_PROJECT_REF
```

Bu adım, CLI’nın `db push` ve `functions deploy` için hangi projeyi kullanacağını kaydeder.

### 3) Veritabanı migration’larını uygulayın

```bash
npm run supabase:db:push
# veya: npx supabase db push
```

Kaynak: [supabase/migrations/20250320120000_study_track.sql](../supabase/migrations/20250320120000_study_track.sql)

> Dashboard SQL Editor ile dosyayı elle çalıştırdıysanız ve şema zaten uyumluysa `db push` genelde “no changes” der; yine de ekip için CLI tercih edilir.

### 4) Edge Function secret: DeepSeek

Dashboard → **Project Settings** → **Edge Functions** → **Secrets** → `DEEPSEEK_API_KEY`

veya CLI:

```bash
npx supabase secrets set DEEPSEEK_API_KEY=sk-xxxxxxxx
npm run supabase:secrets:list
```

### 5) Edge Function deploy (çalışma takip)

```bash
npm run supabase:deploy:functions
```

Tek komutta (migration + iki fonksiyon — bağlı proje ve yetkiler hazırsa):

```bash
npm run supabase:deploy:all
```

### npm script özeti

| Script | Açıklama |
|--------|----------|
| `npm run supabase:login` | `supabase login` |
| `npm run supabase:link -- --project-ref <ref>` | Projeyi bağla |
| `npm run supabase:db:push` | Migration’ları uygula |
| `npm run supabase:secrets:list` | Secret isimlerini listele |
| `npm run supabase:deploy:functions` | `generate-daily-tasks` + `generate-report` |
| `npm run supabase:deploy:all` | `db push` + her iki fonksiyon |

### Yerelde fonksiyon denemek (isteğe bağlı)

```bash
npx supabase functions serve generate-daily-tasks --env-file supabase/.env.local
```

`supabase/.env.local` içinde `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY` tanımlayın (bu dosyayı **commit etmeyin**).

---

## 1. Ortam değişkenleri (Vite)

Kök `.env` veya `client` için yüklü Vite ortamında:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Örnekler için kök [`.env.example`](../.env.example) dosyasına bakın.

## 2. Veritabanı migration

**Önerilen:** Yukarıdaki **Supabase CLI — tekrarlanabilir kurulum** bölümünde `npm run supabase:db:push`.

Alternatif (tek seferlik): Dashboard → **SQL Editor** → [20250320120000_study_track.sql](../supabase/migrations/20250320120000_study_track.sql) içeriğini yapıştırıp çalıştırın.

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
npm install
npm run supabase:link -- --project-ref YOUR_PROJECT_REF
npm run supabase:deploy:functions
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
