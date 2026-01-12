# Vercel Framework Setup Guide

## Hızlı Çözüm

Vercel Dashboard'da Framework Preset'i "Other" olarak ayarlayın:

**Link:** https://vercel.com/metinbahdats-projects/learn-connect/settings/git

**Adımlar:**
1. Settings → Git → Build & Development Settings
2. Framework Preset → "Other" seçin
3. Save

## Detaylı Açıklama

### Proje Yapısı

Bu proje **hybrid** bir yapı:
- **Frontend:** Vite + React (SPA)
- **Backend:** Express (Serverless Functions)
- **Build:** Custom build script

### Vercel Framework Detection

Vercel framework'ü şu kriterlere göre algılar:
1. ✅ `package.json` dependencies (`vite` var)
2. ✅ Build scripts (`vite build` var)
3. ✅ Config files (`vite.config.ts` var)
4. ⚠️ Ancak custom build script karma yapıyı algılamayı zorlaştırır

### Mevcut Durum

- **Framework Detection:** "No framework detected" (uyarı, hata değil)
- **Build:** ✅ Çalışıyor
- **Deployment:** ✅ Başarılı
- **Site:** ✅ Çalışıyor

### Çözüm

**Seçenek 1: Framework Preset'i "Other" Olarak Ayarla (Önerilen)**

Vercel Dashboard'dan:
- Settings → Git → Build & Development Settings
- Framework Preset → "Other"
- Build Command: `npm run build:vercel || npm run build` (zaten ayarlı)
- Output Directory: `dist/public` (zaten ayarlı)

**Seçenek 2: Hiçbir Şey Yapma (Önerilen)**

Eğer deployment çalışıyorsa, "No framework detected" uyarısını görmezden gelebilirsiniz. Build settings `vercel.json`'da zaten doğru.

### Build Settings Kontrolü

Mevcut `vercel.json` ayarları doğru:

```json
{
  "buildCommand": "npm run build:vercel || npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install --include=dev"
}
```

Bu ayarlar yeterli - framework preset sadece Vercel'in UI'da göstermesi için.

## Özet

- ✅ Build çalışıyor
- ✅ Deployment başarılı
- ⚠️ "No framework detected" sadece bir uyarı
- 🔧 Framework Preset'i "Other" olarak ayarlayabilirsiniz (opsiyonel)
