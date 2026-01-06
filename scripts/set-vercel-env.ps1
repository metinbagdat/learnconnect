# PowerShell script to set Vercel environment variables for PRODUCTION
# Run this script to add all required environment variables to Vercel PRODUCTION environment
# 
# IMPORTANT: This script sets variables for PRODUCTION environment only.
# If a variable already exists for Preview, you need to edit it in dashboard to also include Production.

param(
    [switch]$ProductionOnly = $true
)

Write-Host "🚀 Setting Vercel Environment Variables for PRODUCTION..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  URGENT: ANTHROPIC_API_KEY is currently only set for Preview!" -ForegroundColor Red
Write-Host "   This script will set it for Production environment." -ForegroundColor Yellow
Write-Host ""

# Check if Vercel CLI is installed
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
    Write-Host "Alternatively, set variables manually in dashboard:" -ForegroundColor Yellow
    Write-Host "  https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Cyan
    exit 1
}

# CRITICAL Environment variables (server will fail without these)
# These MUST be set for Production
$criticalVars = @{
    "ANTHROPIC_API_KEY" = "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"
    "ANTHROPIC_MODEL" = "claude-3-5-sonnet-20241022"
    "SESSION_SECRET" = "ODMkyN2DtScq3lqRygfxvC8WCd2WPmIiZKG6dFd/Jl0="
}

# Optional but recommended environment variables
$optionalVars = @{
    "OPENAI_API_KEY" = "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"
    "DEEPSEEK_API_KEY" = "sk-e67063c2b0434270ad78333f531fee7d"
    "STRIPE_SECRET_KEY" = "sk_test_51RDRaOQx5TUeWOnWh7XgcYRoD2zYdZFa27svPuX3QpWpW6b8De6wbBDBRzf1MPx18I2ZxSFBxKb30lIfOGXR7b19000peRZKCe"
    "STRIPE_PUBLISHABLE_KEY" = "pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx"
    "VITE_STRIPE_PUBLIC_KEY" = "pk_test_51RDRaOQx5TUeWOnWAkiLB4exPzJVaZW0jJ2drUUvStLDjuYgHCCL2bKKG3TsmN666TlcV2TbRWu9wGKZlBN83FWY00uPKMLpPx"
}

Write-Host "📝 Setting CRITICAL environment variables for PRODUCTION..." -ForegroundColor Yellow
Write-Host "   (Server will fail without these)" -ForegroundColor Gray
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($key in $criticalVars.Keys) {
    Write-Host "Setting $key for Production..." -ForegroundColor Yellow
    $value = $criticalVars[$key]
    
    # Use Vercel CLI to set environment variable for production
    # Note: If variable already exists, this may prompt to overwrite or add to production
    $result = echo $value | vercel env add $key production 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $key set successfully for Production" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Failed to set $key" -ForegroundColor Red
        Write-Host "  Error output: $result" -ForegroundColor Gray
        Write-Host "  💡 If variable already exists, edit it in dashboard to include Production" -ForegroundColor Yellow
        $failCount++
    }
    Write-Host ""
}

Write-Host "📝 Setting optional environment variables for PRODUCTION..." -ForegroundColor Cyan
Write-Host ""

foreach ($key in $optionalVars.Keys) {
    Write-Host "Setting $key (optional)..." -ForegroundColor Gray
    $value = $optionalVars[$key]
    
    $result = echo $value | vercel env add $key production 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $key set successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Failed to set $key (optional, can set manually)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

if ($successCount -eq $criticalVars.Count) {
    Write-Host "✅ All critical variables set successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some critical variables failed to set ($successCount/$($criticalVars.Count) succeeded)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If variables already exist, you need to:" -ForegroundColor Yellow
    Write-Host "  1. Go to Vercel Dashboard" -ForegroundColor Gray
    Write-Host "  2. Edit each variable" -ForegroundColor Gray
    Write-Host "  3. Check 'Production' checkbox" -ForegroundColor Gray
    Write-Host "  4. Save" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚨 CRITICAL: You MUST also set DATABASE_URL manually!" -ForegroundColor Red
Write-Host ""
Write-Host "DATABASE_URL cannot be set via CLI (security reasons)." -ForegroundColor Yellow
Write-Host "Set it in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "  https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "Required format:" -ForegroundColor Yellow
Write-Host "  postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Gray
Write-Host "  (Must include '-pooler' in hostname!)" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Production Environment Variables Checklist:" -ForegroundColor Cyan
Write-Host "  [ ] DATABASE_URL → Production" -ForegroundColor Gray
Write-Host "  [ ] ANTHROPIC_API_KEY → Production" -ForegroundColor Gray
Write-Host "  [ ] ANTHROPIC_MODEL → Production" -ForegroundColor Gray
Write-Host "  [ ] SESSION_SECRET → Production" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify all variables are set for Production in dashboard" -ForegroundColor Gray
Write-Host "  2. Redeploy application:" -ForegroundColor Gray
Write-Host "     - Option A: Vercel Dashboard → Latest Deployment → Redeploy" -ForegroundColor Gray
Write-Host "     - Option B: git push origin main" -ForegroundColor Gray
Write-Host "  3. Test deployment:" -ForegroundColor Gray
Write-Host "     .\scripts\test-deployment-comprehensive.ps1" -ForegroundColor Gray
Write-Host ""

