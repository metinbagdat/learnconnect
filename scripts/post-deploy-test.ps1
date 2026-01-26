# Post-Deploy Test Script
# Bu script deploy sonrası tüm endpoint'leri test eder

param(
    [string]$BaseUrl = "https://www.egitim.today"
)

Write-Host "🧪 Post-Deploy Test Başlatılıyor..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

# Test fonksiyonu
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$Description = ""
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray
    Write-Host "  Method: $Method" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "  ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        return $false
    }
}

# 1. Health Check
Write-Host "1️⃣ Health Check Testi" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$healthOk = Test-Endpoint -Url "$BaseUrl/health" -Description "Health Check"
Write-Host ""

# 2. Login Page
Write-Host "2️⃣ Login Page Testi" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$loginPageOk = Test-Endpoint -Url "$BaseUrl/login" -Description "Login Page"
Write-Host ""

# 3. Register Page
Write-Host "3️⃣ Register Page Testi" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$registerPageOk = Test-Endpoint -Url "$BaseUrl/register" -Description "Register Page"
Write-Host ""

# 4. Login API Test
Write-Host "4️⃣ Login API Testi" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$loginBody = @{
    username = "demo"
    password = "demo123"
} | ConvertTo-Json

$loginApiOk = Test-Endpoint -Url "$BaseUrl/api/login" -Method "POST" -Body $loginBody -Description "Login API"
Write-Host ""

# 5. Protected Route Test (should redirect)
Write-Host "5️⃣ Protected Route Testi (TYT Dashboard)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/tyt-dashboard" -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "  ⚠️  Redirect olmadı (beklenmeyen)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 302 -or $_.Exception.Response.StatusCode -eq 301) {
        Write-Host "  ✅ Redirect çalışıyor (Auth guard aktif)" -ForegroundColor Green
        $protectedRouteOk = $true
    } else {
        Write-Host "  ❌ Beklenmeyen durum" -ForegroundColor Red
        $protectedRouteOk = $false
    }
}
Write-Host ""

# Özet
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 TEST ÖZETİ" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$tests = @(
    @{Name="Health Check"; Result=$healthOk},
    @{Name="Login Page"; Result=$loginPageOk},
    @{Name="Register Page"; Result=$registerPageOk},
    @{Name="Login API"; Result=$loginApiOk},
    @{Name="Protected Route"; Result=$protectedRouteOk}
)

$passed = ($tests | Where-Object { $_.Result -eq $true }).Count
$total = $tests.Count

foreach ($test in $tests) {
    $status = if ($test.Result) { "✅" } else { "❌" }
    Write-Host "$status $($test.Name)" -ForegroundColor $(if ($test.Result) { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "Sonuç: $passed/$total test başarılı" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host ""

if ($passed -eq $total) {
    Write-Host "🎉 Tüm testler başarılı! Deploy başarılı." -ForegroundColor Green
} else {
    Write-Host "⚠️  Bazı testler başarısız. Lütfen kontrol edin." -ForegroundColor Yellow
    Write-Host "📝 Detaylar için browser console ve Vercel logs'u kontrol edin." -ForegroundColor Cyan
}

Write-Host ""
