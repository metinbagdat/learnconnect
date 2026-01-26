# Deploy Firestore Indexes Script (PowerShell)
# This script deploys Firestore indexes using Firebase CLI

Write-Host "🚀 Deploying Firestore Indexes..." -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version 2>&1
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    firebase projects:list 2>&1 | Out-Null
    Write-Host "✅ Logged in to Firebase" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not logged in to Firebase. Please run: firebase login" -ForegroundColor Yellow
    Write-Host "Running firebase login..." -ForegroundColor Yellow
    firebase login
}

# Deploy indexes
Write-Host ""
Write-Host "📦 Deploying indexes from firestore.indexes.json..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Firestore indexes deployed successfully!" -ForegroundColor Green
    Write-Host "⏳ Indexes may take 5-10 minutes to build." -ForegroundColor Yellow
    Write-Host "You can check status in Firebase Console → Firestore → Indexes" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Failed to deploy indexes. Check the error above." -ForegroundColor Red
    exit 1
}
