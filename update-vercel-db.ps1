# Update DATABASE_URL in Vercel with Pooler Connection String
# This script guides you through updating the DATABASE_URL

Write-Host "🔧 DATABASE_URL Update Guide for Vercel" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Step 1: Get Pooler Connection String from Neon" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Neon Console:" -ForegroundColor White
Write-Host "   https://console.neon.tech/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Select your project" -ForegroundColor White
Write-Host ""
Write-Host "3. Go to 'Connection Details' or 'Dashboard'" -ForegroundColor White
Write-Host ""
Write-Host "4. Look for 'Connection string' section" -ForegroundColor White
Write-Host ""
Write-Host "5. ⚠️  IMPORTANT: Click on 'Pooler' or 'Connection pooling' tab" -ForegroundColor Yellow
Write-Host "   (NOT 'Direct connection')" -ForegroundColor Red
Write-Host ""
Write-Host "6. Copy the connection string" -ForegroundColor White
Write-Host "   It should look like:" -ForegroundColor White
Write-Host "   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Press Enter when you have the pooler connection string copied"

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Step 2: Update in Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor White
Write-Host "1. Update via Vercel CLI (recommended)" -ForegroundColor Cyan
Write-Host "2. Update via Vercel Dashboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "Enter 1 for CLI or 2 for Dashboard" -ForegroundColor White
$choice = Read-Host "Choice"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🔄 Updating via CLI..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You'll be prompted to:" -ForegroundColor White
    Write-Host "1. Paste your pooler connection string" -ForegroundColor White
    Write-Host "2. Type 'y' when asked 'Mark as sensitive?'" -ForegroundColor White
    Write-Host ""
    
    $confirm = Read-Host "Ready to proceed? (y/n)"
    if ($confirm -eq "y") {
        Write-Host ""
        Write-Host "Running: vercel env add DATABASE_URL production" -ForegroundColor Gray
        vercel env add DATABASE_URL production
    } else {
        Write-Host "Cancelled. You can run this manually later." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "📝 Update via Dashboard:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open:" -ForegroundColor White
    Write-Host "   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Find DATABASE_URL (Production)" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Click 'Edit' or remove and add new" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Paste your pooler connection string" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Select 'Production' environment" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Click 'Save'" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Step 3: Redeploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "After updating DATABASE_URL, you need to redeploy:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to:" -ForegroundColor White
Write-Host "   https://vercel.com/metinbahdats-projects/learn-connect/deployments" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Click '...' on the latest deployment" -ForegroundColor White
Write-Host ""
Write-Host "3. Click 'Redeploy'" -ForegroundColor White
Write-Host ""
Write-Host "4. Wait for deployment to complete" -ForegroundColor White
Write-Host ""

$redeploy = Read-Host "Would you like to open the deployments page now? (y/n)"
if ($redeploy -eq "y") {
    Start-Process "https://vercel.com/metinbahdats-projects/learn-connect/deployments"
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Done! After redeploying, test your app:" -ForegroundColor Green
Write-Host "   https://learn-connect.vercel.app/api/health" -ForegroundColor Cyan
Write-Host ""

