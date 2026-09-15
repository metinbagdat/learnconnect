# Vercel Redeploy – main Branch

## Neden main?

Rollup fix’ler ve `vercel.json` (temiz kurulum + build) **main** branch’inde.  
Preview deploy’lar `preview/pr-8-main` ile yapılıyordu; **main**’den deploy almak önemli.

---

## Redeploy adımları (Dashboard)

1. **Vercel Dashboard** → https://vercel.com/dashboard  
2. **learnconnect** projesini aç (egitim.today).  
3. **Deployments** sekmesine git.  
4. **main** branch’inden yapılmış bir deployment bul (commit `0d09024` veya sonrası).  
   - Listede **Branch: main** yazan satıra tıkla.  
5. Sağ üstte **Redeploy** butonuna bas.  
6. Açılan pencerede:
   - **Branch:** `main` seçili olsun (bazen dropdown’da görünür).  
   - **Clear Build Cache** / **Rebuild without cache** varsa işaretle.  
   - (Bazı arayüzlerde bu seçenek **"Redeploy"** yanındaki **⋮** → **Redeploy** ile açılan ikinci ekranda olabilir.)  
7. **Redeploy** ile onayla.

**Not:** Arayüz sürümüne göre “Branch” veya “Clear cache” her zaman aynı yerde olmayabilir.  
- **Branch:** Redeploy, seçtiğin deployment’ın branch’ini kullanır; **main**’den bir deployment seçip Redeploy yap.  
- **Clear cache:** **Settings → Environment Variables** içinde `VERCEL_FORCE_NO_BUILD_CACHE` = `1` ekleyerek de cache’i devre dışı bırakabilirsin.

---

## Ortam değişkeni (isteğe bağlı)

Build cache’i kapatmak için:

- **Settings** → **Environment Variables**  
- **Add:** `VERCEL_FORCE_NO_BUILD_CACHE` = `1`  
- **Environments:** Production (ve gerekirse Preview).  
- **Save** → Sonra **Redeploy** (main).

---

## 12 Serverless Functions limiti (Hobby)

Hata: *"No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan."*

**Yapılan:** `.vercelignore` eklendi; aşağıdakiler deploy’a **dahil edilmiyor**:

- `api/errors/`
- `api/send-email.js`
- `api/ai/ayt-curriculum.js`
- `api/ai/learning-tree.js`

Bunlar kullanılmıyor veya `generate-*` ile karşılanıyor. Kalan API sayısı 12’nin altında.

---

## Build’de göreceğinler

- Install: `Skipping install; clean install runs in buildCommand.`  
- Build: `sh -c 'rm -rf node_modules ... && npm run build'`  
- Vite build tamamlanır, **Deploying outputs** sonrası **12 functions** hatası olmamalı.

---

## Özet

1. **main**’den bir deployment seç → **Redeploy**.  
2. Mümkünse **Clear Build Cache** kullan veya `VERCEL_FORCE_NO_BUILD_CACHE=1` ekle.  
3. `.vercelignore` ile 12 function limitine uyuldu.
