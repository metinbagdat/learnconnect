# Comprehensive Deployment Test Script
# Tests multiple URLs and endpoints to diagnose deployment issues

param(
    [string[]]$Urls = @(
        "https://eğitim.today",
        "https://xn--etim-kia.today",
        "https://learn-connect-git-main-metinbarbats-projects.vercel.app"
    )
)

$ErrorActionPreference = "Continue"

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "Comprehensive Deployment Test" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

foreach ($baseUrl in $Urls) {
    Write-Host "`n" + ("-" * 70) -ForegroundColor Yellow
    Write-Host "Testing: $baseUrl" -ForegroundColor Yellow
    Write-Host ("-" * 70) -ForegroundColor Yellow
    Write-Host ""
    
    # Test 1: Health Check
    Write-Host "1. Health Check (/api/health)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ SUCCESS (200 OK)" -ForegroundColor Green
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host "   ❌ FAILED (HTTP $statusCode)" -ForegroundColor Red
        } else {
            Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Test 2: Root Endpoint
    Write-Host "`n2. Root Endpoint (/)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/" -Method GET -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ SUCCESS (200 OK)" -ForegroundColor Green
            Write-Host "   Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray
            Write-Host "   Content-Length: $($response.RawContentLength) bytes" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host "   ❌ FAILED (HTTP $statusCode)" -ForegroundColor Red
        } else {
            Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Test 3: AI Endpoint - No Auth (should return 401)
    Write-Host "`n3. AI Endpoint - No Auth (expecting 401)..." -ForegroundColor Cyan
    try {
        $body = @{
            studentId = 1
            studentData = @{}
            progressData = @{}
        } | ConvertTo-Json -Compress
        
        $response = Invoke-WebRequest -Uri "$baseUrl/api/ai/adaptive-plan" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        Write-Host "   ⚠️  Unexpected success (Status: $($response.StatusCode))" -ForegroundColor Yellow
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "   ✅ Expected 401 Unauthorized (authentication working)" -ForegroundColor Green
        } elseif ($statusCode -eq 400) {
            Write-Host "   ✅ Expected 400 Bad Request (validation working)" -ForegroundColor Green
        } elseif ($statusCode -eq 429) {
            Write-Host "   ✅ Rate limiting active (429 Too Many Requests)" -ForegroundColor Green
        } elseif ($statusCode) {
            Write-Host "   ⚠️  Status: $statusCode" -ForegroundColor Yellow
            try {
                $errorResponse = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorResponse)
                $errorBody = $reader.ReadToEnd()
                Write-Host "   Error: $errorBody" -ForegroundColor Gray
            } catch {
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Message -like "*bağlantı*" -or $_.Exception.Message -like "*connection*") {
                Write-Host "   💡 This might indicate:" -ForegroundColor Yellow
                Write-Host "      - Server is not responding" -ForegroundColor Gray
                Write-Host "      - Timeout issue" -ForegroundColor Gray
                Write-Host "      - Network connectivity problem" -ForegroundColor Gray
            }
        }
    }
    
    # Test 4: AI Endpoint - Invalid Payload (should return 400)
    Write-Host "`n4. AI Endpoint - Invalid Payload (expecting 400)..." -ForegroundColor Cyan
    try {
        $body = @{invalid="payload"} | ConvertTo-Json -Compress
        $response = Invoke-WebRequest -Uri "$baseUrl/api/ai/adaptive-plan" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        Write-Host "   ⚠️  Unexpected success (Status: $($response.StatusCode))" -ForegroundColor Yellow
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            Write-Host "   ✅ Expected 400 Bad Request (validation working)" -ForegroundColor Green
        } elseif ($statusCode) {
            Write-Host "   Status: $statusCode" -ForegroundColor Gray
        } else {
            Write-Host "   Connection issue: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""
Write-Host "If health check works but AI endpoint fails:" -ForegroundColor Yellow
Write-Host "  → Check ANTHROPIC_API_KEY is set in Production environment" -ForegroundColor Gray
Write-Host "  → Check ANTHROPIC_MODEL is set in Production environment" -ForegroundColor Gray
Write-Host "  → Review Vercel runtime logs for errors" -ForegroundColor Gray
Write-Host ""
Write-Host "If all endpoints fail:" -ForegroundColor Yellow
Write-Host "  → Check DATABASE_URL is set in Production" -ForegroundColor Gray
Write-Host "  → Check server startup logs in Vercel" -ForegroundColor Gray
Write-Host "  → Verify deployment completed successfully" -ForegroundColor Gray
Write-Host ""

