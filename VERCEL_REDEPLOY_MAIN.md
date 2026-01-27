# Vercel Redeploy – main Branch

## Neden main?

Rollup fix’ler ve `vercel.json` (temiz kurulum + build) **main** branch’inde.  
Preview deploy’lar `preview/pr-8-main` @ `f25554b` ile yapılıyordu; bu commit’lerde bu düzenlemeler yok.

## Redeploy adımları (Dashboard)

1. **Vercel Dashboard** → https://vercel.com/dashboard  
2. **learnconnect** projesini aç (egitim.today’i deploy eden proje).  
3. **Deployments** sekmesine git.  
4. En üstteki deployment’ta **⋮** (üç nokta) → **Redeploy**.  
5. Açılan pencerede:
   - **Branch:** `main` seç (preview/pr-8-main değil).  
   - **Clear Build Cache** işaretli olsun.  
6. **Redeploy** butonuna bas.

## Ortam değişkeni (isteğe bağlı)

Build cache’i kapatmak için:

- **Settings** → **Environment Variables**  
- **Add:** `VERCEL_FORCE_NO_BUILD_CACHE` = `1`  
- **Environments:** Production (ve gerekirse Preview).  
- **Save** → Sonra tekrar **Redeploy** (main, cache temiz).

## Build’de göreceğinler

- Install: `Skipping install; clean install runs in buildCommand.`  
- Build: `sh -c 'rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && npm run build'`  
- `@rollup/rollup-linux-x64-gnu` temiz kurulumda yüklenecek, Rollup hatası olmamalı.

## Özet

**Redeploy’u mutlaka `main` branch’i ile yap; mümkünse “Clear Build Cache” kullan.**
