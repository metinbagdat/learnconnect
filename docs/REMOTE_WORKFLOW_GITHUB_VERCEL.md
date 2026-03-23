# GitHub → Vercel (yerelde npm olmadan çalışma)

Yerelde `ERR_SSL_CIPHER_OPERATION_FAILED` vb. ile `npm install` çalışmıyorsa, **kaynak kod GitHub’da**, **kurulum ve build bulutta** kalabilir.

## 1. Tek doğruluk kaynağı: GitHub

- Tüm değişiklikler `main` (veya production branch) üzerinden gider.
- Commit / push: **GitHub web arayüzü**, **GitHub Desktop**, **VS Code Remote**, veya **Git** (sadece dosya göndermek için yerelde `npm` gerekmez).

## 2. Vercel otomatik deploy (önerilen ana yol)

1. [Vercel](https://vercel.com) → proje → **Settings** → **Git** → repo `metinbagdat/learnconnect` bağlı olsun.
2. **Production branch** = `main`.
3. Her `git push origin main` sonrası Vercel kendi ortamında şunları çalıştırır (senin PC’nde değil):

   - `npm ci` veya `npm install`
   - `npm run build`
   - Çıktıyı yayına alır

Yani **deploy için yerelde `npm install` şart değil**; Vercel’in build log’larını kontrol etmen yeterli.

**Ortam değişkenleri:** Vercel → Project → **Settings** → **Environment Variables** (`VITE_*`, `SESSION_SECRET`, vb.). Yerel `.env` production’ı tek başına belirlemez.

Detay: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

## 3. Remote geliştirme: GitHub Codespaces (npm’in çalıştığı Linux)

Repo kökünde [`.devcontainer/`](../.devcontainer/) tanımlı. GitHub’da:

1. Repoyu aç → yeşil **Code** → **Codespaces** → **Create codespace on main**.
2. Açılan VS Code web’de terminalde `npm install` genelde **Linux ortamında** sorunsuz çalışır (Windows SSL sorunundan bağımsız).
3. `npm run dev` → port 5173 forward.

Böylece geliştirme de “remote” kalır; tek gereken tarayıcı + GitHub hesabı (ücret: GitHub planına göre Codespaces kotası).

## 4. CI: GitHub Actions (isteğe bağlı)

Repoda [`.github/workflows/`](../.github/workflows/) altında workflow’lar var. Push/PR ile Ubuntu üzerinde `npm ci` / build çalışabilir; bu da **yerel npm’e ihtiyaç duymadan** “build kırıldı mı?” görmek için kullanılır.

Secret’lar (Vercel token vb.) GitHub → **Settings** → **Secrets and variables** → **Actions** üzerinden tanımlanır.

## 5. `package-lock.json` güncellemesi

Lock dosyası güncellenmeden `npm ci` bazen takılabilir. Seçenekler:

- **Bir kez** Codespaces veya başka bir makinede (npm çalışan) `npm install` → lock’u commit’le.
- veya takım arkadaşı / CI job’u lock’u günceller.

## 6. Kısa kontrol listesi

| Ne | Nerede |
|----|--------|
| Kod | GitHub `main` |
| `npm install` / `npm run build` | Vercel (deploy), isteğe bağlı Codespaces/Actions |
| Production env | Vercel Dashboard |
| Yerel `.env` | Sadece local dev için; zorunlu değil |

**Sonuç:** “Her şey GitHub, oradan Vercel” sistemi = **Git bağlantısı + Vercel Git entegrasyonu**. Yerelde SSL hatası olsa bile **push → Vercel build** akışı çalışır; geliştirmeyi tamamen uzakta yapmak için **Codespaces** kullanın.
