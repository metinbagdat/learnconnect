# Production Deployment Checklist

## ✅ Yapılan Değişiklikler

### 1. Vite Config Optimizasyonları
- ✅ `minify: false` - Production'da minify kapalı (TDZ hatalarını önlemek için)
- ✅ `sourcemap: true` - Production'da sourcemap açık (debug için)
- ✅ `treeshake.preset: 'recommended'` - Daha az agresif tree-shaking
- ✅ `moduleSideEffects: true` - Tüm modüller için side effects preserve edildi

### 2. Error Handling
- ✅ `module-init-fix.ts` - SES hatalarını yakalama ve chunk initialization hatalarını loglama
- ✅ `index.html` - Inline SES error suppression script eklendi
- ✅ Fallback loading UI eklendi

### 3. Build Output
- ✅ Build başarılı - tüm chunk'lar oluşturuldu
- ✅ Sourcemap'ler oluşturuldu
- ✅ CSS dosyası oluşturuldu

## 🔍 Test Adımları

### Lokal Test
```powershell
# 1. Build al
npm run build

# 2. Preview çalıştır
npm run preview

# 3. Tarayıcıda aç
# http://localhost:4173
```

### Production Deploy
```powershell
# 1. Vercel'e deploy
vercel --prod

# 2. Production URL'i test et
# https://egitim.today
```

## 🐛 Debug Checklist

### Eğer hala "Cannot access 'A' before initialization" hatası varsa:

1. **Chrome DevTools → Sources sekmesi**
   - `chunk-*.js` dosyasını aç
   - Sourcemap sayesinde orijinal TS/TSX dosyasına map olacak
   - Hangi dosya ve satırda olduğunu bul

2. **Network sekmesi**
   - CSS dosyası yükleniyor mu? (`/assets/index-*.css`)
   - JS dosyaları yükleniyor mu? (`/js/index-*.js`)
   - 404 hatası var mı?

3. **Console sekmesi**
   - Tüm hataları kaydet
   - SES hataları suppress edildi mi?
   - Chunk initialization hataları var mı?

4. **Application sekmesi**
   - LocalStorage temizle
   - SessionStorage temizle
   - Cache temizle

## 📋 Production'da Kontrol Edilecekler

- [ ] Sayfa yükleniyor mu? (tek renk değil, normal görünüyor mu?)
- [ ] Auth sayfası görünüyor mu?
- [ ] CSS stilleri uygulanıyor mu?
- [ ] JavaScript çalışıyor mu? (interaksiyonlar çalışıyor mu?)
- [ ] Console'da hata var mı?
- [ ] Network'te 404 hatası var mı?

## 🔧 Acil Çözümler

### Eğer sayfa hala tek renk geliyorsa:

1. **Hard refresh yap:**
   - Chrome: `Ctrl+Shift+R` veya `Ctrl+F5`
   - Firefox: `Ctrl+Shift+R`

2. **Cache temizle:**
   ```javascript
   // Browser console'da çalıştır:
   localStorage.clear();
   sessionStorage.clear();
   caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
   location.reload(true);
   ```

3. **Service Worker varsa devre dışı bırak:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```

4. **Yeni build al ve deploy et:**
   ```powershell
   npm run build
   vercel --prod
   ```

## 📝 Notlar

- Minify kapalı olduğu için bundle boyutu büyük olacak - bu normal
- Sourcemap açık olduğu için production'da debug yapabilirsin
- Site çalışır hale gelince minify'i tekrar açabiliriz
- SES hataları browser extension'lardan geliyor - bunlar suppress edildi
