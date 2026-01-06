# PowerShell script to clean build cache
# Usage: .\scripts\clean-build-cache.ps1

Write-Host "🧹 Cleaning build cache..." -ForegroundColor Cyan
Write-Host ""

# Vite cache
if (Test-Path ".\node_modules\.vite") {
    Remove-Item -Path ".\node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .vite cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .vite cache not found" -ForegroundColor Gray
}

# Dist folder
if (Test-Path ".\dist") {
    Remove-Item -Path ".\dist" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed dist folder" -ForegroundColor Green
} else {
    Write-Host "ℹ️  dist folder not found" -ForegroundColor Gray
}

# Vercel cache
if (Test-Path "\.vercel") {
    Remove-Item -Path "\.vercel" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .vercel cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .vercel cache not found" -ForegroundColor Gray
}

# Next.js cache (if exists)
if (Test-Path "\.next") {
    Remove-Item -Path "\.next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .next cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next cache not found" -ForegroundColor Gray
}

# Node modules cache
$npmCachePath = "$env:USERPROFILE\.npm"
if (Test-Path $npmCachePath) {
    Write-Host "ℹ️  npm cache found at $npmCachePath" -ForegroundColor Gray
    Write-Host "   Run 'npm cache clean --force' to clear it" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Build cache cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: npm run build" -ForegroundColor Cyan

