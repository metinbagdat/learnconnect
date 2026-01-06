# Check Vercel Environment Variables
# Requires Vercel CLI: npm i -g vercel

Write-Host "Checking Vercel CLI installation..." -ForegroundColor Cyan

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with:" -ForegroundColor Yellow
    Write-Host "  npm i -g vercel" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then login:" -ForegroundColor Yellow
    Write-Host "  vercel login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then link project:" -ForegroundColor Yellow
    Write-Host "  vercel link" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or check environment variables in dashboard:" -ForegroundColor Yellow
    Write-Host "  https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green
Write-Host ""

Write-Host "Listing environment variables..." -ForegroundColor Cyan
Write-Host ""

# List all environment variables
$envList = vercel env ls 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $envList
    Write-Host ""
    Write-Host "Checking for critical variables..." -ForegroundColor Yellow
    
    # Check for critical variables
    $criticalVars = @("DATABASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "SESSION_SECRET")
    $foundVars = @()
    
    foreach ($var in $criticalVars) {
        if ($envList -match $var) {
            $foundVars += $var
            Write-Host "  ✅ $var found" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var NOT FOUND" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    if ($foundVars.Count -lt $criticalVars.Count) {
        Write-Host "⚠️  Missing critical variables!" -ForegroundColor Yellow
        Write-Host "Set them in Vercel dashboard or use scripts/set-vercel-env.ps1" -ForegroundColor Gray
    } else {
        Write-Host "✅ All critical variables found" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Failed to list environment variables" -ForegroundColor Red
    Write-Host "Error: $envList" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  vercel login" -ForegroundColor Gray
    Write-Host "  vercel link" -ForegroundColor Gray
}

