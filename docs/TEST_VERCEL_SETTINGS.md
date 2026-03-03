# Vercel Settings Test ve Doğrulama Rehberi

## Test Adımları

### 1. Domain Durumu Kontrolü (egitim.today)

**Vercel Dashboard Linki:**
```
https://vercel.com/metinbahdats-projects/learn-connect/settings/domains
```

**Kontrol Listesi:**
- [ ] Domain listesinde `egitim.today` görünüyor mu?
- [ ] Domain status "Active" mi?
- [ ] Production deployment'a assign edilmiş mi?
- [ ] SSL sertifikası aktif mi?

### 2. DNS Ayarları Kontrolü

**Komut:**
```powershell
nslookup egitim.today
nslookup www.egitim.today
```

**Beklenen:**
- A Record veya CNAME Record Vercel'in verdiği değerlerle eşleşmeli
- TTL değerleri 3600 veya altı olmalı

**Vercel Dashboard'dan DNS Kayıtlarını Görme:**
1. Settings → Domains → egitim.today
2. "DNS Configuration" bölümü
3. Vercel'in önerdiği DNS kayıtları görüntülenir

### 3. Website Erişilebilirlik Testi

**Test Komutları:**
```powershell
# HTTPS kontrolü
curl -I https://egitim.today

# HTTP redirect kontrolü (HTTP'den HTTPS'e yönlendirme)
curl -I http://egitim.today

# www subdomain kontrolü (eğer yapılandırılmışsa)
curl -I https://www.egitim.today
```

**Beklenen Sonuçlar:**
- HTTPS: `200 OK` veya `301/302 Redirect`
- HTTP: `301/302 Redirect` to HTTPS
- SSL sertifikası geçerli olmalı

### 4. Deployment Assignment Kontrolü

**Vercel Dashboard Linki:**
```
https://vercel.com/metinbahdats-projects/learn-connect/deployments
```

**Kontrol:**
- [ ] En son production deployment "Ready" durumunda mı?
- [ ] Domain bu deployment'a assign edilmiş mi?
- [ ] Deployment build'i başarılı mı?

**Domain'in hangi deployment'a assign edildiğini görmek:**
1. Settings → Domains → egitim.today
2. "Production Deployment" bölümü
3. Deployment ID ve URL görüntülenir

### 5. Concurrent Builds Kontrolü

**Vercel Dashboard:**
```
Settings → Git → Build & Development Settings
```

**Kontrol:**
- [ ] "Concurrent Builds" ayarı görünüyor mu?
- [ ] Hobby plan'da genellikle 1 concurrent build
- [ ] `autoJobCancelation: true` aktif (vercel.json'da)

### 6. Skew Protection Kontrolü

**Vercel Dashboard:**
```
Settings → Build and Deployment → Skew Protection
```

**Kontrol:**
- [ ] "Enable Skew Protection" açık mı? (Varsayılan: açık)
- [ ] Versiyon tutarlılığı garantisi var mı?

### 7. Cold Start Prevention Kontrolü

**vercel.json Kontrolü:**
```json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 30,  // ✅ Ayarlı
      "memory": 1024      // ✅ Eklendi
    }
  },
  "regions": ["fra1"]     // ✅ Eklendi
}
```

**Test:**
- [ ] API endpoint'leri hızlı yanıt veriyor mu?
- [ ] Cold start süresi makul mü? (< 1 saniye)

### 8. Directory Listing Kontrolü

**Test:**
```powershell
# Directory listing test (kapalı olmalı)
curl https://egitim.today/assets/
```

**Beklenen:**
- `403 Forbidden` veya `404 Not Found` (directory listing kapalı)

### 9. Redirect Limits Kontrolü

**vercel.json Kontrolü:**
- [ ] `redirects` array'i yok veya 1,024'ten az
- [ ] `rewrites` kullanılıyor (redirect limit'ini etkilemez)

**Mevcut Durum:**
- ✅ Sadece `rewrites` kullanılıyor
- ✅ Redirect limit kullanılmıyor

## Hızlı Test Script

### PowerShell Test Script:

```powershell
# Domain DNS Test
Write-Host "=== DNS Test ===" -ForegroundColor Cyan
nslookup egitim.today

# HTTPS Test
Write-Host "`n=== HTTPS Test ===" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "https://egitim.today" -Method Head -UseBasicParsing
Write-Host "Status: $($response.StatusCode)"
Write-Host "SSL: Valid"

# HTTP Redirect Test
Write-Host "`n=== HTTP Redirect Test ===" -ForegroundColor Cyan
try {
    $httpResponse = Invoke-WebRequest -Uri "http://egitim.today" -Method Head -UseBasicParsing -MaximumRedirection 0
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::MovedPermanently -or 
        $_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Found) {
        Write-Host "HTTP to HTTPS redirect: Working" -ForegroundColor Green
    }
}

# API Health Check
Write-Host "`n=== API Health Check ===" -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "https://egitim.today/api/health" -UseBasicParsing
    Write-Host "API Status: $($apiResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($apiResponse.Content)"
} catch {
    Write-Host "API Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

## Vercel Dashboard Linkleri Özeti

### Domain Yönetimi:
- **Domain Settings:** https://vercel.com/metinbahdats-projects/learn-connect/settings/domains
- **Domain Overview:** https://vercel.com/metinbahdats-projects/learn-connect/domains

### Deployment Yönetimi:
- **Deployments:** https://vercel.com/metinbahdats-projects/learn-connect/deployments
- **Latest Deployment:** En üstteki deployment

### Build Settings:
- **Build & Deployment:** https://vercel.com/metinbahdats-projects/learn-connect/settings/git
- **Build Logs:** Deployment sayfasında "Build Logs" sekmesi

### Function Settings:
- **Functions:** https://vercel.com/metinbahdats-projects/learn-connect/settings/functions
- **Environment Variables:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

## Başarı Kriterleri

### ✅ Domain Çalışıyor:
- [ ] https://egitim.today yükleniyor
- [ ] SSL sertifikası geçerli
- [ ] HTTP'den HTTPS'e redirect çalışıyor

### ✅ Deployment Atanmış:
- [ ] Domain production deployment'a assign edilmiş
- [ ] Deployment "Ready" durumunda
- [ ] Build başarılı

### ✅ DNS Doğru:
- [ ] DNS kayıtları Vercel'in önerdiği değerlerle eşleşiyor
- [ ] nslookup doğru IP/CNAME gösteriyor

### ✅ Performans:
- [ ] Cold start süresi < 1 saniye
- [ ] API endpoint'leri hızlı yanıt veriyor
- [ ] Sayfa yüklenme süresi makul

## Sorun Giderme

### Domain Yüklenmiyorsa:
1. DNS kayıtlarını kontrol et
2. DNS propagation bekle (24-48 saat)
3. Vercel Dashboard'da domain durumunu kontrol et
4. SSL sertifikası durumunu kontrol et

### Deployment Atanmamışsa:
1. Settings → Domains → egitim.today
2. "Assign to Production" butonuna tıkla
3. Veya deployment sayfasından domain'i manuel assign et

### DNS Kayıtları Yanlışsa:
1. Domain sağlayıcınızın DNS panelinden düzelt
2. Vercel Dashboard'dan önerilen DNS kayıtlarını kullan
3. TTL değerini düşür (3600 veya daha az)
4. 24-48 saat bekle (DNS propagation)
