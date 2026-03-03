# 🚀 Hızlı Deploy Rehberi

## ⚡ Hızlı Adımlar

### 1. Paketleri Yükle
```bash
npm install
```

### 2. Build Testi
```bash
npm run build
```

### 3. Git Commit ve Push
```bash
git add .
git commit -m "feat: Add login/register pages, auth guard, and logout"
git push origin main
```

### 4. Vercel Environment Variables
Vercel Dashboard → Settings → Environment Variables → Ekle:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### 5. Deploy Sonrası Test
1. `https://www.egitim.today/login` - Login sayfası
2. `https://www.egitim.today/register` - Register sayfası
3. Demo hesap: `demo` / `demo123`
4. Logout butonu test et

## ✅ Kontrol Listesi

- [ ] `npm install` başarılı
- [ ] `npm run build` başarılı
- [ ] Git commit yapıldı
- [ ] Git push yapıldı
- [ ] Vercel environment variables eklendi
- [ ] Deploy tamamlandı
- [ ] Login/Register test edildi
- [ ] Logout test edildi

## 🎯 Başarı!

Tüm adımlar tamamlandıysa site `egitim.today`'da çalışıyor olmalı!
