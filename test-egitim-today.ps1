# Test eğitim.today Production Domain
# Run this to test the login fix on production

$domain = "https://xn--eitim-k1a.today"  # eğitim.today encoded

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing eğitim.today Production Domain" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$domain/api/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Detailed Health
Write-Host "Test 2: Detailed Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$domain/api/health/detailed" -Method Get -ErrorAction Stop
    Write-Host "✅ Detailed health check passed" -ForegroundColor Green
    Write-Host "   Database: $($response.database)" -ForegroundColor $(if ($response.database -eq "connected") { "Green" } else { "Yellow" })
    
    if ($response.database -ne "connected") {
        Write-Host "⚠️  WARNING: Database not connected!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Detailed health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login Endpoint (CRITICAL)
Write-Host "Test 3: Login Endpoint (Should NOT return 500)" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$domain/api/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Login endpoint works (200 OK)" -ForegroundColor Green
        $jsonResponse = $response.Content | ConvertFrom-Json
        Write-Host "   User: $($jsonResponse.username)" -ForegroundColor Gray
    } elseif ($response.StatusCode -eq 401) {
        Write-Host "✅ Login endpoint works (401 - Invalid credentials, expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 500) {
        Write-Host "❌ CRITICAL: Login endpoint returns 500!" -ForegroundColor Red
        Write-Host "   Error: FUNCTION_INVOCATION_FAILED" -ForegroundColor Red
        Write-Host "   The fix may not be deployed to production yet." -ForegroundColor Yellow
        Write-Host "   Check Vercel deployment and function logs." -ForegroundColor Yellow
    } elseif ($statusCode -eq 401) {
        Write-Host "✅ Login endpoint works (401 - Not authenticated, expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If login still returns 500:" -ForegroundColor Yellow
Write-Host "1. Check Vercel Production deployment" -ForegroundColor White
Write-Host "2. Verify fix commit (db0cc8c) is deployed" -ForegroundColor White
Write-Host "3. Check function logs for actual error" -ForegroundColor White
Write-Host "4. Verify DATABASE_URL and SESSION_SECRET are set for Production" -ForegroundColor White
Write-Host ""

