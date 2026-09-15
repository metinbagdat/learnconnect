# Admin Route 404 Hatası Çözümü

## Sorun
Production'da `/admin` route'una gidildiğinde 404 hatası alınıyor.

## Çözüm Adımları

### 1. Vercel.json Kontrolü ✅
`vercel.json` dosyasında rewrite kuralı mevcut ve doğru:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/|assets/|favicon).*)",
      "destination": "/index.html"
    }
  ]
}
```

Bu kural, `/admin` dahil tüm route'ları `index.html`'e yönlendirir (SPA routing için).

### 2. Build Output Kontrolü
Vercel build ayarlarını kontrol edin:

**Vercel Dashboard → Project → Settings → Build & Development Settings**

- **Build Command**: `npm run build` (veya `vite build`)
- **Output Directory**: `dist` (veya build output klasörünüz)
- **Install Command**: `npm install`

### 3. Build Sonrası Kontrol
Build sonrası `dist` klasöründe şunlar olmalı:
- `index.html`
- `assets/` klasörü (JS/CSS dosyaları)
- Admin component'leri build'e dahil edilmiş olmalı

### 4. Import Path Kontrolü ✅
`src/App.jsx` dosyasında admin import düzeltildi:
```javascript
const AdminDashboard = React.lazy(() => 
  import('./components/admin/AdminDashboard.jsx').catch((err) => {
    console.error('AdminDashboard import error:', err);
    // Error handling...
  })
);
```

### 5. Vercel Redeploy
Değişikliklerden sonra:
1. Git'e commit ve push yapın
2. Vercel otomatik deploy edecek
3. Veya manuel olarak Vercel Dashboard'dan "Redeploy" yapın

### 6. Test
Deploy sonrası:
1. `https://www.egitim.today/admin` adresine gidin
2. Admin login sayfası görünmeli
3. Eğer hala 404 alıyorsanız, browser console'u kontrol edin

## Olası Sorunlar ve Çözümleri

### Sorun 1: Build'de Admin Component Dahil Edilmemiş
**Çözüm**: 
- `vite.config.js`'de build ayarlarını kontrol edin
- `src/components/admin/` klasörünün build'e dahil olduğundan emin olun

### Sorun 2: Vercel Build Output Path Yanlış
**Çözüm**:
- Vercel Settings → Build & Development Settings
- Output Directory: `dist` olmalı

### Sorun 3: Import Path Hatalı
**Çözüm**:
- `src/App.jsx`'deki import path'i kontrol edin
- Relative path kullanın: `./components/admin/AdminDashboard.jsx`

### Sorun 4: Vercel Rewrite Kuralı Çalışmıyor
**Çözüm**:
- `vercel.json` dosyasını kontrol edin
- Vercel Dashboard → Settings → Rewrites bölümünü kontrol edin
- Gerekirse manuel olarak ekleyin

## Debug Adımları

1. **Browser Console Kontrolü**:
   - F12 → Console
   - `/admin` sayfasına gittiğinizde hata var mı?
   - Import hatası görünüyor mu?

2. **Network Tab Kontrolü**:
   - F12 → Network
   - `/admin` request'ini kontrol edin
   - Response ne döndürüyor?

3. **Vercel Logs Kontrolü**:
   - Vercel Dashboard → Deployments → Son deployment → Functions Logs
   - Build loglarını kontrol edin
   - Hata var mı?

4. **Build Locally Test**:
   ```bash
   npm run build
   # dist klasöründe index.html ve assets var mı?
   ```

## Hızlı Test

1. Local'de test edin:
   ```bash
   npm run build
   npm run preview
   # http://localhost:4173/admin adresine gidin
   ```

2. Eğer local'de çalışıyorsa, Vercel deploy sorunudur.
3. Eğer local'de de çalışmıyorsa, kod sorunudur.

## Sonraki Adımlar

1. ✅ `src/App.jsx` güncellendi (error handling eklendi)
2. ⏳ Git commit ve push
3. ⏳ Vercel otomatik deploy
4. ⏳ Test: `https://www.egitim.today/admin`
