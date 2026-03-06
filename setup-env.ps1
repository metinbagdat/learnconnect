#!/usr/bin/env pwsh

# LearnConnect Environment Setup Script
# This script helps you easily update .env.local with your credentials

$envFile = ".\.env.local"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "LearnConnect Environment Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This script will help you update .env.local with your credentials`n"

# Check if .env.local exists
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local not found in current directory" -ForegroundColor Red
    Write-Host "Please run from: C:\Users\mb\Desktop\LearnConnect\learnconnect-" -ForegroundColor Yellow
    exit
}

# Firebase Setup
Write-Host "`n[1/3] FIREBASE CONFIGURATION" -ForegroundColor Yellow
Write-Host "Get these from Firebase Console > Project Settings > Web app`n"

$firebaseApiKey = Read-Host "Firebase API Key (leave blank to skip)"
if ($firebaseApiKey) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_API_KEY=.*', "VITE_FIREBASE_API_KEY=$firebaseApiKey" | Set-Content $envFile
    Write-Host "✓ Firebase API Key updated" -ForegroundColor Green
}

$firebaseAuthDomain = Read-Host "Firebase Auth Domain (leave blank to skip)"
if ($firebaseAuthDomain) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_AUTH_DOMAIN=.*', "VITE_FIREBASE_AUTH_DOMAIN=$firebaseAuthDomain" | Set-Content $envFile
    Write-Host "✓ Firebase Auth Domain updated" -ForegroundColor Green
}

$firebaseProjectId = Read-Host "Firebase Project ID (leave blank to skip)"
if ($firebaseProjectId) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_PROJECT_ID=.*', "VITE_FIREBASE_PROJECT_ID=$firebaseProjectId" | Set-Content $envFile
    Write-Host "✓ Firebase Project ID updated" -ForegroundColor Green
}

$firebaseStorageBucket = Read-Host "Firebase Storage Bucket (leave blank to skip)"
if ($firebaseStorageBucket) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_STORAGE_BUCKET=.*', "VITE_FIREBASE_STORAGE_BUCKET=$firebaseStorageBucket" | Set-Content $envFile
    Write-Host "✓ Firebase Storage Bucket updated" -ForegroundColor Green
}

$firebaseSenderId = Read-Host "Firebase Messaging Sender ID (leave blank to skip)"
if ($firebaseSenderId) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_MESSAGING_SENDER_ID=.*', "VITE_FIREBASE_MESSAGING_SENDER_ID=$firebaseSenderId" | Set-Content $envFile
    Write-Host "✓ Firebase Messaging Sender ID updated" -ForegroundColor Green
}

$firebaseAppId = Read-Host "Firebase App ID (leave blank to skip)"
if ($firebaseAppId) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_APP_ID=.*', "VITE_FIREBASE_APP_ID=$firebaseAppId" | Set-Content $envFile
    Write-Host "✓ Firebase App ID updated" -ForegroundColor Green
}

$firebaseMeasurementId = Read-Host "Firebase Measurement ID (leave blank to skip)"
if ($firebaseMeasurementId) {
    (Get-Content $envFile) -replace 'VITE_FIREBASE_MEASUREMENT_ID=.*', "VITE_FIREBASE_MEASUREMENT_ID=$firebaseMeasurementId" | Set-Content $envFile
    Write-Host "✓ Firebase Measurement ID updated" -ForegroundColor Green
}

# Database Setup
Write-Host "`n[2/3] DATABASE CONFIGURATION" -ForegroundColor Yellow
Write-Host "Get connection string from Neon or local PostgreSQL`n"

$databaseUrl = Read-Host "Database URL (leave blank to skip)"
if ($databaseUrl) {
    (Get-Content $envFile) -replace 'DATABASE_URL=.*', "DATABASE_URL=$databaseUrl" | Set-Content $envFile
    Write-Host "✓ Database URL updated" -ForegroundColor Green
}

# AI Services Setup
Write-Host "`n[3/3] AI SERVICES CONFIGURATION" -ForegroundColor Yellow
Write-Host "Get API keys from OpenAI, Anthropic, or OpenRouter`n"

$openaiKey = Read-Host "OpenAI API Key (leave blank to skip)"
if ($openaiKey) {
    (Get-Content $envFile) -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$openaiKey" | Set-Content $envFile
    Write-Host "✓ OpenAI API Key updated" -ForegroundColor Green
}

$anthropicKey = Read-Host "Anthropic API Key (leave blank to skip)"
if ($anthropicKey) {
    (Get-Content $envFile) -replace 'ANTHROPIC_API_KEY=.*', "ANTHROPIC_API_KEY=$anthropicKey" | Set-Content $envFile
    Write-Host "✓ Anthropic API Key updated" -ForegroundColor Green
}

$openrouterKey = Read-Host "OpenRouter API Key (optional, leave blank to skip)"
if ($openrouterKey) {
    (Get-Content $envFile) -replace 'AI_INTEGRATIONS_OPENROUTER_API_KEY=.*', "AI_INTEGRATIONS_OPENROUTER_API_KEY=$openrouterKey" | Set-Content $envFile
    Write-Host "✓ OpenRouter API Key updated" -ForegroundColor Green
}

# Final steps
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete! ✓" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:`n"
Write-Host "1. Verify .env.local was updated:"
Write-Host "   cat .\.env.local`n"
Write-Host "2. Restart the container:"
Write-Host "   docker restart learnconnect-app`n"
Write-Host "3. Check logs:"
Write-Host "   docker logs learnconnect-app --tail 20`n"
Write-Host "4. Open http://localhost:5173 in your browser`n"

Write-Host "For more help, see: SETUP_GUIDE.md" -ForegroundColor Yellow
