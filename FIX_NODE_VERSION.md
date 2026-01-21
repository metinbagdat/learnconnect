# 🚨 Node.js Versiyon Sorunu - Çözüm

## Sorun
- **Mevcut Node.js:** v24.11.1 (Experimental - Stabil Değil!)
- **OpenSSL:** 3.5.4 (Cipher operation failed hatası veriyor)
- **npm:** 11.6.2

## ✅ Çözüm: LTS Versiyona Geç

### 1. Node.js LTS İndir

https://nodejs.org/

**İki seçenek:**
- **v22.x** (Current LTS - Önerilen)
- **v20.x** (Önceki LTS - Daha kararlı)

### 2. Mevcut Node.js'i Kaldır

```powershell
# Windows Settings → Apps → Node.js → Uninstall
# VEYA
winget uninstall OpenJS.NodeJS
```

### 3. Yeni Node.js'i Yükle

- İndirdiğin installer'ı çalıştır
- "Automatically install necessary tools" seçeneğini işaretle
- Yükleme tamamlanınca **bilgisayarı yeniden başlat**

### 4. Versiyonu Kontrol Et

```powershell
node --version
# v22.x.x veya v20.x.x olmalı

npm --version
# 10.x.x olmalı
```

### 5. Projeye Geri Dön ve Firebase'i Yükle

```powershell
cd C:\Users\mb\Desktop\LearnConnect\LearnConnect

# Cache temizle
npm cache clean --force

# package-lock.json'ı sil
Remove-Item package-lock.json -Force

# npm registry'i resetle
npm config set registry https://registry.npmjs.org
npm config set strict-ssl true

# Firebase'i yükle
npm install firebase

# Tüm paketleri yükle
npm install
```

### 6. Dev Sunucuyu Başlat

```powershell
npm run dev
```

### 7. Admin Dashboard'a Git

```
http://localhost:5175/admin
```

---

## Hızlı Alternatif (NVM Kullan)

Eğer birden fazla Node.js versiyonu kullanmak istersen:

### NVM (Node Version Manager) Yükle

```powershell
# Windows için:
https://github.com/coreybutler/nvm-windows/releases

# nvm-setup.exe'yi indir ve yükle
```

### Node.js Versiyonlarını Yönet

```bash
# LTS versiyonu yükle
nvm install 22

# Kullan
nvm use 22

# Mevcut versiyonu kontrol et
nvm current
```

---

## Beklenen Sonuç

✅ Node.js v22.x veya v20.x
✅ npm SSL hatası gitmeli
✅ `npm install firebase` başarılı olmalı
✅ Admin dashboard çalışmalı

---

## Sorun Devam Ederse

Eğer LTS versiyonla bile sorun devam ederse:

```powershell
# npm'i global olarak güncelle
npm install -g npm@latest

# Veya Yarn kullan
npm install -g yarn
yarn add firebase
```

---

**NOT:** v24.x experimental bir versiyon ve production kullanımı için önerilmez. Her zaman LTS (Long Term Support) versiyonları tercih edin.
