# Vercel Advanced Settings - Concurrent Builds, Skew Protection, Cold Start

## Overview

Bu dokümanda Vercel'deki gelişmiş ayarları açıklıyoruz:
- Concurrent Builds (Eşzamanlı Build'ler)
- Skew Protection (Versiyon Tutarlılığı)
- Cold Start Prevention (Soğuk Başlangıç Önleme)
- Domain ve DNS Ayarları
- Directory Listing
- Redirect Limits

## 1. Concurrent Builds (Eşzamanlı Build'ler)

### Ne İşe Yarar?
Aynı anda birden fazla deployment'ın build edilmesine izin verir. Varsayılan olarak Vercel bir seferde bir deployment build eder.

### Vercel Dashboard'da Ayarlama:
1. **Settings → Git → Build & Development Settings**
2. "Concurrent Builds" seçeneğini açın
3. Limit belirleyin (Hobby plan'da genellikle 1, Pro plan'da daha fazla)

### Vercel.json'da:
```json
{
  "github": {
    "autoJobCancelation": true  // ✅ Zaten aktif - eski build'leri iptal eder
  }
}
```

**Mevcut Durum:** `autoJobCancelation: true` aktif - yeni deployment gelince eski build'ler iptal edilir (concurrent builds için optimize edilmiş)

## 2. Skew Protection (Versiyon Tutarlılığı)

### Ne İşe Yarar?
Client ve server versiyonlarının aynı deployment'tan gelmesini garanti eder. Frontend ve backend'in senkronize olmasını sağlar.

### Vercel Dashboard'da Ayarlama:
1. **Settings → Build and Deployment → Skew Protection**
2. "Enable Skew Protection" seçeneğini açın/kapatın
3. Varsayılan: **Enabled** (önerilir)

### Vercel.json'da:
Skew protection `vercel.json`'da direkt olarak ayarlanamaz, dashboard'da ayarlanmalı.

**Mevcut Durum:** Vercel varsayılan olarak skew protection'ı aktif tutar (önerilir)

## 3. Cold Start Prevention (Soğuk Başlangıç Önleme)

### Ne İşe Yarar?
Serverless function'ların ilk çağrıda yavaş başlamasını (cold start) önlemek için function'ları sıcak tutar.

### Vercel.json'da Ayarlama:
```json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 30,        // ✅ Zaten ayarlı
      "memory": 1024            // Memory artırılabilir (cold start'ı azaltır)
    }
  },
  "regions": ["fra1"]           // Region belirleme (cold start'ı azaltır)
}
```

**Mevcut Durum:** 
- ✅ `maxDuration: 30` ayarlı
- ⚠️ `memory` belirtilmemiş (varsayılan kullanılıyor)
- ⚠️ `regions` belirtilmemiş

### İyileştirme Önerileri:
1. **Memory artırma:** Cold start'ı azaltır
2. **Region belirtme:** Latency'yi azaltır
3. **Warm-up endpoint:** Kritik function'ları periyodik olarak çağırma

## 4. Domain Ayarları (egitim.today)

### Vercel Dashboard'da Domain Takibi:
1. **Ana Sayfa:** https://vercel.com/dashboard
2. **Project Sayfası:** https://vercel.com/metinbahdats-projects/learn-connect
3. **Domain Settings:** https://vercel.com/metinbahdats-projects/learn-connect/settings/domains
4. **Domain Detayları:** Domain'e tıklayarak detayları görebilirsiniz

### Domain Durumu Kontrolü:
```
Domain: egitim.today
Status: Active / Pending / Error
Deployment: Hangi deployment'a assign edildiği
DNS Records: Vercel'in önerdiği DNS kayıtları
```

### DNS Ayarları:
Vercel domain'e tıklandığında gösterilen DNS kayıtları:

**A Record (IPv4):**
- Name: `@` veya boş
- Value: Vercel'in verdiği IP adresi (76.76.21.21 gibi)
- TTL: 3600

**CNAME Record:**
- Name: `@` veya `www`
- Value: `cname.vercel-dns.com.` veya projenin CNAME değeri
- TTL: 3600

**Veya ALIAS/ANAME Record:**
- Name: `@`
- Value: Vercel'in verdiği CNAME değeri

### Domain Ayarlarını Kontrol Etme:
1. Vercel Dashboard → Project → Settings → Domains
2. `egitim.today` domain'ine tıklayın
3. DNS Configuration bölümünden gerekli kayıtları görebilirsiniz

## 5. Directory Listing

### Ne İşe Yarar?
Dizin içeriğini listelemek için kullanılır. Güvenlik için genellikle kapalı tutulur.

### Vercel'de:
- **Varsayılan:** Kapalı (önerilir)
- **Açma:** Vercel'de direkt bir ayar yok, `index.html` dosyası oluşturarak yapılabilir
- **Önerilen:** Kapalı tutun (güvenlik için)

### Vercel.json'da:
Directory listing `vercel.json`'da ayarlanamaz.

**Mevcut Durum:** Kapalı (güvenlik için doğru)

## 6. Redirect Limits (Yönlendirme Limitleri)

### Vercel Limitleri:
- **Maximum Redirects:** 1,024 redirects
- **Limit Artırılamaz:** Bu maksimum limit
- **Önerilen:** 1,024'ten az kullanın

### Vercel.json'da:
```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
    // Maksimum 1,024 adet
  ]
}
```

**Mevcut Durum:** 
- ✅ `redirects` array'i yok (limit kullanılmıyor)
- ✅ Sadece `rewrites` kullanılıyor (redirect limit'ini etkilemiyor)

### Redirect vs Rewrite:
- **Redirect:** Kullanıcıyı farklı bir URL'ye yönlendirir (301/302)
- **Rewrite:** URL'i değiştirmeden içeriği farklı bir path'ten serve eder
- **Rewrite kullanımı:** Redirect limit'ini etkilemez

## 7. egitim.today Domain Takibi

### Vercel Dashboard Linkleri:

**Domain Settings:**
```
https://vercel.com/metinbahdats-projects/learn-connect/settings/domains
```

**Domain Overview (Tüm Domain'ler):**
```
https://vercel.com/metinbahdats-projects/learn-connect/domains
```

**Project Overview:**
```
https://vercel.com/metinbahdats-projects/learn-connect
```

**Deployments (Domain'in hangi deployment'a assign edildiğini görmek için):**
```
https://vercel.com/metinbahdats-projects/learn-connect/deployments
```

### Domain Durumunu Kontrol Etme:

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/dashboard

2. **Project'i seçin:**
   - "learn-connect" projesine tıklayın

3. **Settings → Domains:**
   - Sol menüden "Settings" → "Domains"
   - `egitim.today` domain'ini bulun

4. **Domain Detayları:**
   - Domain'e tıklayın
   - Status, DNS Configuration, Deployment Assignment görüntülenir

### DNS Kontrolü:

**DNS kayıtlarını kontrol etmek için:**
```bash
# Windows
nslookup egitim.today
nslookup www.egitim.today

# Veya online tools:
# - https://dnschecker.org/
# - https://www.whatsmydns.net/
```

## Test ve Doğrulama

### 1. Domain Çalışıyor mu?
```bash
# HTTPS kontrolü
curl -I https://egitim.today

# HTTP redirect kontrolü
curl -I http://egitim.today
```

### 2. DNS Kayıtları Doğru mu?
```bash
nslookup egitim.today
# Vercel'in verdiği IP/CNAME ile eşleşmeli
```

### 3. Deployment Atanmış mı?
- Vercel Dashboard → Domains → egitim.today
- "Production Deployment" bölümünde deployment görünmeli

### 4. SSL Sertifikası Aktif mi?
- Vercel otomatik olarak SSL sağlar
- Domain ayarlarında "SSL Certificate" durumunu kontrol edin

## Önerilen İyileştirmeler

### 1. Cold Start Prevention İçin:
```json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 30,
      "memory": 1024  // Artırılsın (cold start'ı azaltır)
    }
  },
  "regions": ["fra1"]  // Region belirtilsin
}
```

### 2. Concurrent Builds İçin:
- Vercel Dashboard'da "Concurrent Builds" açılabilir (Pro plan gerekebilir)
- `autoJobCancelation: true` zaten aktif (iyi)

### 3. Skew Protection İçin:
- Vercel Dashboard'da "Skew Protection" kontrol edilsin
- Varsayılan olarak aktif olmalı (iyi)

## Özet

### ✅ Mevcut Durum:
- Concurrent Builds: `autoJobCancelation: true` aktif
- Skew Protection: Vercel varsayılan (aktif olmalı)
- Cold Start Prevention: `maxDuration` ayarlı, `memory` ve `regions` eklenebilir
- Domain: `egitim.today` Vercel'de yapılandırılmalı
- Directory Listing: Kapalı (doğru)
- Redirect Limits: Kullanılmıyor (1,024 limit var)

### 🔧 Yapılacaklar:
1. Domain durumunu Vercel Dashboard'dan kontrol et
2. DNS kayıtlarını doğrula
3. Cold start için `memory` ve `regions` ekle (opsiyonel)
4. Domain'in production deployment'a assign edildiğini kontrol et
