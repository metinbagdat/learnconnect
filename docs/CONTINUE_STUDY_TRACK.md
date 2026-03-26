# Çalışma takip — kalan adımlar (checklist)

Yerelde `npm` / SSL sorunu varsa bu listeyi **GitHub Codespaces** veya başka bir ortamda tamamlayın.

Terminalde `npm error ...` satırlarını **komut sanmayın**; `pm` yerine **`npm`** yazın — bkz. [WINDOWS_NPM_TERMINAL.md](./WINDOWS_NPM_TERMINAL.md).

## 1. `package-lock.json` senkronu (önerilen)

Kök dizinde:

```bash
npm install
npm run build
```

Başarılıysa `package-lock.json` değişikliklerini commit + push edin. Sonrasında [vercel.json](../vercel.json) içinde `installCommand` tekrar `npm ci` yapılabilir (daha deterministik build).

## 2. Branch’i `main` ile birleştirme

Çalışma takip değişiklikleri `study-track-75f08` (veya ilgili branch) üzerindeyse:

1. GitHub’da **Pull Request** açın: `study-track-75f08` → `main`
2. CI yeşil olduktan sonra **Merge**
3. Vercel production branch **`main`** ise otomatik deploy tetiklenir

## 3. Supabase

- [SUPABASE_STUDY_TRACK.md](./SUPABASE_STUDY_TRACK.md): migration, `DEEPSEEK_API_KEY`, `supabase functions deploy`
- Vercel’e `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekleyin (çalışma takip frontend için)

## 4. Uzak iş akışı (npm olmadan deploy)

[REMOTE_WORKFLOW_GITHUB_VERCEL.md](./REMOTE_WORKFLOW_GITHUB_VERCEL.md)

## 5. Silinen `docs/ENV_AND_GITHUB.md`

İçerik [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) ve [REMOTE_WORKFLOW_GITHUB_VERCEL.md](./REMOTE_WORKFLOW_GITHUB_VERCEL.md) ile değiştirildi; eski dosya gerekmez.

## 6. `generate-daily-tasks` ve yerel “bugün”

Panel açılışında `functions.invoke("generate-daily-tasks", { body: { dayStartIso, dayEndIso } })` gönderilir (`getLocalDayBoundsIso()`). Edge Function bu aralıkta zaten 3 görev varsa tekrar üretmez. Kod değiştiyse yeniden deploy edin (aşağıdaki bölüm 7).

## 7. Edge Function deploy (yerelde SSL / `npx` çalışmıyorsa)

Bu makinede `npx supabase …` **SSL hatası** veriyorsa deploy’u **başka ortamda** yapın.

### A) GitHub Actions (önerilen — npm gerekmez)

1. Repo **Settings → Secrets and variables → Actions** içinde:
   - **`SUPABASE_ACCESS_TOKEN`**: [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) ile oluşturun.
   - **`SUPABASE_PROJECT_REF`**: Dashboard → **Project Settings → General → Reference ID**. Bu LearnConnect projesi için: **`sgmeogazkwzvspyptcvc`**.

2. GitHub’da **Actions** → **Supabase Edge Functions deploy** → **Run workflow** → `which`: `generate-daily-tasks` veya `all`.

Workflow dosyası: [`.github/workflows/supabase-edge-functions-deploy.yml`](../.github/workflows/supabase-edge-functions-deploy.yml).

### B) Yerel / Codespaces / WSL (CLI çalışıyorsa)

**`bash: supabase: command not found`** görüyorsanız CLI yoktur. Önce proje kökünde bağımlılıkları kurun (Supabase CLI `devDependency` olarak gelir):

```bash
cd /path/to/learnconnect
npm install
```

Sonra **`supabase` yerine** `npx` veya `npm run` kullanın. **Reference ID** (bu proje): `sgmeogazkwzvspyptcvc`.

```bash
npx supabase functions deploy generate-daily-tasks --project-ref sgmeogazkwzvspyptcvc
# veya:
npm run supabase -- functions deploy generate-daily-tasks --project-ref sgmeogazkwzvspyptcvc
```

Kısayol script’leri (`--project-ref` hâlâ gerekir):

```bash
npm run supabase -- functions deploy generate-daily-tasks --project-ref sgmeogazkwzvspyptcvc
```

Önce (bir kez): `npx supabase login`, `npx supabase link --project-ref sgmeogazkwzvspyptcvc`, Edge secret: `DEEPSEEK_API_KEY`. **Link** sonrası çoğu zaman ek `project-ref` gerekmez:

```bash
npx supabase functions deploy generate-daily-tasks
npx supabase functions deploy generate-report
# veya: npm run supabase:deploy:functions
```

Ayrıntılar: [SUPABASE_STUDY_TRACK.md](./SUPABASE_STUDY_TRACK.md).

### C) Windows: `npm install` → `ERR_SSL_CIPHER_OPERATION_FAILED`

Bu hata **Node/npm’in registry’ye TLS ile bağlanırken** kırıldığını gösterir (antivirüs, VPN, kurumsal proxy, bozuk OpenSSL/Node kurulumu vb.). **`npm install` olmadan** ilerleyebilirsiniz.

| Yol | Ne yaparsınız |
|-----|----------------|
| **1 — GitHub Actions** | Bölüm **7A**: repo secret’ları + **Run workflow** → `npm` / SSL gerekmez. |
| **2 — Supabase CLI (tek ZIP, npm yok)** | [github.com/supabase/cli/releases](https://github.com/supabase/cli/releases) → **Assets** → `supabase_windows_amd64.zip` indirin → bir klasöre çıkarın (örn. `C:\tools\supabase\`) → o klasörü **PATH**’e ekleyin → **yeni** terminal: `supabase login`, sonra `supabase functions deploy generate-daily-tasks --project-ref sgmeogazkwzvspyptcvc` |
| **3 — WSL2 / Codespaces** | Ubuntu içinde `npm install` genelde sorunsuz; aynı repo ile deploy. |

**İsteğe bağlı (sorunu kökten çözmek):** VPN kapatıp deneyin; antivirüste “HTTPS / SSL tarama”yı geçici kapatın; [Node.js 20 LTS](https://nodejs.org/) yeniden kurun; `npm cache clean --force`. Son çare olarak bazı ortamlarda `npm config set strict-ssl false` kullanılır — **güvenlik riski** vardır; mümkünse kullanmayın, denedikten sonra `npm config set strict-ssl true` yapın.

Lockfile / Vercel `npm ci` için bkz. **bölüm 1** (genelde **Codespaces** veya SSL düzelince).
