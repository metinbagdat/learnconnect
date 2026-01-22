# SSL_ERROR_RX_RECORD_TOO_LONG – Çözüm

## Sorun
- `learn-connect-*.vercel.app` veya `egitim.today` açılırken **SSL_ERROR_RX_RECORD_TOO_LONG**
- Kök neden: **`vercel.json`** dosyası. Rewrites/headers ile Vercel’in varsayılan SSL/routing davranışı çakışıyor.

## Çözüm (Uygulandı)
- **`vercel.json` tamamen silindi** (commit 4052e56).
- Vercel, Vite projesini otomatik algılıyor; ekstra config gerekmiyor.
- **`vercel.json` geri eklenmemeli.**

## Bu Repo’da Durum
- ✅ `vercel.json` yok (silindi).
- ✅ Build: `npm run build`, çıktı: `dist`.
- ✅ Node 20.x LTS.

## Vercel Tarafında Yapılacaklar
1. **Build & Development:** Override kapalı; Framework: Vite.
2. **Environment Variables:** 7 adet `VITE_FIREBASE_*` ekli olmalı.
3. **Deploy:** `main` branch’in **en güncel** commit’i deploy edilmeli (4052e56 veya sonrası).

## Test
- https://egitim.today
- https://egitim.today/admin  
SSL hatası olmamalı.
