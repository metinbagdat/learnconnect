# LearnConnect Deployment Test Script
# Tests all deployment aspects as outlined in DEPLOYMENT_ANALYSIS.md

$ErrorActionPreference = "Continue"
$testResults = @()

# Set TLS 1.2 for all requests
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
[Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

# Get deployment URL - allow override via parameter or environment variable
param(
    [string]$DeploymentUrl = $null
)

$baseUrl = $DeploymentUrl
if (-not $baseUrl) {
    $baseUrl = $env:DEPLOYMENT_URL
}
if (-not $baseUrl) {
    # Try to get from Vercel CLI
    Write-Host "Attempting to get deployment URL from Vercel..." -ForegroundColor Gray
    try {
        $vercelInfo = vercel inspect --json 2>&1
        if ($LASTEXITCODE -eq 0 -and $vercelInfo) {
            $info = $vercelInfo | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($info -and $info.url) {
                $baseUrl = "https://$($info.url)"
                Write-Host "Found deployment URL: $baseUrl" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "Could not get URL from Vercel CLI" -ForegroundColor Yellow
    }
}

# Fallback to default URL
if (-not $baseUrl) {
    $baseUrl = "https://learn-connect.vercel.app"
    Write-Host "Using default URL: $baseUrl" -ForegroundColor Yellow
    Write-Host "To use a different URL, run: .\test-deployment.ps1 -DeploymentUrl 'https://your-url.vercel.app'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Testing deployment at: $baseUrl" -ForegroundColor Cyan
Write-Host ""

Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LearnConnect Deployment Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to log test results
function Log-Test {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    $result = @{
        Test = $TestName
        Passed = $Passed
        Details = $Details
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    $script:testResults += $result
    
    $status = if ($Passed) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }
    Write-Host "$status - $TestName" -ForegroundColor $color
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
}

# Function to check HTTP headers
function Test-Headers {
    param(
        [string]$Url,
        [string[]]$RequiredHeaders,
        [string]$TestName
    )
    try {
        # Add retry logic and better error handling
        $maxRetries = 3
        $retryCount = 0
        $response = $null
        
        while ($retryCount -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                break
            } catch {
                $retryCount++
                if ($retryCount -ge $maxRetries) {
                    throw
                }
                Start-Sleep -Seconds 2
            }
        }
        $headers = $response.Headers
        
        $missing = @()
        $found = @()
        
        foreach ($header in $RequiredHeaders) {
            $headerName = $header.Split(':')[0].Trim()
            $headerValue = $header.Split(':')[1].Trim() -replace '"', ''
            
            if ($headers.ContainsKey($headerName)) {
                $actualValue = $headers[$headerName]
                if ($actualValue -like "*$headerValue*" -or $headerValue -eq "*") {
                    $found += "${headerName}: $actualValue"
                } else {
                    $missing += "${headerName} (expected: $headerValue, got: $actualValue)"
                }
            } else {
                $missing += $headerName
            }
        }
        
        $passed = $missing.Count -eq 0
        $details = if ($passed) {
            "Found: $($found -join ', ')"
        } else {
            "Missing: $($missing -join ', ')"
        }
        
        Log-Test -TestName $TestName -Passed $passed -Details $details
        return $passed
    }
    catch {
        Log-Test -TestName $TestName -Passed $false -Details "Error: $($_.Exception.Message)"
        return $false
    }
}

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Endpoint,
        [string]$TestName,
        [string]$Method = "GET"
    )
    try {
        $url = "$baseUrl$Endpoint"
        
        # Add retry logic
        $maxRetries = 3
        $retryCount = 0
        $response = $null
        
        while ($retryCount -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri $url -Method $Method -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                break
            } catch {
                $retryCount++
                if ($retryCount -ge $maxRetries) {
                    throw
                }
                Start-Sleep -Seconds 2
            }
        }
        
        $passed = $response.StatusCode -eq 200
        $details = "Status: $($response.StatusCode), Response Time: $($response.Headers['X-Response-Time'])"
        
        # Try to parse JSON response
        try {
            $json = $response.Content | ConvertFrom-Json
            if ($json.status -eq "success" -or $json.status -eq "ok") {
                $details += ", Valid JSON response"
            }
        } catch {
            # Not JSON, that's okay
        }
        
        Log-Test -TestName $TestName -Passed $passed -Details $details
        return $passed
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "N/A" }
        Log-Test -TestName $TestName -Passed $false -Details "Error: $($_.Exception.Message) (Status: $statusCode)"
        return $false
    }
}

Write-Host "1. FUNCTIONALITY TESTING" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check Endpoint
Write-Host "Testing Health Check Endpoint..." -ForegroundColor Gray
Test-ApiEndpoint -Endpoint "/api/system/health" -TestName "Health Check Endpoint"

# Test 2: System Metrics Endpoint (may require auth)
Write-Host "Testing System Metrics Endpoint..." -ForegroundColor Gray
Test-ApiEndpoint -Endpoint "/api/system/metrics" -TestName "System Metrics Endpoint"

# Test 3: Root URL Accessibility
Write-Host "Testing Root URL..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -ErrorAction Stop
    Log-Test -TestName "Root URL Accessibility" -Passed ($response.StatusCode -eq 200) -Details "Status: $($response.StatusCode)"
} catch {
    Log-Test -TestName "Root URL Accessibility" -Passed $false -Details "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "2. SECURITY HEADERS TESTING" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""

# Test Security Headers
Write-Host "Testing Security Headers..." -ForegroundColor Gray
$securityHeaders = @(
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
    "X-XSS-Protection: 1; mode=block",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy: *"
)

Test-Headers -Url $baseUrl -RequiredHeaders $securityHeaders -TestName "Security Headers Verification"

Write-Host ""
Write-Host "3. CACHING HEADERS TESTING" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow
Write-Host ""

# Test Caching Headers for static assets
Write-Host "Testing Static Asset Caching..." -ForegroundColor Gray
try {
    # Try to get a static asset (this might not exist, but we'll test the pattern)
    $assetUrl = "$baseUrl/assets/test.js"
    $response = Invoke-WebRequest -Uri $assetUrl -Method Head -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($response) {
        $cacheControl = $response.Headers["Cache-Control"]
        $hasCache = $cacheControl -like "*max-age=31536000*" -or $cacheControl -like "*immutable*"
        Log-Test -TestName "Static Asset Caching" -Passed $hasCache -Details "Cache-Control: $cacheControl"
    } else {
        Log-Test -TestName "Static Asset Caching" -Passed $false -Details "Could not test (asset may not exist)"
    }
} catch {
    Log-Test -TestName "Static Asset Caching" -Passed $false -Details "Error: $($_.Exception.Message)"
}

# Test HTML no-cache
Write-Host "Testing HTML Cache Control..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Head -UseBasicParsing -ErrorAction Stop
    $cacheControl = $response.Headers["Cache-Control"]
    $noCache = $cacheControl -like "*max-age=0*" -or $cacheControl -like "*must-revalidate*" -or $cacheControl -like "*no-cache*"
    Log-Test -TestName "HTML Cache Control" -Passed $noCache -Details "Cache-Control: $cacheControl"
} catch {
    Log-Test -TestName "HTML Cache Control" -Passed $false -Details "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "4. PERFORMANCE TESTING" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host ""

# Test Response Times
Write-Host "Testing Response Times..." -ForegroundColor Gray
$endpoints = @(
    @{ Path = "/"; Name = "Homepage" },
    @{ Path = "/api/system/health"; Name = "Health API" }
)

foreach ($endpoint in $endpoints) {
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $maxRetries = 3
        $retryCount = 0
        $response = $null
        
        while ($retryCount -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri "$baseUrl$($endpoint.Path)" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                break
            } catch {
                $retryCount++
                if ($retryCount -ge $maxRetries) {
                    throw
                }
                Start-Sleep -Seconds 2
            }
        }
        $stopwatch.Stop()
        
        $responseTime = $stopwatch.ElapsedMilliseconds
        $passed = $responseTime -lt 2000  # Less than 2 seconds
        $details = "Response Time: ${responseTime}ms (Target: <2000ms)"
        
        Log-Test -TestName "$($endpoint.Name) Response Time" -Passed $passed -Details $details
    } catch {
        Log-Test -TestName "$($endpoint.Name) Response Time" -Passed $false -Details "Error: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "5. CORS POLICY TESTING" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host ""

# Test CORS Headers
Write-Host "Testing CORS Headers..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/system/health" -Method Head -UseBasicParsing -ErrorAction Stop
    $corsHeaders = @("Access-Control-Allow-Origin", "Access-Control-Allow-Methods", "Access-Control-Allow-Headers")
    
    $found = @()
    $missing = @()
    
    foreach ($header in $corsHeaders) {
        if ($response.Headers.ContainsKey($header)) {
            $found += $header
        } else {
            $missing += $header
        }
    }
    
    # CORS headers are optional for same-origin, so we'll just log what we find
    $details = if ($found.Count -gt 0) {
        "Found: $($found -join ', ')"
    } else {
        "No CORS headers (may be same-origin only)"
    }
    
    Log-Test -TestName "CORS Headers" -Passed $true -Details $details
} catch {
    Log-Test -TestName "CORS Headers" -Passed $false -Details "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Passed -eq $true }).Count
$failedTests = $totalTests - $passedTests
$passRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Yellow" })
Write-Host ""

# Show failed tests
if ($failedTests -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Passed -eq $false } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Details)" -ForegroundColor Red
    }
    Write-Host ""
}

# Save results to file
$resultsFile = "deployment-test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$testResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $resultsFile -Encoding UTF8
Write-Host "Results saved to: $resultsFile" -ForegroundColor Gray
Write-Host ""

# Final status
if ($failedTests -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  SOME TESTS FAILED - Review results above" -ForegroundColor Yellow
    exit 1
}
