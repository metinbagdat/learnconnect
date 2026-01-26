# Complete Deployment Script for LearnConnect
# This script handles all deployment steps

param(
    [switch]$SkipRules,
    [switch]$SkipAdmin,
    [switch]$SkipSeed,
    [switch]$SkipVercel
)

Write-Host "🚀 LearnConnect Deployment Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Deploy Firestore Rules
if (-not $SkipRules) {
    Write-Host "📋 Step 1: Deploying Firestore Rules..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Firebase CLI is installed
    $firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
    if (-not $firebaseInstalled) {
        Write-Host "⚠️  Firebase CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g firebase-tools
    }
    
    # Check if logged in
    Write-Host "Checking Firebase login status..." -ForegroundColor Gray
    try {
        firebase projects:list 2>&1 | Out-Null
        Write-Host "✅ Firebase CLI is logged in" -ForegroundColor Green
    } catch {
        Write-Host "🔐 Please login to Firebase..." -ForegroundColor Yellow
        firebase login
    }
    
    # Deploy rules
    Write-Host "Deploying Firestore rules..." -ForegroundColor Gray
    firebase deploy --only firestore:rules
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Firestore rules deployment failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Firestore rules deployment" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Setup Admin (if needed)
if (-not $SkipAdmin) {
    Write-Host "📋 Step 2: Admin Setup..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To setup admin, run:" -ForegroundColor Yellow
    Write-Host "  1. Create admin in PostgreSQL:" -ForegroundColor White
    Write-Host "     ts-node server/create-admin.ts admin@learnconnect.com Admin123! `"System Admin`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Add admin to Firestore:" -ForegroundColor White
    Write-Host "     ts-node scripts/setup-firestore-admin.ts <uid> admin@learnconnect.com `"System Admin`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Enter to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "⏭️  Skipping admin setup" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Seed Curriculum
if (-not $SkipSeed) {
    Write-Host "📋 Step 3: Seeding MEB Curriculum..." -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-Path "scripts/service-account-key.json")) {
        Write-Host "❌ Service account key not found at scripts/service-account-key.json" -ForegroundColor Red
        Write-Host "   Please download it from Firebase Console and place it in the scripts folder." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Running seed script..." -ForegroundColor Gray
    ts-node scripts/seed-firestore-curriculum.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Curriculum seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Curriculum seeding failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping curriculum seeding" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Deploy to Vercel
if (-not $SkipVercel) {
    Write-Host "📋 Step 4: Deploying to Vercel..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Vercel CLI is installed
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g vercel
    }
    
    # Check if logged in to Vercel
    Write-Host "Checking Vercel login status..." -ForegroundColor Gray
    try {
        vercel whoami 2>&1 | Out-Null
        Write-Host "✅ Vercel CLI is logged in" -ForegroundColor Green
    } catch {
        Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
        vercel login
    }
    
    # Deploy to production
    Write-Host "Deploying to Vercel production..." -ForegroundColor Gray
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment to Vercel successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Vercel deployment failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Vercel deployment" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test admin login at your deployed URL" -ForegroundColor White
Write-Host "  2. Verify Firestore data in Firebase Console" -ForegroundColor White
Write-Host "  3. Test AI curriculum generation features" -ForegroundColor White
Write-Host "  4. Review deployment logs in Vercel dashboard" -ForegroundColor White
Write-Host ""
