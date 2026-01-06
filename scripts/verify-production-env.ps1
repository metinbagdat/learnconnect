# PowerShell script to verify Production environment variables in Vercel
# This script checks if critical variables are set for Production environment

Write-Host "🔍 Verifying Production Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Vercel CLI not found. Using dashboard method instead." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To verify variables, go to:" -ForegroundColor Cyan
    Write-Host "  https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check that these variables show 'Production' in Environment column:" -ForegroundColor Yellow
    Write-Host "  ✅ DATABASE_URL" -ForegroundColor Gray
    Write-Host "  ✅ ANTHROPIC_API_KEY" -ForegroundColor Gray
    Write-Host "  ✅ ANTHROPIC_MODEL" -ForegroundColor Gray
    Write-Host "  ✅ SESSION_SECRET" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# List all environment variables
Write-Host "Fetching environment variables from Vercel..." -ForegroundColor Cyan
$envList = vercel env ls 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to list environment variables" -ForegroundColor Red
    Write-Host "Error: $envList" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  vercel login" -ForegroundColor Gray
    Write-Host "  vercel link" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Production Environment Variables Status" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Critical variables that must be set for Production
$criticalVars = @(
    "DATABASE_URL",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "SESSION_SECRET"
)

$allGood = $true

foreach ($varName in $criticalVars) {
    # Check if variable exists and is set for Production
    # Vercel CLI output format: VAR_NAME  Production,Preview  value...
    $matches = Select-String -InputObject $envList -Pattern "$varName\s+(Production|All)" -CaseSensitive
    
    if ($matches) {
        Write-Host "✅ $varName" -ForegroundColor Green
        $matchLine = $matches.Line
        # Extract environment info
        if ($matchLine -match "Production") {
            Write-Host "   Status: Set for Production" -ForegroundColor Gray
        } elseif ($matchLine -match "All") {
            Write-Host "   Status: Set for All Environments" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ $varName" -ForegroundColor Red
        Write-Host "   Status: NOT SET for Production" -ForegroundColor Red
        $allGood = $false
    }
    Write-Host ""
}

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "✅ All critical variables are set for Production!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Redeploy application" -ForegroundColor Gray
    Write-Host "  2. Test endpoints: .\scripts\test-deployment-comprehensive.ps1" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some critical variables are missing for Production!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix:" -ForegroundColor Yellow
    Write-Host "  1. Go to Vercel Dashboard:" -ForegroundColor Gray
    Write-Host "     https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. For each missing variable:" -ForegroundColor Gray
    Write-Host "     - If variable exists: Click Edit → Check 'Production' → Save" -ForegroundColor Gray
    Write-Host "     - If variable missing: Click 'Add New' → Set name/value → Select 'Production' → Save" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Or use script: .\scripts\set-vercel-env.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  4. After setting, redeploy:" -ForegroundColor Gray
    Write-Host "     - Vercel Dashboard → Latest Deployment → Redeploy" -ForegroundColor Gray
    Write-Host "     - Or: git push origin main" -ForegroundColor Gray
}

Write-Host ""

