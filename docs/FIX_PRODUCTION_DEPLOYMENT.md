# Fix Production Deployment - Framework Settings Mismatch

## Problem

Framework Settings sayfasında şu uyarı görünüyor:
**"Configuration Settings in the current Production deployment differ from your current Project Settings"**

Ve egitim.today hala SES hatalarıyla çalışmıyor.

## Root Cause

Framework Settings sayfasında:
- **Build Command:** `npm run build` (eski/yetersiz)
- **vercel.json'da:** `npm run build:vercel || npm run build` (doğru)

Bu uyumsuzluk production deployment'ın eski build command'ı kullanmasına neden oluyor.

## Solution

### Option 1: Framework Settings'i Güncelle (Recommended)

1. **Framework Settings sayfasına gidin:**
   - Vercel Dashboard → Settings → Git → Framework Settings
   - Veya: https://vercel.com/metinbahdats-projects/learn-connect/settings/git

2. **Build Command'ı güncelleyin:**
   - Mevcut: `npm run build`
   - Yeni: `npm run build:vercel || npm run build`
   - Override toggle'ı açık olmalı (zaten açık görünüyor)

3. **Output Directory kontrolü:**
   - Olmalı: `dist/public`
   - Override toggle açık olmalı

4. **Save butonuna tıklayın**

5. **Yeni deployment otomatik başlar**

### Option 2: vercel.json'ı Kullan (Alternative)

Eğer Framework Settings'te override'ları kapatırsanız, Vercel `vercel.json`'daki ayarları kullanır:

1. Framework Settings sayfasında her bir ayarın **"Override" toggle'ını kapatın**
2. Vercel otomatik olarak `vercel.json`'daki ayarları kullanır
3. Save butonuna tıklayın

## Verification

After updating:

1. **Deployment başlar:**
   - Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
   - Yeni bir deployment görünmeli

2. **Build başarılı olmalı:**
   - Build loglarında hata olmamalı
   - Status: "Ready" olmalı

3. **Domain atanır:**
   - Deployment tamamlandıktan sonra domain otomatik atanır
   - Settings → Domains → egitim.today kontrol et

4. **Test:**
   - https://egitim.today yüklenmeli
   - Browser console'da SES hataları görünmemeli (veya suppress edilmiş olmalı)

## Expected Timeline

1. **Now:** Framework Settings'te Build Command'ı güncelle
2. **1-2 minutes:** Deployment build edilir
3. **After build:** Domain yeni deployment'a atanır
4. **Test:** egitim.today'ı test et

## Important Notes

- Framework Settings'teki ayarlar `vercel.json`'dan **override** eder
- Bu yüzden Framework Settings'teki Build Command yanlışsa, doğru build command kullanılmaz
- `npm run build:vercel` komutu `SKIP_TYPE_CHECK=true` ile çalışır, bu yüzden daha güvenilir
- Fallback olarak `npm run build` kullanılır

## Current Configuration

### Framework Settings (Yanlış):
```
Build Command: npm run build
```

### vercel.json (Doğru):
```json
{
  "buildCommand": "npm run build:vercel || npm run build"
}
```

### Fix:
Framework Settings'te Build Command'ı `npm run build:vercel || npm run build` olarak güncelle.
