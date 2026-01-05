# PowerShell script to test deployment endpoints
# Usage: .\scripts\test-endpoints.ps1 -BaseUrl "https://eğitim.today"

param(
    [string]$BaseUrl = "https://learn-connect-git-main-metinbahdats-projects.vercel.app"
)

Write-Host "🧪 Testing Deployment Endpoints" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

$ErrorActionPreference = "Continue"

# Test 1: Health Check
Write-Host "1. Testing /api/health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Health check passed (200 OK)" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Health check failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: AI Endpoint (Should return 401 - Unauthorized)
Write-Host "2. Testing /api/ai/adaptive-plan (expecting 401 Unauthorized)..." -ForegroundColor Yellow
try {
    $body = @{
        studentId = 1
        studentData = @{}
        progressData = @{}
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BaseUrl/api/ai/adaptive-plan" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ⚠️  Unexpected success (Status: $($response.StatusCode))" -ForegroundColor Yellow
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Authentication check passed (401 Unauthorized as expected)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Validation check passed (400 Bad Request - validation working)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 429) {
        Write-Host "   ✅ Rate limiting working (429 Too Many Requests)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# Test 3: Root endpoint
Write-Host "3. Testing root endpoint (/)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Root endpoint accessible (200 OK)" -ForegroundColor Green
        Write-Host "   Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Root endpoint failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests pass, deployment is working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - Check custom domain DNS if using eğitim.today" -ForegroundColor Gray
Write-Host "  - Verify environment variables in Vercel dashboard" -ForegroundColor Gray
Write-Host "  - Review runtime logs for any warnings" -ForegroundColor Gray

