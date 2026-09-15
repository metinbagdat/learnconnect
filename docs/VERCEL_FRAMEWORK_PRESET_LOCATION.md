# Vercel Framework Preset Konumu

## Önemli Not

**"No framework detected" uyarısı bir sorun değildir!** Build çalışıyorsa deployment başarılıdır. Framework Preset ayarı **opsiyoneldir**.

## Framework Preset Nerede?

Framework Preset **"Git" bölümünde değil**, şu bölümlerde olabilir:

### Seçenek 1: Settings → General

1. **Vercel Dashboard:** https://vercel.com/metinbahdats-projects/learn-connect/settings
2. Sol menüden **"General"** seçin
3. "Framework Preset" veya "Framework" bölümünü arayın

**Link:** https://vercel.com/metinbahdats-projects/learn-connect/settings/general

### Seçenek 2: Settings → Build and Deployment

1. **Vercel Dashboard:** https://vercel.com/metinbahdats-projects/learn-connect/settings
2. Sol menüden **"Build and Deployment"** seçin
3. "Framework Preset" bölümünü arayın

**Link:** https://vercel.com/metinbahdats-projects/learn-connect/settings/deployment-protection

### Seçenek 3: Proje Kurulum Sayfası

Bazen Framework Preset sadece proje ilk oluşturulurken ayarlanabilir. Mevcut projelerde görünmeyebilir.

## Framework Preset Bulunamıyorsa

**Hiçbir şey yapmanıza gerek yok!** 

### Neden?

1. ✅ Build çalışıyor (`vercel.json`'da buildCommand doğru)
2. ✅ Deployment başarılı
3. ✅ Site çalışıyor
4. ⚠️ "No framework detected" sadece bir uyarı, hata değil

### vercel.json Yeterli

Mevcut `vercel.json` yapılandırması yeterli:

```json
{
  "buildCommand": "npm run build:vercel || npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install --include=dev"
}
```

Bu ayarlar framework preset olmadan da çalışır.

## Framework Preset Ne Zaman Gerekli?

Framework Preset genellikle şu durumlarda gerekir:
- Vercel otomatik algılayamıyorsa (bizim durumumuz)
- Build settings otomatik olarak ayarlanmasını istiyorsanız
- Vercel'in UI'da doğru framework gösterilmesini istiyorsanız

Ancak **zorunlu değildir** - `vercel.json`'daki build settings yeterlidir.

## Kontrol Listesi

### Framework Preset Bulunamıyorsa:

- [ ] ✅ Build çalışıyor mu? (`vercel.json` kontrol et)
- [ ] ✅ Deployment başarılı mı? (Deployments sayfasına bak)
- [ ] ✅ Site çalışıyor mu? (egitim.today'a git)

**Eğer yukarıdakilerin hepsi ✅ ise, Framework Preset ayarlamaya gerek yok!**

## Özet

- Framework Preset **"Git" bölümünde değil**
- "General" veya "Build and Deployment" bölümünde olabilir
- **Bulunamıyorsa sorun değil** - build çalışıyorsa yeterli
- `vercel.json`'daki build settings zaten doğru
- "No framework detected" sadece bir uyarı, deployment'ı etkilemez
