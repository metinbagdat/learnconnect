# Firestore Database Oluşturma Rehberi

## ⚠️ Önemli: 404 Hatası

Console'da şu hata görünüyorsa:
```
firestore.clients6.google.com/v1/projects/learnconnect-7c499/databases/(default)?alt=json
Failed to load resource: the server responded with a status of 404
```

**Bu, Firestore Database'in henüz oluşturulmadığını gösterir.**

## ✅ Firestore Database Oluşturma Adımları

### 1. Firebase Console'a Gidin
1. [Firebase Console](https://console.firebase.google.com/)
2. `learnconnect-7c499` projesini seçin

### 2. Firestore Database Oluşturun
1. Sol menüden **Firestore Database** seçin
2. **Create database** butonuna tıklayın
3. **Production mode** veya **Test mode** seçin
   - **Production mode:** Güvenli, rules gerektirir (önerilen)
   - **Test mode:** 30 gün açık, sonra rules gerekir
4. **Location** seçin (örn: `europe-west` veya `us-central`)
5. **Enable** butonuna tıklayın

### 3. Rules'ı Yükleyin
Database oluşturulduktan sonra:
1. **Rules** sekmesine gidin
2. `firestore.rules` dosyasının içeriğini yapıştırın
3. **Publish** butonuna tıklayın

### 4. Veri Ekleme
Database oluşturulduktan sonra seed script'i çalıştırabilirsiniz:
- Browser console: `BROWSER_CONSOLE_SEED.js` dosyasını kullanın
- Veya Firebase Console'dan manuel ekleyin

## 🔍 Console Hataları Hakkında

Gördüğünüz hatalar:
- `cloudusersettings-pa.clients6.google.com` - 404: Firebase Console'un kendi hataları, normal
- `runtime.lastError` - Browser extension hataları, normal
- `firebasestorage` - 403: Storage bucket ile ilgili, Firestore için gerekli değil
- `firestore.clients6.google.com` - 404: **ÖNEMLİ** - Database henüz oluşturulmamış

## ✅ Sonraki Adımlar

1. ✅ Firestore Database oluşturun (yukarıdaki adımlar)
2. ✅ Rules'ı yükleyin
3. ✅ Seed script'i çalıştırın (browser console'dan)
4. ✅ Test edin

## 📝 Not

404 hatası database oluşturulduktan sonra kaybolacak. Diğer hatalar Firebase Console'un normal davranışıdır ve uygulamanızı etkilemez.
