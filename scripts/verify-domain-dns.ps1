# Domain DNS Doğrulama Scripti
# egitim.today için DNS kayıtlarını kontrol eder

Write-Host "=== egitim.today DNS Kontrolü ===" -ForegroundColor Cyan
Write-Host ""

# DNS cache temizle
Write-Host "DNS cache temizleniyor..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null

# Nameserver kontrolü
Write-Host "`n1. Nameserver Kontrolü:" -ForegroundColor Green
$nsResult = nslookup -type=ns egitim.today 8.8.8.8 2>&1
$nsResult | Select-String "nameserver"

# IP kontrolü
Write-Host "`n2. IP Adresi Kontrolü:" -ForegroundColor Green
$ipResult = nslookup egitim.today 8.8.8.8 2>&1
$ipAddresses = $ipResult | Select-String "Addresses:"
if ($ipAddresses) {
    Write-Host $ipAddresses -ForegroundColor White
    if ($ipAddresses -match "76\.76\.21\.|66\.33\.60\.") {
        Write-Host "✅ Vercel IP'leri bulundu!" -ForegroundColor Green
    } elseif ($ipAddresses -match "64\.29\.17\.") {
        Write-Host "⚠️  Hala eski IP'ler görünüyor. DNS propagation bekleniyor..." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Beklenmeyen IP'ler: $ipAddresses" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ IP adresi bulunamadı" -ForegroundColor Red
}

# CNAME kontrolü (www için)
Write-Host "`n3. www.egitim.today CNAME Kontrolü:" -ForegroundColor Green
$cnameResult = nslookup -type=cname www.egitim.today 8.8.8.8 2>&1
$cname = $cnameResult | Select-String "canonical name"
if ($cname) {
    Write-Host $cname -ForegroundColor White
    if ($cname -match "vercel-dns") {
        Write-Host "✅ Vercel CNAME bulundu!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CNAME Vercel'e yönlenmiyor" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  CNAME kaydı bulunamadı" -ForegroundColor Yellow
}

# Vercel deployment URL kontrolü
Write-Host "`n4. Vercel Deployment URL Testi:" -ForegroundColor Green
$vercelUrl = "https://learn-connect-7ixob8h4s-metinbahdats-projects.vercel.app"
try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Vercel deployment çalışıyor: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel deployment test edilemedi: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Kontrol Tamamlandı ===" -ForegroundColor Cyan
Write-Host "`nEğer IP'ler hala eski görünüyorsa:" -ForegroundColor Yellow
Write-Host "1. Vercel Dashboard'da domain'in projeye bağlı olduğundan emin ol" -ForegroundColor White
Write-Host "2. 15-30 dakika bekle (DNS propagation)" -ForegroundColor White
Write-Host "3. Bu scripti tekrar çalıştır" -ForegroundColor White
