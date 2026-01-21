# Firebase Environment Variables Setup Script
# This script helps set up Firebase environment variables

Write-Host "🔥 Firebase Environment Variables Setup" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $envFile -Force | Out-Null
}

# Read current .env content
$currentContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue

# Check if Firebase vars already exist
if ($currentContent -match "VITE_FIREBASE_API_KEY") {
    Write-Host "⚠️  Firebase environment variables already exist in .env" -ForegroundColor Yellow
    Write-Host "Please update them with your actual Firebase config values." -ForegroundColor Yellow
} else {
    Write-Host "Adding Firebase environment variables to .env..." -ForegroundColor Green
    
    $firebaseConfig = @"

# Firebase Configuration
# Get these values from: https://console.firebase.google.com/
# Project Settings > General > Your apps > Web app config
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
"@

    Add-Content -Path $envFile -Value $firebaseConfig
    Write-Host "[OK] Firebase environment variables added!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://console.firebase.google.com/" -ForegroundColor White
    Write-Host "2. Select your project (or create a new one)" -ForegroundColor White
    Write-Host "3. Go to Project Settings > General" -ForegroundColor White
    Write-Host "4. Scroll to 'Your apps' section" -ForegroundColor White
    Write-Host "5. Click on Web app (or add one if it doesn't exist)" -ForegroundColor White
    Write-Host "6. Copy the config values and paste them into .env file" -ForegroundColor White
}

Write-Host ""
Write-Host "[OK] Setup complete!" -ForegroundColor Green
