# GitHub Actions — durum raporu ve sorun giderme

Bu repodaki workflow’ların **sık kırmızı** olma nedenleri ve uygulanan düzeltmeler.

## Aktif workflow’lar

| Dosya | Tetikleyici | Amaç |
|--------|-------------|------|
| [`ci.yml`](../.github/workflows/ci.yml) | `push`/`PR` → `main`, `develop` | `npm ci \|\| npm install`, `npm run build`, `test:smoke:regression` |
| [`frontend-build.yml`](../.github/workflows/frontend-build.yml) | `main`, `develop`, `study-track-*` + PR `main` | Aynı mantıkta frontend build |
| [`vercel-deploy.yml`](../.github/workflows/vercel-deploy.yml) | `push` → `main`, manuel | Build artefact + isteğe bağlı Vercel deploy |
| [`neon-branch-pr-with-migrations.yml`](../.github/workflows/neon-branch-pr-with-migrations.yml) | PR | Neon preview branch ( **`NEON_PROJECT_ID` repo variable** yoksa **atlanır**) |
| [`supabase-edge-functions-deploy.yml`](../.github/workflows/supabase-edge-functions-deploy.yml) | Manuel | Supabase Edge deploy |

## Kaldırılan / birleştirilen (kırmızı kaynakları)

### 1. `ci.yml` (eski): Makefile + Go

- **Sorun:** `make build` → `go build ./...` — repoda **`.go` dosyası yok**, sürekli hata.
- **Çözüm:** Workflow Node **Vite build** + smoke test ile değiştirildi.

### 2. `build-and-test.yml` — silindi

- **Sorun:** Sadece `copilot/optimize-api-endpoints` branch’inde; **Node 14**, **checkout/setup-node v2** (deprecated), `npm test` script’i yok.
- **Çözüm:** Dosya kaldırıldı; aynı ihtiyaç `ci.yml` / `frontend-build.yml` ile karşılanıyor.

### 3. `neon-branch-pr-with-migrations-improved.yml` — silindi

- **Sorun:** `needs.setup.outputs.branch` ama **`setup` job yok**; Neon env adımlarında **`env` blokları eksik**; `npm run deploy` tanımsız — PR’larda zincirleme hata.
- **Çözüm:** Kopya/bozuk workflow silindi; Neon için tek dosya: `neon-branch-pr-with-migrations.yml`.

## Diğer düzeltmeler

- **`vercel-deploy.yml`:** `rg` (ripgrep) runner’da yoktu → **`grep`**; `npm ci` lock uyumsuzluğunda → **`npm ci \|\| npm install`**.
- **Neon PR workflow:** `vars.NEON_PROJECT_ID == ''` ise **`create_neon_branch` / `delete_neon_branch` çalışmaz** — Neon kullanmayan repolarda gereksiz kırmızı adım yok.
- **Genel:** `actions/checkout@v6`, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` (Node 20 deprecation uyarısı azaltma).

## Hâlâ sizin yapmanız gerekenler

| Durum | Ne yapın |
|--------|-----------|
| **Lockfile uyumsuz** | Yerelde veya Codespaces’ta `npm install`, `package-lock.json` commit |
| **Vercel workflow sarı/kırmızı** | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secret’ları yoksa deploy adımı bilinçli atlanır (log’a bakın) |
| **Neon kullanıyorsanız** | Repo **Variables:** `NEON_PROJECT_ID`; **Secrets:** `NEON_API_KEY` |
| **Supabase deploy** | [CONTINUE_STUDY_TRACK.md](./CONTINUE_STUDY_TRACK.md) |

## Eski doküman uyarısı

`docs/WORKFLOW_VALIDATION_TEST.md`, `COMPLETE_SOLUTION_SUMMARY.md` vb. içinde **silinmiş** workflow adı geçebilir; güncel liste yukarıdaki tablodur.
