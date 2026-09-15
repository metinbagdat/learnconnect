# eğitim.today Sorunsuz Çalışması İçin Adımlar

## ✅ Tamamlanan Düzeltmeler

1. **TypeScript Derleme Hataları Düzeltildi**
   - `shared/schema.ts`: Zod şema uyumsuzlukları çözüldü
   - `server/notifications-service.ts`: Schema'da olmayan `data` alanı kaldırıldı
   - `server/storage.ts`: Tüm insert/update işlemleri schema'ya uygun hale getirildi
   - `server/storage-marketing.ts`: Drizzle `where` clause'ları düzeltildi (`eq()` kullanımı)
   - `server/study-plan-service.ts`: Schema'da olmayan alanlar kaldırıldı
   - `server/unified-learning-service.ts`: Schema uyumsuzlukları düzeltildi
   - `server/orchestration-engine.ts`: Assignment insert hataları düzeltildi
   - `vite.config.ts`: Geçersiz build seçenekleri kaldırıldı

## 🚀 Deployment Adımları

### 1. Son Build Kontrolü

```powershell
# TypeScript hatalarını kontrol et (sadece server)
npx tsc --noEmit --project tsconfig.server.json

# Full build test
npm run build
```

**Beklenen Sonuç:**
- ✅ Client build başarılı (Vite)
- ✅ Server build başarılı (TypeScript)
- ⚠️ Client-side TypeScript hataları var ama build geçiyor (lazy loading sayesinde)

### 2. Vercel Environment Variables Kontrolü

**KRİTİK:** Production environment'da şu değişkenlerin ayarlı olduğundan emin ol:

```powershell
# Vercel CLI ile kontrol
vercel env ls

# Veya Vercel Dashboard'dan kontrol:
# https://vercel.com/[your-team]/learn-connect/settings/environment-variables
```

**Gerekli Environment Variables (Production):**

```
✅ DATABASE_URL          - Neon PostgreSQL connection string
✅ SESSION_SECRET        - Secure random string (32+ karakter)
✅ ANTHROPIC_API_KEY     - Anthropic API anahtarı
✅ ANTHROPIC_MODEL       - claude-3-5-sonnet-20241022 (veya başka)
✅ OPENAI_API_KEY        - (Opsiyonel, fallback için)
✅ STRIPE_SECRET_KEY     - (Opsiyonel, ödeme için)
✅ STRIPE_WEBHOOK_SECRET - (Opsiyonel, webhook doğrulama için)
```

**⚠️ ÖNEMLİ:** `ANTHROPIC_API_KEY` sadece Preview'da değil, **Production**'da da ayarlı olmalı!

### 3. Vercel Deployment

```powershell
# Production'a deploy
vercel --prod

# Veya force deploy (cache'i bypass et)
vercel --prod --force
```

### 4. Domain Kontrolü

**eğitim.today** domain'inin doğru yapılandırıldığını kontrol et:

1. **Vercel Dashboard'da:**
   - Project Settings → Domains
   - `eğitim.today` ekli mi?
   - SSL sertifikası aktif mi?

2. **DNS Kayıtları:**
   - Domain provider'ında (Namecheap, GoDaddy, vs.)
   - CNAME kaydı: `@` → `cname.vercel-dns.com`
   - Veya A kayıtları: Vercel IP'lerine yönlendirilmeli

3. **Punycode Kontrolü:**
   - `xn--etim-kia.today` (Punycode versiyonu) da çalışmalı
   - Vercel otomatik olarak IDN domain'leri handle eder

### 5. Post-Deployment Test

```powershell
# Health check
Invoke-WebRequest -Uri "https://eğitim.today/api/health" -Method GET

# Root endpoint
Invoke-WebRequest -Uri "https://eğitim.today/" -Method GET

# AI endpoint (401 beklenir, auth olmadan)
Invoke-WebRequest -Uri "https://eğitim.today/api/ai/adaptive-plan" -Method POST -Body '{"test":"ping"}' -ContentType "application/json"
```

**Beklenen Sonuçlar:**
- ✅ `/api/health` → 200 OK
- ✅ `/` → 200 OK (HTML sayfası)
- ✅ `/api/ai/...` → 401 Unauthorized (normal, auth gerekli)

### 6. Browser Console Kontrolü

1. **https://eğitim.today** adresini aç
2. **F12** → Console sekmesi
3. **Kontrol et:**
   - ❌ "Cannot access 'A' before initialization" hatası OLMAMALI
   - ⚠️ SES/lockdown uyarıları olabilir (browser extension'dan, zararsız)
   - ✅ Sayfa düzgün yüklenmeli
   - ✅ React uygulaması render olmalı

### 7. Vercel Runtime Logs Kontrolü

**Vercel Dashboard'da:**
- Deployments → Latest Deployment → Runtime Logs
- Hata var mı kontrol et:
  - Database connection errors
  - Missing environment variables
  - API endpoint errors

## 🔧 Sorun Giderme

### Problem: "Cannot access 'A' before initialization"

**Çözüm:**
- Build cache'ini temizle:
  ```powershell
  Remove-Item -Recurse -Force dist
  Remove-Item -Recurse -Force node_modules/.vite
  npm run build
  ```
- Browser cache'ini temizle (Ctrl+Shift+R)

### Problem: Domain çalışmıyor

**Çözüm:**
1. DNS propagation bekle (24-48 saat)
2. Vercel subdomain'i test et: `https://learn-connect-*.vercel.app`
3. Eğer subdomain çalışıyorsa → DNS sorunu
4. Eğer subdomain çalışmıyorsa → Build/deployment sorunu

### Problem: API endpoints 500 hatası veriyor

**Çözüm:**
1. Vercel Runtime Logs'a bak
2. Environment variables kontrol et (özellikle `DATABASE_URL`, `ANTHROPIC_API_KEY`)
3. Database connection string doğru mu kontrol et

### Problem: Frontend JavaScript hataları

**Çözüm:**
- Browser console'da tam hata mesajını kaydet
- `dist/public/js/` klasöründeki chunk dosyalarını kontrol et
- Eğer hata devam ederse, `vite.config.ts`'de `minify: false` yap (geçici)

## 📋 Deployment Checklist

- [ ] TypeScript build başarılı (`npm run build`)
- [ ] Vercel environment variables ayarlı (Production)
- [ ] Domain Vercel'e bağlı ve SSL aktif
- [ ] DNS kayıtları doğru
- [ ] Deployment başarılı (`vercel --prod`)
- [ ] Health check çalışıyor (`/api/health`)
- [ ] Frontend yükleniyor (`/`)
- [ ] Browser console'da kritik hata yok
- [ ] Vercel runtime logs temiz

## 🎯 Sonraki Adımlar

1. **Client-side TypeScript hatalarını düzelt** (opsiyonel, build geçiyor)
2. **Performance monitoring** ekle (Vercel Analytics)
3. **Error tracking** ekle (Sentry, LogRocket, vs.)
4. **Database migration'ları** kontrol et (gerekirse)

## 📞 Destek

Eğer sorun devam ederse:
1. Vercel Dashboard'dan deployment loglarını kontrol et
2. Browser console'daki tam hata mesajlarını kaydet
3. `npm run build` çıktısını paylaş
