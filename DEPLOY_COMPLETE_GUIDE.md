# 🚀 Deploy Öncesi ve Sonrası - TAM REHBER

## ✅ DEPLOY ÖNCESİ (Tamamlandı)

### 1. Kod Değişiklikleri ✅
- [x] Login sayfası oluşturuldu (`client/src/pages/login.tsx`)
- [x] Register sayfası oluşturuldu (`client/src/pages/register.tsx`)
- [x] Auth hook oluşturuldu (`client/src/hooks/use-auth.ts`)
- [x] Auth guard component oluşturuldu (`client/src/components/auth/AuthGuard.tsx`)
- [x] TYT Dashboard'a logout butonu eklendi
- [x] Ana dashboard'a logout butonu eklendi
- [x] Routing güncellendi (`client/src/App.tsx`)
- [x] Entry point oluşturuldu (`client/src/main.tsx`)
- [x] `package.json`'a `wouter` eklendi

### 2. Build Testi ✅
```bash
npm run build
```
**Sonuç:** ✅ Build başarılı
- `dist/index.html` oluşturuldu
- `dist/assets/` klasörü oluşturuldu

### 3. Linter Kontrolü ✅
- [x] Linter hataları yok

### 4. Dosya Yapısı ✅
- [x] Tüm gerekli dosyalar mevcut
- [x] `.env` `.gitignore`'da

## 🚀 DEPLOY ADIMLARI

### Adım 1: Git Commit ve Push
```bash
git add .
git commit -m "feat: Add login/register pages, auth guard, and logout functionality"
git push origin main
```

### Adım 2: Vercel Environment Variables
Vercel Dashboard → Project → Settings → Environment Variables → Ekle:

**Production için:**
```
VITE_FIREBASE_API_KEY=AIzaSyDeZACW1poVyTucZgq0Y1JnqlAumRhnwkg
VITE_FIREBASE_AUTH_DOMAIN=learnconnect-7c499.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=learnconnect-7c499
VITE_FIREBASE_STORAGE_BUCKET=learnconnect-7c499.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=94708429652
VITE_FIREBASE_APP_ID=1:94708429652:web:af1e854867d6eeaf3dcec1
VITE_FIREBASE_MEASUREMENT_ID=G-SKHJCN4ST9
```

**ÖNEMLİ:** Her environment variable için:
- Environment: Production, Preview, Development seçin
- Değeri yapıştırın
- Save'e tıklayın

### Adım 3: Vercel Deploy
- Git push sonrası Vercel otomatik deploy edecek
- Veya manuel: Vercel Dashboard → Deployments → Redeploy

## ✅ DEPLOY SONRASI TESTLER

### 1. Site Erişilebilirlik
- [ ] `https://www.egitim.today` açılıyor mu?
- [ ] SSL sertifikası çalışıyor mu?
- [ ] Sayfa yükleniyor mu?

### 2. Login/Register Testi
- [ ] `https://www.egitim.today/login` açılıyor mu?
- [ ] `https://www.egitim.today/register` açılıyor mu?
- [ ] Login formu çalışıyor mu? (Demo: `demo` / `demo123`)
- [ ] Register formu çalışıyor mu?
- [ ] Hata mesajları gösteriliyor mu?

### 3. Auth Guard Testi
- [ ] Login olmadan `https://www.egitim.today/tyt-dashboard` → `/login`'e yönlendiriyor mu?
- [ ] Login olmadan ana dashboard → `/login`'e yönlendiriyor mu?
- [ ] Login olmuş kullanıcı `/login`'e gidince dashboard'a yönlendiriyor mu?

### 4. Session Yönetimi Testi
- [ ] Login sonrası session oluşuyor mu?
- [ ] Sayfa yenilendiğinde session korunuyor mu?
- [ ] `/api/user` endpoint'i çalışıyor mu?

### 5. Logout Testi
- [ ] Logout butonu görünüyor mu? (TYT Dashboard ve ana dashboard'da)
- [ ] Logout butonuna tıklanınca çıkış yapıyor mu?
- [ ] Logout sonrası `/login`'e yönlendiriyor mu?
- [ ] Logout sonrası session temizleniyor mu?

### 6. TYT Dashboard Testi
- [ ] Login sonrası `/tyt-dashboard` açılıyor mu?
- [ ] Metrikler gösteriliyor mu?
- [ ] Haftalık plan tablosu görünüyor mu?
- [ ] Ders bazında ilerleme grafikleri görünüyor mu?
- [ ] Logout butonu çalışıyor mu?

### 7. API Endpoints Testi
```bash
# Health check
curl https://www.egitim.today/health

# Login test (demo hesap)
curl -X POST https://www.egitim.today/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' \
  -c cookies.txt

# User info test
curl https://www.egitim.today/api/user -b cookies.txt

# Logout test
curl -X POST https://www.egitim.today/api/logout -b cookies.txt
```

### 8. Console Hataları Kontrolü
- [ ] Browser console'da hata var mı? (F12 → Console)
- [ ] Network tab'da failed request var mı?
- [ ] CORS hatası var mı?

### 9. Responsive Test
- [ ] Mobil görünüm çalışıyor mu?
- [ ] Tablet görünüm çalışıyor mu?
- [ ] Desktop görünüm çalışıyor mu?

## 🔧 SORUN GİDERME

### Eğer Build Başarısız Olursa:
1. Vercel logs'u kontrol et
2. Environment variables eksik mi kontrol et
3. `npm install` çalıştır (Vercel otomatik yapar)

### Eğer Login Çalışmıyorsa:
1. Browser console'u kontrol et (F12)
2. Network tab'da `/api/login` request'ini kontrol et
3. Vercel logs'u kontrol et
4. Backend `/api/login` endpoint'i çalışıyor mu?

### Eğer Auth Guard Çalışmıyorsa:
1. `useAuth` hook'u çalışıyor mu?
2. `/api/user` endpoint'i 200 döndürüyor mu?
3. Session cookie'si set ediliyor mu?

### Eğer Logout Çalışmıyorsa:
1. `/api/logout` endpoint'i çalışıyor mu?
2. Session cookie'si temizleniyor mu?
3. Redirect çalışıyor mu?

## 📝 DEPLOY NOTLARI

- **ÖNEMLİ:** Environment variables Vercel Dashboard'dan eklenmeli
- **ÖNEMLİ:** `.env` dosyası asla commit edilmemeli (✅ .gitignore'da)
- **ÖNEMLİ:** Build başarısız olursa Vercel logs'u kontrol et
- **ÖNEMLİ:** İlk deploy sonrası tüm endpoint'leri test et

## ✅ BAŞARI KRİTERLERİ

- ✅ Login/Register sayfaları çalışıyor
- ✅ Auth guard korumalı route'ları koruyor
- ✅ Session yönetimi çalışıyor
- ✅ Logout çalışıyor
- ✅ TYT Dashboard çalışıyor
- ✅ Tüm endpoint'ler erişilebilir
- ✅ Console'da hata yok
- ✅ Responsive tasarım çalışıyor

## 🎉 DEPLOY TAMAMLANDI

Tüm kontroller başarılı ise:
- ✅ Site production'da çalışıyor (`egitim.today`)
- ✅ Kullanıcılar login/register yapabilir
- ✅ Protected route'lar korunuyor
- ✅ Logout çalışıyor

## 📞 DESTEK

Sorun yaşarsanız:
1. Browser console loglarını kontrol edin
2. Vercel logs'u kontrol edin
3. Network tab'daki request'leri kontrol edin
4. `DEPLOY_CHECKLIST.md` dosyasındaki troubleshooting bölümüne bakın
