# GitHub Actions — kırmızı öğeler: neden + çözüm

Actions sekmesinde **çok sayıda kırmızı** görmenizin yaygın nedenleri ve bu repoda uygulanan çözümler.

---

## 1. Aynı iş iki kez koşuyordu (CI + Frontend build)

| Sorun | `npm run build` hem **CI** hem **Frontend build** workflow’unda PR/push’ta tetikleniyordu → bir hata **iki kırmızı** run. |
| **Çözüm** | [`frontend-build.yml`](../.github/workflows/frontend-build.yml) yalnızca **`workflow_dispatch`** (manuel). Otomatik build tek kaynak: **[`ci.yml`](../.github/workflows/ci.yml)**. |

**Sizin yapmanız gereken:** Branch protection’da “**Frontend build**” zorunluysa → kuralı **“CI”** workflow’undaki **build** job’ına güncelleyin veya manuel `Frontend build (manual)` kullanın.

---

## 2. Smoke test (Playwright) prod’a izin istiyordu

| Sorun | `test:smoke:regression` prod URL + `ALLOW_PROD` olmadan **fail** → CI kırmızı. |
| **Çözüm** | [`smoke-regression-checklist.mjs`](../scripts/smoke-regression-checklist.mjs): `CI=true` iken varsayılan **atlanır**; zorunlu koşmak için `RUN_SMOKE_REGRESSION=1` + `BASE_URL` / `ALLOW_PROD`. [`ci.yml`](../.github/workflows/ci.yml) job’da `CI: "true"` açık. |

---

## 3. Neon PR workflow — NEON kullanılmıyorsa bile ağır job

| Sorun | **`setup`** her PR’da `npm ci` vb. çalıştırıyordu; Neon kullanılmayan repolarda gereksiz süre / hata riski. |
| **Çözüm** | `NEON_PROJECT_ID` **yoksa**: hafif **“Neon (devre dışı)”** job’ı yeşil, **`setup` / create / delete** atlanır. `NEON_PROJECT_ID` **varsa**: eski mantık. |

**Neon kullanıyorsanız:** Variables `NEON_PROJECT_ID` + Secrets `NEON_API_KEY`. Yanlış key → API adımları kırmızı kalır (beklenen).

---

## 4. `npm run build` kırılıyor

| Sorun | TypeScript / Vite / `check-no-webkit-css` hatası. |
| **Çözüm** | Log’da ilk kırmızı adımı okuyun; yerelde veya Codespaces’ta `npm run build` düzeltin. Lock uyumsuzluğu: `npm install` → `package-lock.json` commit. |

---

## 5. Vercel workflow

| Sorun | Secret yok → deploy atlanır; bazen **build** adımı yine de fail olabilir. |
| **Çözüm** | `VERCEL_*` secret’ları; aksi halde log’da “deploy skipped” normal. |

---

## 6. Supabase Edge deploy

| Sorun | Manuel workflow; secret eksik / `config.toml` hatası. |
| **Çözüm** | [CONTINUE_STUDY_TRACK.md](./CONTINUE_STUDY_TRACK.md), [SUPABASE_STUDY_TRACK.md](./SUPABASE_STUDY_TRACK.md). |

---

## 7. Eski / iptal run’lar

| Sorun | Push storm, concurrency, iptal edilen run’lar **kırmızı/turuncu** listeler. |
| **Çözüm** | En son commit’teki run’lara bakın; eski run’ları yok sayın. |

---

## 8. Fork PR — “Waiting for approval”

| Sorun | İlk kez katkı → workflow’lar onay bekler. |
| **Çözüm** | Repo **Settings → Actions** içinde run’ı onaylayın. |

---

## Hızlı kontrol listesi

1. Son push’taki **CI** workflow yeşil mi?
2. Branch protection eski **“Frontend build”** adını mı bekliyor? → **CI** ile güncelleyin.
3. Neon kullanmıyorsanız `NEON_PROJECT_ID` tanımlı mı? (Tanımlı değilse Neon job’ları atlanır — normal.)
4. Kırmızı log satırını açıp **ilk hata** mesajını okuyun.

---

## İlgili dosyalar

- [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md) — workflow özeti  
- [RESOLVE_PR_WORKFLOW_CONFLICTS.md](./RESOLVE_PR_WORKFLOW_CONFLICTS.md) — merge çakışması  
- [WINDOWS_NPM_TERMINAL.md](./WINDOWS_NPM_TERMINAL.md) — yerel `npm` SSL  
