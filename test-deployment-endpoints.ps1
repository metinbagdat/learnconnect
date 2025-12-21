# Post-Deployment Endpoint Testing Script
# Run this after deployment to verify everything works

param(
    [string]$Domain = "https://learn-connect.vercel.app"  # Change to your domain
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Post-Deployment Verification Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic Health Check
Write-Host "Test 1: Basic Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$Domain/api/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $($response.uptime)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Detailed Health Check
Write-Host "Test 2: Detailed Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$Domain/api/health/detailed" -Method Get -ErrorAction Stop
    Write-Host "✅ Detailed health check passed" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Database: $($response.database)" -ForegroundColor $(if ($response.database -eq "connected") { "Green" } else { "Yellow" })
    Write-Host "   Environment: $($response.environment)" -ForegroundColor Gray
    Write-Host "   Node Version: $($response.nodeVersion)" -ForegroundColor Gray
    
    if ($response.database -ne "connected") {
        Write-Host "⚠️  WARNING: Database not connected!" -ForegroundColor Yellow
        Write-Host "   Check DATABASE_URL environment variable" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Detailed health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login Endpoint (should NOT return 500)
Write-Host "Test 3: Login Endpoint" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$Domain/api/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Login endpoint works (200 OK)" -ForegroundColor Green
        $jsonResponse = $response.Content | ConvertFrom-Json
        Write-Host "   User: $($jsonResponse.username)" -ForegroundColor Gray
    } elseif ($response.StatusCode -eq 401) {
        Write-Host "✅ Login endpoint works (401 - Invalid credentials, expected)" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 400) {
        Write-Host "✅ Login endpoint works (400 - Missing credentials, expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 500) {
        Write-Host "❌ CRITICAL: Login endpoint returns 500!" -ForegroundColor Red
        Write-Host "   This should be fixed. Check function logs." -ForegroundColor Red
    } elseif ($statusCode -eq 401) {
        Write-Host "✅ Login endpoint works (401 - Not authenticated, expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Login endpoint error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: User Endpoint (should NOT return 500)
Write-Host "Test 4: User Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$Domain/api/user" -Method Get -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ User endpoint works (200 OK - Authenticated)" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 401) {
        Write-Host "✅ User endpoint works (401 - Not authenticated, expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 500) {
        Write-Host "❌ CRITICAL: User endpoint returns 500!" -ForegroundColor Red
        Write-Host "   This should be fixed. Check function logs." -ForegroundColor Red
    } elseif ($statusCode -eq 401) {
        Write-Host "✅ User endpoint works (401 - Not authenticated, expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  User endpoint error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Vercel function logs for any errors" -ForegroundColor White
Write-Host "2. Verify environment variables are set:" -ForegroundColor White
Write-Host "   - DATABASE_URL (Production)" -ForegroundColor Gray
Write-Host "   - SESSION_SECRET (Production)" -ForegroundColor Gray
Write-Host "3. Test login flow in browser" -ForegroundColor White
Write-Host "4. Monitor for 24 hours" -ForegroundColor White
Write-Host ""

