# ✅ Firebase Setup - Tam Kontrol Listesi

## 🔧 Yapılacaklar (Sırayla)

### ✅ 1. .env Dosyası
- [x] `.env` dosyası `.gitignore`'da
- [x] Firebase config değerleri `.env`'e eklendi
- [x] Tüm environment variables mevcut

### ⏳ 2. Firebase SDK Kurulumu
- [x] `package.json`'a `firebase: ^12.8.0` eklendi
- [ ] `npm install` başarıyla tamamlandı
  - **Durum:** SSL hatası nedeniyle `npm install --legacy-peer-deps` çalıştırılıyor
  - **Kontrol:** `node_modules/firebase` klasörü var mı?

### 📝 3. Firestore Rules
- [x] `firestore.rules` dosyası oluşturuldu
- [ ] Firebase Console'a yüklendi
  - **Adımlar:** `FIRESTORE_RULES_SETUP.md` dosyasına bakın
  - Firebase Console → Firestore Database → Rules → `firestore.rules` içeriğini yapıştır → Publish

### 🌱 4. Firestore Veri Ekleme
- [x] `scripts/firestore-seed.js` oluşturuldu
- [ ] Firestore Database oluşturuldu
  - Firebase Console → Firestore Database → Create database
- [ ] Seed script çalıştırıldı
  - `node scripts/firestore-seed.js`
  - **Rehber:** `FIRESTORE_SEED_GUIDE.md` dosyasına bakın

### 🌐 5. Vercel Environment Variables
- [x] `VERCEL_ENV_SETUP.md` rehberi oluşturuldu
- [ ] Vercel Dashboard'dan environment variables eklendi
  - Vercel Dashboard → Project → Settings → Environment Variables
  - Tüm `VITE_FIREBASE_*` değişkenlerini ekleyin

### 🧪 6. Test
- [ ] `npm run dev` ile uygulamayı başlatın
- [ ] `/tyt-dashboard` sayfasına gidin
- [ ] **Müfredat** tab'ına tıklayın → CurriculumTree component'i çalışıyor mu?
- [ ] **AI Plan** tab'ına tıklayın → AIPlanGenerator component'i çalışıyor mu?

## 📋 Hızlı Komutlar

```bash
# 1. Firebase SDK kurulumu (SSL hatası varsa)
npm install --legacy-peer-deps

# 2. Firestore seed script
node scripts/firestore-seed.js

# 3. Uygulamayı başlat
npm run dev
```

## 📚 Rehber Dosyaları

- `FIRESTORE_RULES_SETUP.md` - Firestore Rules yükleme
- `FIRESTORE_SEED_GUIDE.md` - Seed script kullanımı
- `VERCEL_ENV_SETUP.md` - Vercel environment variables
- `FIREBASE_SETUP_COMPLETE.md` - Genel özet

## ✅ Durum Kontrolü

```powershell
# PowerShell ile kontrol
powershell -ExecutionPolicy Bypass -File "scripts\check-firebase-setup.ps1"
```

## 🎯 Sonraki Adımlar

1. ⏳ `npm install --legacy-peer-deps` tamamlanmasını bekleyin
2. 📝 Firestore Rules'ı Firebase Console'a yükleyin
3. 🌱 Firestore Database oluşturup seed script çalıştırın
4. 🌐 Vercel'e environment variables ekleyin
5. 🧪 Test edin

## 💡 Notlar

- SSL hatası devam ederse, farklı bir network'ten deneyin veya VPN kullanın
- Firestore veri yoksa, uygulama mock data gösterecek (fallback mevcut)
- Tüm dosyalar hazır, sadece yukarıdaki adımları tamamlayın
